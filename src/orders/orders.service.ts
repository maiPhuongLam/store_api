import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import { OrderRepository } from 'src/shared/repositories/order.repository';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { sendMail } from 'src/shared/utility/mail-handler';
import configuration from 'src/config/configuration';
import { CheckoutDtoArrDto } from './dto/checkout.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectStripe() private readonly stripeClient: Stripe,
    @Inject(OrderRepository) private readonly orderRepository: OrderRepository,
    @Inject(ProductRepository)
    private readonly productRepository: ProductRepository,
    @Inject(UserRepository) private readonly userRepository: UserRepository,
  ) {}

  async create(createOrderDto: Record<string, any>) {
    const orderExists = await this.orderRepository.getOrderDetailsBySessionId(
      createOrderDto?.checkoutSessionId,
    );
    if (orderExists) return true;

    return await this.orderRepository.createOrderInDB(createOrderDto);
  }

  async findAll(user: Record<string, any>, status?: string) {
    const existUser = await this.userRepository.getUserDetailsById(
      user._id.toString(),
    );
    const query = {} as Record<string, any>;
    if (existUser.type === 'customer') query.user = user._id;
    if (status) query.orderStatus = status;
    const result = await this.orderRepository.getAllOrders(query);
    return {
      message: 'Orders found',
      success: true,
      result,
    };
  }

  async findOne(id: string) {
    const result = await this.orderRepository.getOrderDetailsById(id);
    return {
      message: 'Order details fetched successfully',
      success: true,
      result: result,
    };
  }

  async fullfillOrder(id: string, updateOrderDto: Record<string, any>) {
    console.log('fullfillOrder :: ');
    return await this.orderRepository.updateOrderDetailsInDB(
      id,
      updateOrderDto,
    );
  }

  async checkout(checkoutBody: CheckoutDtoArrDto, user: Record<string, any>) {
    // check all items are in stock
    const lineItems = [];
    const cartItems = checkoutBody.checkoutDetails;
    for (let i = 0; i < cartItems.length; i++) {
      const inStockItems = await this.productRepository.getLicenseForASku(
        cartItems[i].skuId,
      );
      if (inStockItems && inStockItems.length > 0) {
        lineItems.push({
          price: cartItems[i].skuPriceId,
          quantity: cartItems[i].quantity,
          adjustable_quantity: {
            enabled: true,
            maximum: 5,
            minimum: 1,
          },
        });
      }
    }

    if (lineItems.length < 1) {
      throw new BadRequestException(
        'These products are not available right now',
      );
    }

    const session = await this.stripeClient.checkout.sessions.create({
      line_items: checkoutBody.checkoutDetails.map((item) => ({
        price: item.skuPriceId,
        quantity: item.quantity,
        adjustable_quantity: {
          enabled: true,
          maximum: 5,
          minimum: 1,
        },
      })),
      metadata: {
        user_id: user._id.toString(),
      },
      mode: 'payment',
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
      customer_email: user.email,
      success_url: configuration().stripe.successUrl,
      cancel_url: configuration().stripe.cancelUrl,
    });
    return {
      message: 'Payment checkout session successfully created',
      success: true,
      result: session.url,
    };
  }

  async webhookHandler(body: any, sig: any) {
    let event;
    try {
      event = await this.stripeClient.webhooks.constructEvent(
        body,
        sig,
        configuration().stripe.webhook_secret,
      );
    } catch (err) {
      throw new Error(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.async_payment_failed':
        const sessiond: Record<string, any> = event.data.object;
        const orderDataC = await this.createOrderObject(sessiond);
        await this.fullfillOrder(sessiond.id, orderDataC);
        break;
      case 'checkout.session.async_payment_succeeded':
        const sessions: Record<string, any> = event.data.object;
        // check order is already completed or not
        const orderExists =
          await this.orderRepository.getOrderDetailsBySessionId(sessions.id);
        const orderDataB = await this.createOrderObject(sessions);
        if (sessions.payment_status === 'paid') {
          if (orderExists.orderStatus === 'completed') return true;
          // get license for ordered items
          for (let i = 0; i < orderDataB.orderedItems.length; i++) {
            const item = orderDataB.orderedItems[i];
            // get license for item
            const license = await this.getLicense(
              orderDataB.orderId + '',
              item.skuCode,
              item.productId,
            );
            // add license to order
            orderDataB.orderedItems[i].license = license;
          }

          const orderDetailsB = await this.fullfillOrder(
            sessions.id,
            orderDataB,
          );
          await this.sendOrderEmail(
            orderDataB.customerEmail,
            orderDataB.orderId,
          );
        }
        break;
      case 'checkout.session.completed':
        const session: Record<string, any> = event.data.object;
        console.log(session);
        // check order is already completed or not
        const orderExistsB =
          await this.orderRepository.getOrderDetailsBySessionId(session.id);
        console.log(orderExistsB);
        if (orderExistsB) return true;
        const orderData = await this.createOrderObject(session);
        await this.create(orderData);
        if (session.payment_status === 'paid') {
          // get license for ordered items
          for (let i = 0; i < orderData.orderedItems.length; i++) {
            const item = orderData.orderedItems[i];
            // get license for item
            const license = await this.getLicense(
              orderData.orderId + '',
              item.skuCode,
              item.productId,
            );
            // add license to order
            orderData.orderedItems[i].license = license;
          }
          const orderDetails = await this.fullfillOrder(session.id, orderData);
          await this.sendOrderEmail(orderData.customerEmail, orderData.orderId);
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    return true;
  }

  // getLicense
  async getLicense(orderId: string, skuCode: string, productId: string) {
    console.log(orderId, skuCode, productId);
    const product =
      await this.productRepository.getProductDetailsById(productId);
    console.log(product);
    const skuDetails = await product.skuDetails.find(
      (sku: { skuCode: string }) => sku.skuCode === skuCode,
    );
    console.log(skuDetails);
    const license =
      await this.productRepository.updateLicenseKeysForProductSkuInDBV2(
        {
          product: productId,
          productSku: skuDetails._id,
          isSold: false,
        },
        {
          isSold: true,
          orderId,
        },
      );
    return license.licenseKey;
  }

  async sendOrderEmail(email: string, orderId: string) {
    await sendMail(
      email,
      'ORDER SUCCESS',
      `<h1>order: ${orderId} is success</h1>
      `,
    );
  }

  // create order object
  async createOrderObject(orderData: Record<string, any>) {
    const lineItems = await this.stripeClient.checkout.sessions.listLineItems(
      orderData.id,
    );

    const order = {
      orderId: Math.floor(new Date().valueOf() * Math.random()) + '',
      user: orderData.metadata?.user_id,
      customerAddress: orderData.customer_details?.address,
      customerEmail: orderData.customer_email,
      customerPhoneNumber: orderData.customer_details?.phone,
      paymnetInfo: {
        paymentMethod: orderData.payment_method_types[0],
        paymentIntentId: orderData.payment_intent,
        paymentDate: new Date(),
        paymnetFailureReason: '',
        paymentAmount: orderData.amount_total / 100,
        paymentStatus: orderData.payment_status,
      },
      orderDate: new Date(),
      checkoutSessionId: orderData.id,
      orderedItems: lineItems.data.map((item) => {
        item.price.metadata.quantity = item.quantity + '';
        return item.price.metadata;
      }),
    };
    return order;
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAIL = 'fail',
}

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export class OrderedItems {
  @Prop({ required: true })
  skuCode: string; // sku of the product
  @Prop({ required: true })
  quantity: number; // quantity of the product
  @Prop({ required: true })
  price: number; // price of the product
  @Prop({ required: true })
  validity: number; // validity of the product
  @Prop({ required: true })
  lifetime: boolean; // lifetime of the product
  @Prop({ required: true })
  productId: string; // product id of the product
  @Prop({ required: true })
  skuPriceId: string; // sku price id of the product
  @Prop({ required: true })
  productName: string; // product name of the product
}

@Schema({
  timestamps: true,
})
export class Order {
  @Prop({ required: true })
  orderId: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Products',
  })
  user: string;

  @Prop({ required: true, type: Object })
  customerAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };

  @Prop({ required: true })
  customerPhoneNumber: string;

  @Prop({ required: true })
  orderedItems: [OrderedItems];

  @Prop({ required: true, type: Object })
  paymnetInfo: {
    paymentMethod: string;
    paymentStatus: PaymentStatus;
    paymentAmount: number;
    paymentDate: Date;
    paymentIntentId: string;
    paymnetFailureReason: string;
  };
  @Prop({ default: OrderStatus.PENDING })
  orderStatus: OrderStatus;

  @Prop({ required: true })
  orderDate: Date;

  @Prop({ default: false })
  orderDelivered: boolean;

  @Prop({ default: false })
  isOrderDelivered: boolean;

  @Prop({ default: false })
  isOrderCancelled: boolean;

  @Prop({ default: '' })
  checkoutSessionId: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

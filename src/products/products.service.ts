import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import qsToMongo = require('qs-to-mongo');
import * as cloudinary from 'cloudinary';
import * as fs from 'fs';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { OrderRepository } from 'src/shared/repositories/order.repository';
import configuration from 'src/config/configuration';
import { CreateProductDto } from './dtos/create-product.dto';
import { GetProductQueryDto } from './dtos/get-product-query.dto';
import { ProductSkuDto, ProductSkuDtoArr } from './dtos/product-sku.dto';
@Injectable()
export class ProductsService {
  constructor(
    @Inject(ProductRepository)
    private readonly productRepository: ProductRepository,
    @Inject(OrderRepository) private readonly orderReposotory: OrderRepository,
    @InjectStripe() private readonly stripeClient: Stripe,
  ) {
    cloudinary.v2.config({
      cloud_name: configuration().cloundinary.cloud_name,
      api_key: configuration().cloundinary.api_key,
      api_secret: configuration().cloundinary.api_secret,
    });
  }

  // product image upload
  async uploadProductImage(id: string, file: any): Promise<any> {
    // delete old imgae if it has
    const product = await this.productRepository.getProductDetailsById(id);
    if (product.imageDetails?.public_id) {
      await cloudinary.v2.uploader.destroy(product.imageDetails.public_id, {
        invalidate: true,
      });
    }

    // upload file [image] to cloudinary
    const resOfCludinary = await cloudinary.v2.uploader.upload(file.path, {
      folder: configuration().cloundinary.folderPath,
      public_id: `${configuration().cloundinary.publicId_prefix}${Date.now()}`,
      transformation: [
        {
          width: configuration().cloundinary.bigSize.toString().split('x')[0],
          height: configuration().cloundinary.bigSize.toString().split('x')[1],
          crop: 'fill',
        },
        { quality: 'auto' },
      ],
    });

    // remove the file from local
    fs.unlinkSync(file.path);
    // update product image details in db
    await this.productRepository.updateProductImageDetailsInDB(id, {
      image: resOfCludinary.secure_url,
      imageDetails: resOfCludinary,
    });

    // update product in stripe
    await this.stripeClient.products.update(product.stripeProductId, {
      images: [resOfCludinary.secure_url],
    });

    return {
      message: 'Product image uploaded successfully',
      success: true,
      result: resOfCludinary.secure_url,
    };
  }

  // create a new product
  async create(createProductDto: CreateProductDto): Promise<{
    message: string;
    result: Record<string, any>;
  }> {
    // create products in stripe
    const creratProductInStripe = await this.stripeClient.products.create({
      name: createProductDto.productName,
      description: createProductDto.description,
    });

    createProductDto.stripeProductId = creratProductInStripe.id;

    const createdProduct =
      await this.productRepository.createProductInDB(createProductDto);

    return {
      message: 'Product created successfully',
      result: createdProduct,
    };
  }

  // update a new product
  async updateProduct(
    id: string,
    updateProductDto: CreateProductDto,
  ): Promise<{
    message: string;
    result: Record<string, any>;
  }> {
    // check product is exists or not
    const existproduct = await this.productRepository.getProductDetailsById(id);

    const updatedProduct =
      await this.productRepository.updateProductDetailsInDB(
        id,
        updateProductDto,
      );
    // update product in stripe
    await this.stripeClient.products.update(existproduct.stripeProductId, {
      name: updateProductDto.productName,
      description: updateProductDto.description,
    });
    return {
      message: 'Product updated successfully',
      result: updatedProduct,
    };
  }
  // get product details by id
  async getProductDetailsById(id: string): Promise<any> {
    const product = await this.productRepository.getProductDetailsById(id);
    if (!product) throw new BadRequestException('No product found');
    const relatedProducts = await this.productRepository.getRelatedProducts(
      product.category,
    );
    return {
      message: 'Product found',
      result: { product, relatedProducts },
    };
  }

  // get all products with sorting and filtering
  async getAllProducts(queryDetails: GetProductQueryDto): Promise<{
    message: string;
    success: boolean;
    result:
      | {
          metadata: {
            skip: number;
            limit: number;
            total: number;
            pages: number;
            links: any;
          };
          products: [];
        }
      | Record<string, any>;
  }> {
    let callForDashboard = false;
    if (queryDetails.dashboard == 'true') callForDashboard = true;
    delete queryDetails.dashboard;
    const data = qsToMongo(queryDetails);
    const { criteria, options, links } = data;
    console.log('callForDashboard :: ', callForDashboard);

    if (callForDashboard) {
      const result = await this.productRepository.getGroupByProduct();
      return {
        message: result.length > 0 ? 'Products found' : 'No products found',
        success: true,
        result: result,
      };
    }

    const { total, result } = await this.productRepository.getAllProductsFromDB(
      criteria,
      options,
    );
    return {
      message: result.length > 0 ? 'Products found' : 'No products found',
      success: true,
      result: {
        metadata: {
          skip: options.skip || 0,
          limit: options.limit,
          total,
          pages: options.limit ? Math.ceil(total / options.limit) : 1,
          links: links(`/`, total),
        },
        products: result,
      },
    };
  }

  // Delete a product
  async deleteProduct(id: string): Promise<any> {
    const deletedProduct =
      await this.productRepository.deleteProductDetailsInDB(id);
    if (!deletedProduct) throw new BadRequestException('No product found');
    // delete image from cloudinary server
    if (deletedProduct?.imageDetails?.public_id)
      await cloudinary.v2.uploader.destroy(
        deletedProduct.imageDetails.public_id,
        {
          invalidate: true,
        },
      );
    // delete all licenceKeys from db
    await this.productRepository.deleteAllLicenseKeysForProductInDB(
      id,
      undefined,
    );

    // delete product from stripe
    await this.stripeClient.products.del(deletedProduct.stripeProductId);
    return {
      message: 'Product deleted successfully',
      success: true,
      result: deletedProduct,
    };
  }

  // Update with array of sku details in product
  async updateWithArrayOfSkuDetailsInDB(id: string, data: ProductSkuDtoArr) {
    // get exists product details
    const product = await this.productRepository.getProductDetailsById(id);
    if (!product) throw new BadRequestException('No product found');
    // create price in Stripe
    const skuCode = Math.random().toString(36).substring(2, 5) + Date.now();
    for (let i = 0; i < data.skuDetails.length; i++) {
      const priceDetails = await this.stripeClient.prices.create({
        unit_amount: data.skuDetails[i].price * 100,
        currency: 'usd',
        product: product.stripeProductId,
        metadata: {
          skuCode: skuCode,
          validity: data.skuDetails[i].validity,
          lifetime: data.skuDetails[i].lifetime + '',
          productId: id,
          price: data.skuDetails[i].price,
          productName: product.productName,
          productImage: product.image,
        },
      });
      data.skuDetails[i].stripePriceId = priceDetails.id;
    }
    console.log(id, data.skuDetails);
    const result = await this.productRepository.updateWithArrayOfSkuDetailsInDB(
      id,
      data.skuDetails,
    );

    return {
      message: 'Product sku details successfully',
      success: true,
      result,
    };
  }

  // update individual product sku details
  async updateProductIndividualSkuDetails(
    id: string,
    skuId: string,
    data: ProductSkuDto,
  ): Promise<any> {
    // get exists product details
    const product = await this.productRepository.getProductDetailsById(id);
    if (!product) throw new BadRequestException('No product found');
    console.log(skuId);
    console.log(product.skuDetails);
    let skuCode;
    const skuDetails = product.skuDetails.find(
      (sku: { _id: string }) => sku._id.toString() === skuId,
    );
    if (skuDetails.price !== data.price) {
      // inactive price in stripe
      await this.stripeClient.prices.update(skuDetails.stripePriceId, {
        active: false,
      });
      // create new price in stripe
      const priceDetails = await this.stripeClient.prices.create({
        unit_amount: data.price * 100,
        currency: 'usd',
        product: product.stripeProductId,
        metadata: {
          skuCode: skuDetails.skuCode,
          validity: skuDetails.validity,
          lifetime: skuDetails.lifetime,
          productId: skuDetails.productId,
          price: data.price,
          productName: product.productName,
          productImage: product.image,
        },
      });
      data.stripePriceId = priceDetails.id;
    }
    console.log(skuCode);
    const result = await this.productRepository.updateSkuDetailsInDB(
      id,
      skuId,
      { skuCode: skuCode, ...data },
    );

    return {
      message: 'Product sku details updated successfully',
      success: true,
      result,
    };
  }

  // Delete individual product sku details
  async deleteProductSkuDetails(id: string, skuId: string) {
    if (!skuId) throw new BadRequestException('No sku details to delete');
    const deletedSkuProduct = await this.productRepository.deleteSkuDetailsInDB(
      id,
      skuId,
    );
    const skuDetails = deletedSkuProduct.skuDetails.find(
      (sku: { _id: string }) => sku._id.toString() === skuId,
    );
    // inactive price in stripe
    await this.stripeClient.prices.update(skuDetails.stripePriceId, {
      active: false,
    });
    // delete all licenceKeys from db
    await this.productRepository.deleteAllLicenseKeysForProductInDB(
      undefined,
      skuId,
    );

    return {
      message: 'Product sku details deleted successfully',
      success: true,
      result: {
        id,
      },
    };
  }
  // add license keys for an product sku
  async addLicenseKeysForProductSku(
    id: string,
    skuId: string,
    licenseKey: string,
  ): Promise<any> {
    const result = await this.productRepository.addLicenseKeysForProductSkuInDB(
      id,
      skuId,
      licenseKey,
    );
    return {
      message: 'License keys added successfully',
      success: true,
      result: result,
    };
  }

  // delete a license key
  async deleteLicenseKeysForProductSku(id: string) {
    const result =
      await this.productRepository.deleteLicenseKeysForProductSkuInDB(id);

    return {
      message: 'License keys deleted successfully',
      success: true,
      result: result,
    };
  }

  // get license keys for a product sku
  async getAllLicenseKeysForProduct(id: string, skuId: string) {
    const result = await this.productRepository.getAllLicenseKeysForProductInDB(
      id,
      skuId,
    );

    return {
      message: 'License keys found',
      success: true,
      result: result,
    };
  }

  // update license keys for a product sku
  async updateLicenseKeysForProductSku(
    productId: string,
    skuId: string,
    licenseKeyId: string,
    licenseKey: string,
  ): Promise<any> {
    const result =
      await this.productRepository.updateLicenseKeysForProductSkuInDB(
        productId,
        skuId,
        licenseKeyId,
        licenseKey,
      );

    return {
      message: 'License keys updated successfully',
      success: true,
      result: result,
    };
  }

  async addReview(
    productId: string,
    rating: number,
    review: string,
    user: Record<string, any>,
  ) {
    const product =
      await this.productRepository.getProductDetailsById(productId);
    if (!product) throw new BadRequestException('No product found');

    // validation 01 - if cutomer already gave review then throw error
    if (
      product.feedbackDetails.find(
        (value: { customerId: string }) =>
          value.customerId === user._id.toString(),
      )
    ) {
      throw new BadRequestException(
        'You have already gave the review for this product',
      );
    }

    // Validation 02 - if the customer successfully ordered this item
    const orderDetails =
      await this.orderReposotory.findOrderByCustomerIdAndProductId(
        user._id,
        productId,
      );
    if (!orderDetails) {
      throw new BadRequestException(
        'Please purchase this product, then you will allow to give review for this product',
      );
    }

    // calculte average rating
    const ratings: any[] = [];
    product.feedbackDetails.forEach((comment: { rating: any }) =>
      ratings.push(comment.rating),
    );
    const avgRating = (
      ratings.reduce((a, b) => a + b) / ratings.length
    ).toFixed(2);

    const result = await this.productRepository.addReviewForAProduct(
      productId,
      avgRating,
      {
        rating,
        feedbackMsg: review,
        customerId: user._id,
        customerName: user.name,
      },
    );
    return {
      message: 'Review added successfully',
      success: true,
      result: result,
    };
  }

  async deleteReview(productId: string, reviewId: string) {
    const product =
      await this.productRepository.getProductDetailsById(productId);
    if (!product) throw new BadRequestException('No product found');
    const result = await this.productRepository.deleteReviewForAProduct(
      productId,
      reviewId,
    );
    return {
      message: 'Review deleted successfully',
      success: true,
      result: result,
    };
  }
}

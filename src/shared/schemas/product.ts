import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Factory } from 'nestjs-seeder';

export type ProductDocument = Product & Document;
export enum CategoryType {
  OPERATING_SYSTEM = 'Operating System',
  APPLICATION_SOFTWARE = 'Application Software',
}

export enum PlatformType {
  WINDOWS = 'Windows',
  ANDROID = 'Android',
  IOS = 'iOS',
  LINUX = 'Linux',
  MAC = 'Mac',
}

export enum BaseType {
  COMPUTER = 'Computer',
  MOBILE = 'Mobile',
}

export enum DurationType {
  DAY = 'Day',
  MONTH = 'Month',
  YEAR = 'Year',
}

@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
})
export class Feebackers extends mongoose.Document {
  @Prop({})
  customerId: string;

  @Prop({ type: String })
  customerName: string;

  @Prop({})
  rating: number;

  @Prop({})
  feedbackMsg: string;
}
export const FeebackersSchema = SchemaFactory.createForClass(Feebackers);

// export class FeedbackSchema {
//   @Prop({})
//   avgRating: string;

//   @Prop([{ type: FeebackersSchema }])
//   info: Feebackers[];
// }

@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
})
export class SkuDetails extends mongoose.Document {
  @Prop({})
  skuName: string; // name of the sku

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  validity: number;

  @Prop({ default: false })
  lifetime: boolean;

  @Prop({ default: '' })
  stripePriceId?: string;

  @Prop({ default: '' })
  skuCode?: string;
}

export const SkuDetailsSchema = SchemaFactory.createForClass(SkuDetails);

@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
})
export class Product {
  @Factory((faker) => faker.commerce.product())
  @Prop({ required: true })
  productName: string;

  @Factory((faker) => faker.lorem.lines())
  @Prop({ required: true })
  description: string;

  @Prop({
    default:
      'https://media.istockphoto.com/vectors/default-image-icon-vector-missing-picture-page-for-website-design-or-vector-id1357365823?k=20&m=1357365823&s=612x612&w=0&h=ZH0MQpeUoSHM3G2AWzc8KkGYRg4uP_kuu0Za8GFxdFc=',
  })
  image: string;
  @Factory((faker) =>
    faker.helpers.arrayElement([
      CategoryType.OPERATING_SYSTEM,
      CategoryType.APPLICATION_SOFTWARE,
    ]),
  )
  @Prop({
    required: true,
    enum: [CategoryType.OPERATING_SYSTEM, CategoryType.APPLICATION_SOFTWARE],
  })
  category: string;

  @Factory((faker) =>
    faker.helpers.arrayElement([
      PlatformType.ANDROID,
      PlatformType.IOS,
      PlatformType.WINDOWS,
      PlatformType.LINUX,
      PlatformType.MAC,
    ]),
  )
  @Prop({
    required: true,
    enum: [
      PlatformType.ANDROID,
      PlatformType.IOS,
      PlatformType.WINDOWS,
      PlatformType.LINUX,
      PlatformType.MAC,
    ],
  })
  platformType: string;

  @Factory((faker) =>
    faker.helpers.arrayElement([BaseType.COMPUTER, BaseType.MOBILE]),
  )
  @Prop({ required: true, enum: [BaseType.COMPUTER, BaseType.MOBILE] })
  baseType: string;

  @Factory((faker) => faker.internet.url())
  @Prop({ required: true })
  productUrl: string;

  @Factory((faker) => faker.internet.url())
  @Prop({ required: true })
  downloadUrl: string;

  @Prop({ type: Number })
  avgRating: number;

  @Prop([{ type: FeebackersSchema }])
  feedbackDetails: Feebackers[];

  @Prop([{ type: SkuDetailsSchema }])
  skuDetails: SkuDetails[];

  @Prop({ type: {} })
  imageDetails: Record<string, any>;

  @Factory((faker) => {
    test: faker.person.fullName();
  })
  @Prop({ type: [] })
  requirmentSpecification: [Record<string, any>];

  @Factory((faker) =>
    faker.helpers.shuffle([
      'Lorem Ipsum has been the industry',
      'it look like readable English',
      'There are many variations of passages',
    ]),
  )
  @Prop({ type: [] })
  highlights: string[];

  @Prop({ type: Boolean, default: false })
  isSoldOut: boolean;

  @Prop({ type: String, default: '' })
  stripeProductId: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
// ProductSchema.virtual('avgRating').get(function (this: ProductDocument) {
//   const ratings: any[] = [];
//   this.feedbackDetails.forEach((comment) => ratings.push(comment.rating));
//   return (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(2);
// });
//https://fakerjs.dev/api/

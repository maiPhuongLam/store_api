import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'src/shared/schemas/product';
import { User, UserSchema } from 'src/shared/schemas/user';
import { StripeModule } from 'nestjs-stripe';
import configuration from 'src/config/configuration';
import { AuthMiddleware } from 'src/shared/middlewares/auth';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/shared/middlewares/roles.guard';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { License, LicenseSchema } from 'src/shared/schemas/license';
import { Order, OrderSchema } from 'src/shared/schemas/order';
import { OrderRepository } from 'src/shared/repositories/order.repository';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: License.name, schema: LicenseSchema }]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    StripeModule.forRootAsync({
      useFactory: () => ({
        apiKey: configuration().stripe.secret_key,
        apiVersion: '2023-08-16',
      }),
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: '../uploads',
        filename: (req, file, callback) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductRepository,
    UserRepository,
    OrderRepository,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class ProductsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        {
          path: `/products`,
          method: RequestMethod.GET,
        },
        {
          path: `/products/:id`,
          method: RequestMethod.GET,
        },
      )
      .forRoutes(ProductsController);
  }
}

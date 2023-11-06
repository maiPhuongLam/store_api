import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/shared/schemas/order';
import { OrderRepository } from 'src/shared/repositories/order.repository';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/shared/middlewares/roles.guard';
import { StripeModule } from 'nestjs-stripe';
import configuration from 'src/config/configuration';
import { Product, ProductSchema } from 'src/shared/schemas/product';
import { User, UserSchema } from 'src/shared/schemas/user';
import { License, LicenseSchema } from 'src/shared/schemas/license';
import { AuthMiddleware } from 'src/shared/middlewares/auth';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: License.name, schema: LicenseSchema }]),
    StripeModule.forRootAsync({
      useFactory: () => ({
        apiKey: configuration().stripe.secret_key,
        apiVersion: '2023-08-16',
      }),
    }),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderRepository,
    ProductRepository,
    UserRepository,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class OrdersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({
        path: `/orders/webhook`,
        method: RequestMethod.POST,
      })
      .forRoutes(OrdersController);
  }
}

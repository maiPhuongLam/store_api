import { seeder } from 'nestjs-seeder';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { User, UserSchema } from './shared/schemas/user';
import { Product, ProductSchema } from './shared/schemas/product';
import { UsersSeeder } from './shared/seeders/user.seeder';
import { ProductSeeder } from './shared/seeders/product.seeder';

seeder({
  imports: [
    MongooseModule.forRoot(configuration().mongodbUrl),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
}).run([UsersSeeder, ProductSeeder]);

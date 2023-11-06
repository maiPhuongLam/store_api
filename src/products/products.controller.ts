import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  Req,
  ParseFilePipe,
  FileTypeValidator,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/shared/middlewares/role.decorators';
import { UserTypes } from 'src/shared/schemas/user';
import configuration from 'src/config/configuration';
import { CreateProductDto } from './dtos/create-product.dto';
import { GetProductQueryDto } from './dtos/get-product-query.dto';
import { ProductSkuDto, ProductSkuDtoArr } from './dtos/product-sku.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post(':id/image')
  @Roles([UserTypes.ADMIN])
  @UseInterceptors(FileInterceptor('productImage'))
  async uploadProductImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.productsService.uploadProductImage(id, file);
  }

  @Post()
  @Roles([UserTypes.ADMIN])
  @HttpCode(201)
  async create(@Body() createProductDto: CreateProductDto) {
    console.log(createProductDto);
    return await this.productsService.create(createProductDto);
  }

  @Get()
  async findAll(@Query() queryDetails: GetProductQueryDto) {
    return this.productsService.getAllProducts(queryDetails);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.productsService.getProductDetailsById(id);
  }

  @Patch(':id')
  @Roles([UserTypes.ADMIN])
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: CreateProductDto,
  ) {
    return await this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @Roles([UserTypes.ADMIN])
  async remove(@Param('id') id: string) {
    return await this.productsService.deleteProduct(id);
  }

  @Post('/:productId/skus')
  @Roles([UserTypes.ADMIN])
  async updateProductSkuDetails(
    @Param('productId') productId: string,
    @Body() skuDetails: ProductSkuDtoArr,
  ) {
    return await this.productsService.updateWithArrayOfSkuDetailsInDB(
      productId,
      skuDetails,
    );
  }

  @Put('/:productId/skus/:skuId')
  async updateProductIndividualSkuDetails(
    @Param('productId') id: string,
    @Param('skuId') skuId: string,
    @Body() skuDetails: ProductSkuDto,
  ) {
    return await this.productsService.updateProductIndividualSkuDetails(
      id,
      skuId,
      skuDetails,
    );
  }

  @Delete('/:productId/skus/:skuId')
  @Roles([UserTypes.ADMIN])
  async deleteProductSkuDetails(
    @Param('productId') id: string,
    @Param('skuId') skuId: string,
  ) {
    return await this.productsService.deleteProductSkuDetails(id, skuId);
  }

  @Post('/:productId/skus/:skuId/licenses')
  @Roles([UserTypes.ADMIN])
  async addLicenseKeysForProductSku(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
    @Body('licenseKey') licenseKey: string,
  ) {
    return await this.productsService.addLicenseKeysForProductSku(
      productId,
      skuId,
      licenseKey,
    );
  }

  @Delete('/licenses/:licenseKeyId')
  @Roles([UserTypes.ADMIN])
  async deleteLicenseKeysForProductSku(
    @Param('licenseKeyId') licenseKeyId: string,
  ) {
    return await this.productsService.deleteLicenseKeysForProductSku(
      licenseKeyId,
    );
  }

  @Get('/:productId/skus/:skuId/licenses')
  @Roles([UserTypes.ADMIN])
  async getAllLicenseKeysForProduct(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
  ) {
    return await this.productsService.getAllLicenseKeysForProduct(
      productId,
      skuId,
    );
  }

  @Put('/:productId/skus/:skuId/licenses/:licenseKeyId')
  @Roles([UserTypes.ADMIN])
  async updateLicenseKeysForProductSku(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
    @Param('licenseKeyId') licenseKeyId: string,
    @Body('licenseKey') licenseKey: string,
  ) {
    return await this.productsService.updateLicenseKeysForProductSku(
      productId,
      skuId,
      licenseKeyId,
      licenseKey,
    );
  }

  @Post('/:productId/reviews')
  async addReview(
    @Param('productId') productId: string,
    @Body('rating') rating: number,
    @Body('review') review: string,
    @Req() req: any,
  ) {
    return await this.productsService.addReview(
      productId,
      rating,
      review,
      req.user,
    );
  }

  @Delete('/:productId/reviews/:reviewId')
  async deleteReview(
    @Param('productId') productId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return await this.productsService.deleteReview(productId, reviewId);
  }
}

import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  BaseType,
  CategoryType,
  PlatformType,
  SkuDetails,
} from '../../shared/schemas/product';
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(CategoryType)
  category: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(PlatformType)
  platformType: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(BaseType)
  baseType: string;

  @IsString()
  @IsNotEmpty()
  productUrl: string;

  @IsString()
  @IsNotEmpty()
  downloadUrl: string;

  @IsArray()
  @IsOptional()
  requirmentSpecification: [Record<string, any>];

  @IsArray()
  @IsOptional()
  highlights: [string];

  @IsOptional()
  @IsArray()
  skuDetatails: [SkuDetails];
  @IsOptional()
  image?: string;
  @IsOptional()
  imageDetails?: any;
  @IsOptional()
  stripeProductId?: string;
}

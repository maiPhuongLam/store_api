import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  skuPriceId: string;

  @IsNumber()
  quantity: number;

  @IsString()
  skuId: string;
}

export class CheckoutDtoArrDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CheckoutDto)
  checkoutDetails: CheckoutDto[];
}

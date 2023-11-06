import { IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';
import {
  BaseType,
  CategoryType,
  PlatformType,
} from 'src/shared/schemas/product';

export class GetProductQueryDto {
  @ValidateIf((object: any, value: any) => value !== undefined)
  @IsString()
  search: string;

  @ValidateIf((object: any, value: any) => value !== undefined)
  @IsString()
  @IsIn([CategoryType.APPLICATION_SOFTWARE, CategoryType.OPERATING_SYSTEM])
  category: CategoryType;

  @ValidateIf((object: any, value: any) => value !== undefined)
  @IsString()
  @IsIn([
    PlatformType.ANDROID,
    PlatformType.IOS,
    PlatformType.WINDOWS,
    PlatformType.LINUX,
    PlatformType.MAC,
  ])
  platformType: PlatformType;

  @ValidateIf((object: any, value: any) => value !== undefined)
  @IsString()
  @IsIn([BaseType.COMPUTER, BaseType.MOBILE])
  baseType: BaseType;

  @IsOptional()
  dashboard?: string;
}

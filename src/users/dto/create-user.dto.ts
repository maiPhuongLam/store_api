import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserTypes } from 'src/shared/schemas/user';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  @IsIn([UserTypes.ADMIN, UserTypes.CUSTOMER])
  type: UserTypes;

  @IsString()
  @IsOptional()
  secretToken?: string;

  @IsOptional()
  isVerified?: boolean;
}

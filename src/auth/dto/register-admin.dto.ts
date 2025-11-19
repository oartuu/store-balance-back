import { IsString, IsEmail, MinLength } from 'class-validator';

export class RegisterAdminDto {
  @IsString()
  companyName: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(4)
  password: string;
}

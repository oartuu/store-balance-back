import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  companyName: string;

  @IsEmail()
  email: string;

  @MinLength(4)
  password: string;
}

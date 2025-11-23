import { IsEmail, IsString, MinLength } from 'class-validator';

export class RefreshDto {
  refreshTokenId: string;
}

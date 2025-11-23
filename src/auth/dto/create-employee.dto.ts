import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsEmail,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(4)
  password: string;

  @IsDefined()
  @Transform(({ obj, key }) => {
    const val = obj[key];
    // Se vier boolean, retorna direto
    if (typeof val === 'boolean') return val;
    // Se vier string, faz a conversão esperada
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
    }
    // Valor inesperado — retorna val (vai falhar na validação @IsBoolean se não for booleano)
    return val;
  })
  @IsBoolean()
  isAdmin: boolean;
}

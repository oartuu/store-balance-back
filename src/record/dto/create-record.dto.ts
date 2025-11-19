import {
  IsEnum,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecordType } from '../../../generated/prisma';

class RecordItemDto {
  @IsString()
  title: string;

  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateRecordDto {
  @IsString()
  title: string;

  @IsEnum(RecordType)
  type: RecordType;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RecordItemDto)
  items: RecordItemDto[];
}

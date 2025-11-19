// list-records.dto.ts
import { IsOptional, IsDateString } from 'class-validator';

export class ListRecordsDto {
  @IsOptional()
  @IsDateString()
  date?: string; // se não passar, usa data atual
}

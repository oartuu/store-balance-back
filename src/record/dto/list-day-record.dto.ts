// list-day-records.dto.ts
import { IsOptional, IsDateString } from 'class-validator';

export class ListDayRecordsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

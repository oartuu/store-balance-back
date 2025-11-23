import { IsOptional, IsDateString } from 'class-validator';

export class FinishDayDto {
  @IsOptional()
  @IsDateString()
  date?: string; // se não passar, usa data atual
}

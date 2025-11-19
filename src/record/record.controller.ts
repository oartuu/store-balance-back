import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { RecordsService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { ListRecordsDto } from './dto/list-records.dto';
import { ListDayRecordsDto } from './dto/list-day-record.dto';

@Controller('records')
@UseGuards(JwtAuthGuard) // Protege todas as rotas do controller
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  /* -------------------- INICIAR DIA (ADMIN) -------------------- */
  @Post('start')
  async startDay(@User() user) {
    return this.recordsService.startDay(user);
  }
  /* -------------------- FINALIZAR DIA (ADMIN) -------------------- */
  @Post('finish')
  async finishDay(@User() user) {
    return this.recordsService.finishDay(user);
  }

  /* -------------------- CRIAR REGISTRO -------------------- */
  @Post()
  async createRecord(@Body() dto: CreateRecordDto, @User() user) {
    return this.recordsService.createRecord(dto, user);
  }
  /* -------------------- LISTAR REGISTROS DE UM DIA -------------------- */
  @Get()
  async listRecordsByDay(@User() user, @Query() dto: ListRecordsDto) {
    return this.recordsService.listRecordsByDay(user, dto);
  }
  /* -------------------- LISTAR TODAS AS DAY RECORDS (ADMIN) --------------- */
  @Get('day-records')
  async listDayRecords(@User() user, @Query() dto: ListDayRecordsDto) {
    return this.recordsService.listDayRecords(user, dto);
  }
}

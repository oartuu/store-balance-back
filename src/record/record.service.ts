import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { RecordType } from '../../generated/prisma'; 
import { ListDayRecordsDto } from './dto/list-day-record.dto';
import { ListRecordsDto } from './dto/list-records.dto';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  /* -------------------- INICIAR DIA -------------------- */
  async startDay(user) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Apenas admins podem iniciar o dia.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verifica se já existe um dayRecord para hoje
    const existing = await this.prisma.dayRecord.findFirst({
      where: { date: today, companyId: user.companyId },
    });

    if (existing) {
      if (existing.isOpen) {
        return existing; // já existe aberto, apenas retorna
      } else {
        throw new BadRequestException('O dia de hoje já foi fechado.');
      }
    }

    // Cria novo dayRecord
    return this.prisma.dayRecord.create({
      data: {
        date: today,
        companyId: user.companyId,
        isOpen: true,
      },
    });
  }

  /* -------------------- CRIAR REGISTRO -------------------- */
  async createRecord(dto: CreateRecordDto, user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Procura dayRecord aberto para hoje
    let day = await this.prisma.dayRecord.findFirst({
      where: { date: today, companyId: user.companyId },
    });

    if (!day) {
      // Não existe nenhum dayRecord → cria novo
      day = await this.prisma.dayRecord.create({
        data: {
          date: today,
          companyId: user.companyId,
          isOpen: true,
        },
      });
    } else if (!day.isOpen) {
      // Existe dayRecord, mas fechado → erro
      throw new BadRequestException(
        'Não é possível adicionar registros a um dia que já foi fechado.',
      );
    }

    // Calcula o total
    const total = dto.items.reduce((acc, item) => acc + item.price, 0);

    // Cria registro + items em cascade
    const record = await this.prisma.record.create({
      data: {
        title: dto.title,
        type: dto.type,
        total,
        userId: user.userId,
        dayRecordId: day.id,
        items: {
          create: dto.items,
        },
      },
      include: { items: true },
    });

    return record;
  }
  /* -------------------- FINALIZAR DIA -------------------- */
  async finishDay(user) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Apenas admins podem finalizar o dia.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = await this.prisma.dayRecord.findFirst({
      where: { date: today, companyId: user.companyId },
    });

    if (!day) {
      throw new BadRequestException('O dia ainda não foi iniciado.');
    }

    if (!day.isOpen) {
      throw new BadRequestException('O dia já foi finalizado.');
    }

    return this.prisma.dayRecord.update({
      where: { id: day.id },
      data: {
        isOpen: false,
        finishedAt: new Date(),
      },
    });
  }

  /* -------------------- LISTAR TODAS AS DAY RECORDS -------------------- */
  async listDayRecords(user, dto: ListDayRecordsDto) {
    const where: any = { companyId: user.companyId };


    if(!user.admin){
      throw new ForbiddenException('Apenas admins podem listar os registros de dias.');
    }


    if (dto.startDate || dto.endDate) {
      where.date = {};
      if (dto.startDate) where.date.gte = new Date(dto.startDate);
      if (dto.endDate) where.date.lte = new Date(dto.endDate);
    }

    return this.prisma.dayRecord.findMany({
      where,
      include: { records: true },
      orderBy: { date: 'desc' },
    });
  }

  /* -------------------- LISTAR TODAS AS RECORDS DE UM DIA -------------------- */
  async listRecordsByDay(user, dto: ListRecordsDto) {
    const targetDate = dto.date ? new Date(dto.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const day = await this.prisma.dayRecord.findFirst({
      where: { date: targetDate, companyId: user.companyId },
      include: { records: { include: { items: true } } },
    });

    if (!day) {
      throw new NotFoundException('Nenhum registro encontrado para esta data.');
    }

    return day;
  }
}

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

  /* -------------------- START DAY -------------------- */
  async startDay(user) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Only admins can start a day.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.dayRecord.findFirst({
      where: { date: today, companyId: user.companyId },
    });

    if (existing) {
      if (existing.isOpen) {
        return existing;
      } else {
        throw new BadRequestException('The day is already closed.');
      }
    }

    /* -------------------- CREATE NEW DAY RECORD -----------------------*/

    return this.prisma.dayRecord.create({
      data: {
        date: today,
        companyId: user.companyId,
        isOpen: true,
      },
    });
  }

  /* -------------------- CREATE RECORD -------------------- */
  async createRecord(dto: CreateRecordDto, user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    
    let day = await this.prisma.dayRecord.findFirst({
      where: { date: today, companyId: user.companyId },
    });

    if (!day) {
      if (!user.admin){
        throw new ForbiddenException('Day not found. Await admin approval.');
      }
      day = await this.prisma.dayRecord.create({
        data: {
          date: today,
          companyId: user.companyId,
          isOpen: true,
        },
      });
    } else if (!day.isOpen) {
      
      throw new BadRequestException(
        'You cant add records to a closed day.',
      );
    }

    
    const total = dto.items.reduce((acc, item) => acc + item.price, 0);

   
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
  /* -------------------- FINISH DAY -------------------- */
  async finishDay(user) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Only admins can finish a day.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = await this.prisma.dayRecord.findFirst({
      where: { date: today, companyId: user.companyId },
    });

    if (!day) {
      throw new BadRequestException('The day is already started.');
    }

    if (!day.isOpen) {
      throw new BadRequestException('The day is already closed.');
    }

    return this.prisma.dayRecord.update({
      where: { id: day.id },
      data: {
        isOpen: false,
        finishedAt: new Date(),
      },
    });
  }

  /* -------------------- LIST DAY RECORDS -------------------- */
  async listDayRecords(user, dto: ListDayRecordsDto) {
    const where: any = { companyId: user.companyId };


    if(!user.admin){
      throw new ForbiddenException('Only admins can list day records.');
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

  /* ----------------- LIST RECORDS OF A DAY ------------------- */
  async listRecordsByDay(user, dto: ListRecordsDto) {
    const targetDate = dto.date ? new Date(dto.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const day = await this.prisma.dayRecord.findFirst({
      where: { date: targetDate, companyId: user.companyId },
      include: { records: { include: { items: true } } },
    });

    if (!day) {
      throw new NotFoundException('No records found for this day.');
    }

    return day;
  }
}

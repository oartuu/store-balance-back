import { Module } from '@nestjs/common';
import { RecordsService } from './record.service';
import { RecordsController } from './record.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [RecordsService, PrismaService,],
  controllers: [RecordsController]
})
export class RecordModule {}

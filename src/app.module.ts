import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RecordModule } from './record/record.module';

@Module({
  imports: [AuthModule, RecordModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

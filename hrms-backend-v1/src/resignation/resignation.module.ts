import { Module } from '@nestjs/common';
import { ResignationController } from './resignation.controller';
import { ResignationService } from './resignation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, NotificationModule, AuditModule],
  controllers: [ResignationController],
  providers: [ResignationService],
  exports: [ResignationService],
})
export class ResignationModule {}

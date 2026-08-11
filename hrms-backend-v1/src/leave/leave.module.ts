import { Module } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service'; // <-- Import

@Module({
  controllers: [LeaveController],
  providers: [LeaveService, PrismaService, NotificationService], // <-- Add to providers
})
export class LeaveModule {}
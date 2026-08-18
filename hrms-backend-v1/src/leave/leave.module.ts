import { Module } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Need this to access the database
  controllers: [LeaveController],
  providers: [LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceCronService } from './attendance-cron.service';

@Module({
  providers: [AttendanceService, AttendanceCronService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}

import { Module } from '@nestjs/common';
import { AttendanceService } from './attendence.service';
import { AttendanceController } from './attendence.controller';
import { AttendanceCronService } from './attendance-cron.service';


@Module({
  providers: [AttendanceService,AttendanceCronService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}

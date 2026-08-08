import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmployeeModule } from './employee/employee.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ScheduleModule as CronModule } from '@nestjs/schedule'; // Background Timer
import { LeaveModule } from './leave/leave.module';
import { SettingsModule } from './settings/settings.module';
import { ScheduleModule } from './schedule/schedule.module'; // Local Shift Engine
import { OrganizationModule } from './organization/organization.module';

@Module({
  imports: [
    CronModule.forRoot(), // Initializes the background cron job timer
    ScheduleModule, // Initializes your custom employee shift schedule module
    PrismaModule,
    AuthModule,
    EmployeeModule,
    AttendanceModule,
    LeaveModule,
    SettingsModule,
    OrganizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
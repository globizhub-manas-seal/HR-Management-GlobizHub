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
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PayrollModule } from './payroll/payroll.module';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', // The URL prefix
    }),

    CronModule.forRoot(), // Initializes the background cron job timer
    ScheduleModule, // Initializes your custom employee shift schedule module
    PrismaModule,
    AuthModule,
    EmployeeModule,
    AttendanceModule,
    LeaveModule,
    SettingsModule,
    OrganizationModule,
    PayrollModule,
    S3Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

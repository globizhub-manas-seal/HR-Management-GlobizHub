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
import { DocumentModule } from './document/document.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { TaskModule } from './task/task.module';
import { AuditModule } from './audit/audit.module';
import { ShiftSwapModule } from './shift-swap/shift-swap.module';

import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import * as Joi from 'joi';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(5000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        FRONTEND_ORIGIN: Joi.string().allow(''),
        SENTRY_DSN: Joi.string().allow(''),
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', // The URL prefix
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 requests per minute
      },
    ]),

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
    DocumentModule,
    AnnouncementModule,
    TaskModule,
    AuditModule,
    ShiftSwapModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
})
export class AppModule {}

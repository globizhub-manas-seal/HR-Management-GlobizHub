import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmployeeModule } from './employee/employee.module';
import { AttendanceModule } from './attendance/attendence.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(),PrismaModule, AuthModule, EmployeeModule, AttendanceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

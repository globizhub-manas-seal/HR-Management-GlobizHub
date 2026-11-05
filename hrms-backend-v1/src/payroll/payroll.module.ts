import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, S3Module, AuditModule, EmailModule],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}

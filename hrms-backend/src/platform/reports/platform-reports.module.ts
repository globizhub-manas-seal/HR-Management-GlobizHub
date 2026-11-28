import { Module } from '@nestjs/common';
import { PlatformReportsController } from './platform-reports.controller';
import { ReportExportService } from '../../reports/report-export.service';

@Module({
  controllers: [PlatformReportsController],
  providers: [ReportExportService],
})
export class PlatformReportsModule {}

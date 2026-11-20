import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Ip,
  Get,
  Patch,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AttendanceService } from './attendance.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { ClockInDto } from './dto/clock-in.dto';
import { RequestCorrectionDto } from './dto/request-correction.dto';
import { ReviewCorrectionDto } from './dto/review-correction.dto';
import { QueryAttendanceRecordsDto } from './dto/query-attendance-records.dto';

@Controller('attendance')
@UseGuards(AuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  async clockIn(@Request() req, @Ip() ip: string, @Body() dto: ClockInDto) {
    return this.attendanceService.clockIn(
      req.user.sub,
      req.user.companyId,
      dto,
      ip,
    );
  }

  @Post('clock-out')
  async clockOut(@Request() req) {
    return this.attendanceService.clockOut(req.user.sub, req.user.companyId);
  }

  @Get('my-history')
  async getMyHistory(@Request() req) {
    return this.attendanceService.getMyHistory(
      req.user.sub,
      req.user.companyId,
    );
  }

  // S-05: Attendance admin-stats guarded — only Admins / HR / Managers with attendance.manage
  @Get('admin-stats')
  @RequirePermissions('attendance.manage')
  async getAdminTodayStats(@Request() req) {
    return this.attendanceService.getAdminTodayStats(req.user.companyId);
  }

  // Personal Employee Dashboard Stats (own stats)
  @Get('my-stats')
  async getMyStats(@Request() req) {
    return this.attendanceService.getMyDashboardStats(
      req.user.sub,
      req.user.companyId,
    );
  }

  // ==========================================
  // ATTENDANCE CORRECTIONS / REGULARIZATION
  // ==========================================
  @Post('corrections')
  async requestCorrection(@Request() req, @Body() dto: RequestCorrectionDto) {
    return this.attendanceService.requestCorrection(req.user.sub, {
      date: new Date(dto.date),
      requestedCheckIn: dto.requestedCheckIn
        ? new Date(dto.requestedCheckIn)
        : undefined,
      requestedCheckOut: dto.requestedCheckOut
        ? new Date(dto.requestedCheckOut)
        : undefined,
      reason: dto.reason,
    });
  }

  @Get('corrections/pending')
  @RequirePermissions('attendance.manage')
  async getPendingCorrections(@Request() req) {
    return this.attendanceService.getPendingCorrections(req.user.companyId);
  }

  @Get('approvals')
  @RequirePermissions('attendance.manage')
  async getApprovals(@Request() req) {
    return this.attendanceService.getPendingCorrections(req.user.companyId);
  }

  @Patch('corrections/:id/review')
  @RequirePermissions('attendance.manage')
  async reviewCorrection(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReviewCorrectionDto,
  ) {
    return this.attendanceService.reviewCorrection(
      id,
      req.user.sub,
      req.user.companyId,
      dto.status,
      dto.note || dto.reviewerNote || dto.reviewNote,
    );
  }

  @Patch('approvals/:id')
  @RequirePermissions('attendance.manage')
  async reviewApproval(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReviewCorrectionDto,
  ) {
    return this.attendanceService.reviewCorrection(
      id,
      req.user.sub,
      req.user.companyId,
      dto.status,
      dto.note || dto.reviewerNote || dto.reviewNote,
    );
  }

  // ==========================================
  // COMPANY DAILY ATTENDANCE REGISTER & EXPORT
  // ==========================================
  @Get('records')
  @RequirePermissions('attendance.manage')
  async getCompanyRecords(
    @Request() req,
    @Query() query: QueryAttendanceRecordsDto,
  ) {
    return this.attendanceService.getCompanyAttendanceRecords(
      req.user.companyId,
      query,
    );
  }

  @Get('export')
  @RequirePermissions('attendance.manage')
  async exportCompanyRecords(
    @Request() req,
    @Res() res: Response,
    @Query() query: QueryAttendanceRecordsDto,
  ) {
    const csv = await this.attendanceService.exportCompanyAttendanceCsv(
      req.user.companyId,
      query,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attendance_report_${query.date || 'today'}.csv"`,
    );
    res.send(csv);
  }
}

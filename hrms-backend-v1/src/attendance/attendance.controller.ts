import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Ip,
  Get,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { ClockInDto } from './dto/clock-in.dto';

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
}

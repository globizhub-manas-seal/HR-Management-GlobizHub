import { Controller, Post, Body, UseGuards, Request, Ip, Get } from '@nestjs/common';
import { AttendanceService } from './attendence.service';
import { AuthGuard } from '../auth/auth.guard';
import { ClockInDto } from './dto/clock-in.dto';

@Controller('attendance')
@UseGuards(AuthGuard) // Require JWT to access
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  async clockIn(@Request() req, @Ip() ip: string, @Body() dto: ClockInDto) {
    // req.user contains the decoded JWT (employeeId and companyId)
    // @Ip() automatically extracts the user's IP address
    return this.attendanceService.clockIn(req.user.sub, req.user.companyId, dto, ip);
  }

  @Post('clock-out')
  async clockOut(@Request() req) {
    return this.attendanceService.clockOut(req.user.sub, req.user.companyId);
  }

  @Get('my-history')
  async getMyHistory(@Request() req) {
    // req.user.sub is the employeeId securely extracted from their JWT token
    return this.attendanceService.getMyHistory(req.user.sub, req.user.companyId);
  }

  // NEW: Admin Dashboard Stats
  @Get('admin-stats')
  async getAdminTodayStats(@Request() req) {
    // Only fetch stats for the specific company this Admin belongs to!
    return this.attendanceService.getAdminTodayStats(req.user.companyId);
  }

  // NEW: Personal Employee Dashboard Stats
  @Get('my-stats')
  async getMyStats(@Request() req) {
    // req.user.sub is the logged-in employee's ID from their JWT token
    return this.attendanceService.getMyDashboardStats(req.user.sub, req.user.companyId);
  }
}

import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('schedules')
@UseGuards(AuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('me')
  async getMySchedule(@Request() req) {
    return this.scheduleService.getMySchedule(req.user.sub, req.user.companyId);
  }

  @Post('shifts')
  async createShift(@Request() req, @Body() dto: any) {
    return this.scheduleService.createShift(req.user.companyId, dto, req.user.role);
  }

  @Post('assign')
  async assignSchedule(@Request() req, @Body() dto: any) {
    return this.scheduleService.assignSchedule(req.user.companyId, dto, req.user.role);
  }

  @Get('shifts')
  async getShifts(@Request() req) {
    return this.scheduleService.getShifts(req.user.companyId);
  }
}
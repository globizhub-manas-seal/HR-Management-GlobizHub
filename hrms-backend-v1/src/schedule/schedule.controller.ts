import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
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

  @Get('shifts')
  async getShifts(@Request() req) {
    return this.scheduleService.getShifts(req.user.companyId);
  }

  // NEW: Update Endpoint
  @Patch('shifts/:id')
  async updateShift(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.scheduleService.updateShift(id, req.user.companyId, dto, req.user.role);
  }

  // NEW: Delete Endpoint
  @Delete('shifts/:id')
  async deleteShift(@Request() req, @Param('id') id: string) {
    return this.scheduleService.deleteShift(id, req.user.companyId, req.user.role);
  }

  @Post('assign')
  async assignSchedule(@Request() req, @Body() dto: any) {
    return this.scheduleService.assignSchedule(req.user.companyId, dto, req.user.role);
  }
}
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request,Delete } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { LeaveStatus } from '../../generated/prisma/client';
import { RequirePermissions } from 'src/auth/decorators/require-permissions.decorator';

@Controller('leaves')
@UseGuards(AuthGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateLeaveDto) {
    return this.leaveService.createLeaveRequest(req.user.sub, req.user.companyId, dto);
  }

  @Get('my')
  async getMyLeaves(@Request() req) {
    return this.leaveService.getMyLeaves(req.user.sub);
  }

  @Get('company')
  async getAllCompanyLeaves(@Request() req) {
    return this.leaveService.getAllCompanyLeaves(req.user.companyId);
  }

  @Patch(':id/status')
  async updateStatus(@Request() req, @Param('id') id: string, @Body('status') status: LeaveStatus) {
    return this.leaveService.updateLeaveStatus(req.user.companyId, id, status, req.user.role);
  }

  @Get('holidays')
  async getHolidays(@Request() req) {
    return this.leaveService.getHolidays(req.user.companyId);
  }

  @Post('holidays')
  @RequirePermissions('leave.manage') // Only HR/Admins can add holidays
  async addHoliday(@Request() req, @Body() body: any) {
    return this.leaveService.addHoliday(req.user.companyId, body);
  }

  @Delete('holidays/:id')
  @RequirePermissions('leave.manage')
  async removeHoliday(@Request() req, @Param('id') id: string) {
    return this.leaveService.removeHoliday(req.user.companyId, id);
  }
}
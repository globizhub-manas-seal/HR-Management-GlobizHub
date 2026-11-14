import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { CreateLeavePolicyDto } from './dto/create-leave-policy.dto';
import { UpdateLeavePolicyDto } from './dto/update-leave-policy.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { AdjustLeaveBalanceDto } from './dto/adjust-leave-balance.dto';
import { LeaveStatus } from '../../generated/prisma/client';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller(['leaves', 'leave'])
@UseGuards(AuthGuard, PermissionsGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateLeaveDto) {
    return this.leaveService.createLeaveRequest(
      req.user.sub,
      req.user.companyId,
      dto,
    );
  }

  @Get('my')
  async getMyLeaves(@Request() req) {
    return this.leaveService.getMyLeaves(req.user.sub);
  }

  // Alias for my leaves
  @Get('my-leaves')
  async getMyLeavesAlias(@Request() req) {
    return this.leaveService.getMyLeaves(req.user.sub);
  }

  // Manager & HR pending approvals desk
  @Get('approvals')
  async getApprovals(@Request() req) {
    return this.leaveService.getApprovals(req.user.companyId, req.user);
  }

  @Get('company')
  async getAllCompanyLeaves(
    @Request() req,
    @Query('status') status?: LeaveStatus,
  ) {
    return this.leaveService.getAllCompanyLeaves(req.user.companyId, {
      status,
    });
  }

  // Alias for company leaves (compatible with /leaves/admin/company)
  @Get('admin/company')
  async getAdminCompanyLeaves(
    @Request() req,
    @Query('status') status?: LeaveStatus,
  ) {
    return this.leaveService.getAllCompanyLeaves(req.user.companyId, {
      status,
    });
  }

  @Get('company-balances')
  async getAllCompanyLeaveBalances(@Request() req) {
    return this.leaveService.getAllCompanyLeaveBalances(req.user.companyId);
  }

  @Get('balance')
  async getBalance(@Request() req) {
    return this.leaveService.getLeaveBalance(req.user.sub, req.user.companyId);
  }

  @Get('my-balance')
  async getMyBalance(@Request() req) {
    return this.leaveService.getMyAllocations(req.user.sub);
  }

  // Employee withdraws / cancels pending or approved future leave
  @Post(':id/withdraw')
  async withdrawLeave(@Request() req, @Param('id') id: string) {
    return this.leaveService.withdrawLeaveRequest(
      req.user.companyId,
      id,
      req.user.sub,
      req.user.role,
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveStatusDto,
  ) {
    return this.leaveService.updateLeaveStatus(
      req.user.companyId,
      id,
      dto.status,
      req.user.role,
      req.user.sub,
      dto.rejectionReason,
    );
  }

  // HR manual balance adjustment / comp-off credit
  @Post('adjust-balance')
  @RequirePermissions('leave.manage')
  async adjustBalance(@Request() req, @Body() dto: AdjustLeaveBalanceDto) {
    return this.leaveService.adjustLeaveBalance(
      req.user.companyId,
      dto,
      req.user.sub,
    );
  }

  // HR/Admin: Run year-end carry-forward and balance expiration
  @Post('process-carry-forward')
  @RequirePermissions('leave.manage')
  async processCarryForward(
    @Request() req,
    @Body('fromYear', ParseIntPipe) fromYear: number,
    @Body('toYear', ParseIntPipe) toYear: number,
  ) {
    return this.leaveService.processYearEndCarryForward(
      req.user.companyId,
      fromYear,
      toYear,
      req.user.sub,
    );
  }

  @Get('holidays')
  async getHolidays(@Request() req) {
    return this.leaveService.getHolidays(req.user.companyId);
  }

  @Post('holidays')
  @RequirePermissions('leave.manage')
  async addHoliday(@Request() req, @Body() body: any) {
    return this.leaveService.addHoliday(req.user.companyId, body, req.user.sub);
  }

  @Delete('holidays/:id')
  @RequirePermissions('leave.manage')
  async removeHoliday(@Request() req, @Param('id') id: string) {
    return this.leaveService.removeHoliday(
      req.user.companyId,
      id,
      req.user.sub,
    );
  }

  // ==========================================
  // LEAVE POLICY MANAGEMENT
  // ==========================================
  @Post('policy')
  @RequirePermissions('leave.manage')
  async createPolicy(@Request() req, @Body() dto: CreateLeavePolicyDto) {
    return this.leaveService.createLeavePolicy(req.user.companyId, dto);
  }

  @Get('policy')
  async getPolicies(@Request() req) {
    return this.leaveService.getCompanyPolicies(req.user.companyId);
  }

  @Patch('policy/:id')
  @RequirePermissions('leave.manage')
  async updatePolicy(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateLeavePolicyDto,
  ) {
    return this.leaveService.updateLeavePolicy(req.user.companyId, id, dto);
  }

  @Delete('policy/:id')
  @RequirePermissions('leave.manage')
  async deletePolicy(@Request() req, @Param('id') id: string) {
    return this.leaveService.deleteLeavePolicy(req.user.companyId, id);
  }
}

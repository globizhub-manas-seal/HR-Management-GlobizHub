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
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { AuthGuard } from '../auth/auth.guard';
// S-04: PermissionsGuard was missing from this controller
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { LeaveStatus } from '../../generated/prisma/client';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('leaves')
// S-04: Apply both guards consistently; PermissionsGuard respects @RequirePermissions
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

  @Get('company')
  async getAllCompanyLeaves(@Request() req) {
    return this.leaveService.getAllCompanyLeaves(req.user.companyId);
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

  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: LeaveStatus,
  ) {
    return this.leaveService.updateLeaveStatus(
      req.user.companyId,
      id,
      status,
      req.user.role,
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

  // S-04: @RequirePermissions was commented out — restored
  @Post('policy')
  @RequirePermissions('leave.manage')
  async createPolicy(@Request() req, @Body() body: any) {
    return this.leaveService.createLeavePolicy(req.user.companyId, body);
  }

  @Get('policy')
  async getPolicies(@Request() req) {
    return this.leaveService.getCompanyPolicies(req.user.companyId);
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
}

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
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { LeaveStatus } from '../../generated/prisma/client';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('leaves')
@UseGuards(AuthGuard)
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

  @Get('balance')
  async getBalance(@Request() req) {
    return this.leaveService.getLeaveBalance(req.user.sub, req.user.companyId);
  }

  // ✅ FIX 5: Use getMyAllocations instead of getMyBalance
  @Get('my-balance')
  async getMyBalance(@Request() req) {
    return this.leaveService.getMyAllocations(req.user.sub);
  }

  // ✅ FIX 6: Add req.user.sub as the 5th argument (managerId)
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
      req.user.sub, // <--- Added managerId here!
    );
  }

  @Get('holidays')
  async getHolidays(@Request() req) {
    return this.leaveService.getHolidays(req.user.companyId);
  }

  @Post('holidays')
  @RequirePermissions('leave.manage') // Only HR/Admins can add holidays
  async addHoliday(@Request() req, @Body() body: any) {
    return this.leaveService.addHoliday(req.user.companyId, body, req.user.sub);
  }

  @Post('policy')
  // @RequirePermissions('leave.manage') // Uncomment if using your custom decorator
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
    return this.leaveService.removeHoliday(req.user.companyId, id, req.user.sub);
  }
}

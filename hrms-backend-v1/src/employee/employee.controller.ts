import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
@UseGuards(AuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  async getDirectory(@Request() req) {
    return this.employeeService.findAllByCompany(req.user.companyId);
  }

  @Post('invite')
  async inviteEmployee(@Request() req, @Body() dto: CreateEmployeeDto) {
    return this.employeeService.inviteEmployee(req.user.companyId, dto);
  }

  // NEW: Update own profile (MUST be before :id)
  @Patch('me')
  async updateMyProfile(@Request() req, @Body() body: any) {
    // req.user.sub is the secure employee ID from the JWT token
    return this.employeeService.updateMyProfile(req.user.sub, body);
  }

  // Update an employee (Admin feature)
  @Patch(':id')
  async updateEmployee(@Request() req, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeeService.updateEmployee(req.user.companyId, id, dto);
  }

  // Delete an employee (Admin feature)
  @Delete(':id')
  async removeEmployee(@Request() req, @Param('id') id: string) {
    return this.employeeService.removeEmployee(req.user.companyId, id);
  }
}
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto'; // Import the new DTO!

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

  // NEW: Update an employee
  @Patch(':id')
  async updateEmployee(@Request() req, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeeService.updateEmployee(req.user.companyId, id, dto);
  }

  // NEW: Delete an employee
  @Delete(':id')
  async removeEmployee(@Request() req, @Param('id') id: string) {
    return this.employeeService.removeEmployee(req.user.companyId, id);
  }
}
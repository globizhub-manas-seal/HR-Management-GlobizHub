import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { EmployeeService } from './employee.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';


@Controller('employees')
@UseGuards(AuthGuard, PermissionsGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  async getDirectory(@Request() req) {
    return this.employeeService.findAllByCompany(req.user.companyId);
  }

  @Post('invite')
  async inviteEmployee(@Request() req, @Body() dto: CreateEmployeeDto) {
    return this.employeeService.inviteEmployee(req.user.companyId, dto, req.user.sub);
  }

  // --- UPDATED: Update own profile (Handles S3 Image Uploads) ---
  @Patch('me')
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateMyProfile(
    @Request() req,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File, // Catches the uploaded file in memory
  ) {
    // Pass both the text data (body) and the image (file) to the service
    return this.employeeService.updateMyProfile(req.user.sub, body, file);
  }

  @Get('me/devices')
  async getMyDevices(@Request() req) {
    return this.employeeService.getMyDevices(req.user.sub);
  }

  @Post('me/devices')
  async registerMyDevice(
    @Request() req,
    @Body() body: { deviceName: string; deviceIdentifier: string },
  ) {
    return this.employeeService.registerMyDevice(
      req.user.sub,
      body.deviceName,
      body.deviceIdentifier,
    );
  }

  @Delete('me/devices/:id')
  async revokeMyDevice(@Request() req, @Param('id') id: string) {
    return this.employeeService.revokeMyDevice(req.user.sub, id);
  }

  @Patch('me/notifications')
  async updateMyNotifications(@Request() req, @Body() body: any) {
    return this.employeeService.updateMyNotifications(req.user.sub, body);
  }

  // Update an employee (Admin feature)
  @Patch(':id')
  async updateEmployee(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeeService.updateEmployee(req.user.companyId, id, dto, req.user.sub);
  }

  // Delete an employee (Admin feature)
 

  // --- LIFECYCLE & DETAILS ENDPOINTS (Admin/HR feature) ---

  @Post(':id/emergency-contacts')
  async addEmergencyContact(@Param('id') id: string, @Body() body: any) {
    return this.employeeService.addEmergencyContact(id, body);
  }

  @Post(':id/skills')
  async addSkill(@Param('id') id: string, @Body() body: any) {
    return this.employeeService.addSkill(id, body);
  }

  @Post(':id/history')
  async addEmploymentHistory(@Param('id') id: string, @Body() body: any) {
    // Ensure dates are converted properly
    const payload = {
      ...body,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
    };
    return this.employeeService.addEmploymentHistory(id, payload);
  }

  @Post(':id/exit')
  async processEmployeeExit(@Param('id') id: string, @Body() body: any) {
    return this.employeeService.processEmployeeExit(id, body);
  }

  @Get(':id')
  async getEmployeeById(@Request() req, @Param('id') id: string) {
    return this.employeeService.findEmployeeById(req.user.companyId, id);
  }

  @Delete(':id/skills/:skillId')
  async removeSkill(@Param('id') id: string, @Param('skillId') skillId: string) {
    return this.employeeService.removeSkill(id, skillId);
  }

  @Delete(':id/emergency-contacts/:contactId')
  async removeEmergencyContact(@Param('id') id: string, @Param('contactId') contactId: string) {
    return this.employeeService.removeEmergencyContact(id, contactId);
  }

  // 3. Protect this specific route!
  @Delete(':id')
  @RequirePermissions('employee.delete') 
  async removeEmployee(@Request() req, @Param('id') id: string) {
    return this.employeeService.removeEmployee(req.user.companyId, id, req.user.sub);
  }
}

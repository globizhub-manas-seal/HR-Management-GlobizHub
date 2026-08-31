import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, ForbiddenException, Patch } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('organization')
@UseGuards(AuthGuard) // Protect all routes with JWT
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // Helper to ensure only Admins/HR can modify the organization structure
  private checkAdminAccess(role: string) {
    if (role !== 'SUPER_ADMIN' && role !== 'HR_HEAD') {
      throw new ForbiddenException('Only Admins or HR can modify organizational structure.');
    }
  }

  // --- BRANCHES ---
  @Get('branches')
  async getBranches(@Request() req) {
    return this.organizationService.getBranches(req.user.companyId);
  }

  @Post('branches')
  async createBranch(@Request() req, @Body() body: { name: string; address?: string }) {
    this.checkAdminAccess(req.user.role);
    return this.organizationService.createBranch(req.user.companyId, body.name, body.address);
  }

  @Delete('branches/:id')
  async deleteBranch(@Request() req, @Param('id') id: string) {
    this.checkAdminAccess(req.user.role);
    return this.organizationService.deleteBranch(req.user.companyId, id);
  }

  // --- DEPARTMENTS ---
  @Get('departments')
  async getDepartments(@Request() req) {
    return this.organizationService.getDepartments(req.user.companyId);
  }

  @Post('departments')
  async createDepartment(@Request() req, @Body() body: { name: string; branchId?: string }) {
    this.checkAdminAccess(req.user.role);
    return this.organizationService.createDepartment(req.user.companyId, body.name, body.branchId);
  }

  @Delete('departments/:id')
  async deleteDepartment(@Request() req, @Param('id') id: string) {
    this.checkAdminAccess(req.user.role);
    return this.organizationService.deleteDepartment(req.user.companyId, id);
  }

  // --- ROLES ---
  @Get('roles')
  async getRoles(@Request() req) {
    return this.organizationService.getRoles(req.user.companyId);
  }

  @Post('roles')
  async createRole(@Request() req, @Body() body: { name: string; departmentId?: string }) {
    this.checkAdminAccess(req.user.role);
    return this.organizationService.createRole(req.user.companyId, body.name, body.departmentId);
  }

  @Delete('roles/:id')
  async deleteRole(@Request() req, @Param('id') id: string) {
    this.checkAdminAccess(req.user.role);
    return this.organizationService.deleteRole(req.user.companyId, id);
  }

  // --- DESIGNATIONS ---
  @Get('designations')
  async getDesignations(@Request() req) {
    return this.organizationService.getDesignations(req.user.companyId);
  }

  @Post('designations')
  async createDesignation(@Request() req, @Body() body: any) {
    this.checkAdminAccess(req.user.role);
    return this.organizationService.createDesignation(req.user.companyId, body);
  }

  @Patch('designations/:id')
  async updateDesignation(@Request() req, @Param('id') id: string, @Body() body: any) {
    this.checkAdminAccess(req.user.role);
    return this.organizationService.updateDesignation(req.user.companyId, id, body);
  }

  @Patch('designations/:id/permissions')
  async updateDesignationPermissions(@Request() req, @Param('id') id: string, @Body() body: any) {
    this.checkAdminAccess(req.user.role);
    return this.organizationService.updateDesignationPermissions(req.user.companyId, id, body);
  }

  @Delete('designations/:id')
  async deleteDesignation(@Request() req, @Param('id') id: string) {
    this.checkAdminAccess(req.user.role);
    return this.organizationService.deleteDesignation(req.user.companyId, id);
  }
}
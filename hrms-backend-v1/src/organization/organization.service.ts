import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // BRANCHES
  // ==========================================
  
  async getBranches(companyId: string) {
    return this.prisma.branch.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createBranch(companyId: string, name: string, address?: string) {
    return this.prisma.branch.create({
      data: {
        companyId,
        name,
        address,
      },
    });
  }

  async deleteBranch(companyId: string, branchId: string) {
    // Verify it belongs to the company before deleting
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, companyId } });
    if (!branch) throw new NotFoundException('Branch not found');

    return this.prisma.branch.delete({ where: { id: branchId } });
  }

  // ==========================================
  // DEPARTMENTS
  // ==========================================

  async getDepartments(companyId: string) {
    return this.prisma.department.findMany({
      where: { companyId },
      include: { branch: true }, // Include branch details if assigned
      orderBy: { createdAt: 'asc' },
    });
  }

  async createDepartment(companyId: string, name: string, branchId?: string) {
    return this.prisma.department.create({
      data: {
        companyId,
        name,
        branchId,
      },
    });
  }

  async deleteDepartment(companyId: string, departmentId: string) {
    const dept = await this.prisma.department.findFirst({ where: { id: departmentId, companyId } });
    if (!dept) throw new NotFoundException('Department not found');

    return this.prisma.department.delete({ where: { id: departmentId } });
  }

  // ==========================================
  // ROLES
  // ==========================================

  async getRoles(companyId: string) {
    return this.prisma.role.findMany({
      where: { companyId },
      include: { department: true }, // Include department details if assigned
      orderBy: { createdAt: 'asc' },
    });
  }

  async createRole(companyId: string, name: string, departmentId?: string) {
    return this.prisma.role.create({
      data: {
        companyId,
        name,
        departmentId,
      },
    });
  }

  async deleteRole(companyId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, companyId } });
    if (!role) throw new NotFoundException('Role not found');

    return this.prisma.role.delete({ where: { id: roleId } });
  }
}
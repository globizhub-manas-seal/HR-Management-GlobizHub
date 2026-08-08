import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { LeaveStatus } from '../../generated/prisma/client';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  // 1. Employee applies for leave
  async createLeaveRequest(employeeId: string, companyId: string, dto: CreateLeaveDto) {
    // Ensure balance record exists, if not create default
    let balance = await this.prisma.leaveBalance.findUnique({ where: { employeeId } });
    if (!balance) {
      balance = await this.prisma.leaveBalance.create({
        data: { employeeId, companyId },
      });
    }

    return this.prisma.leaveRequest.create({
      data: {
        employeeId,
        companyId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
        status: LeaveStatus.PENDING,
      },
    });
  }

  // 2. Get my leave requests & balance
  async getMyLeaves(employeeId: string) {
    const requests = await this.prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId },
    });
    return { requests, balance };
  }

  // 3. Admin gets all company leave requests
  async getAllCompanyLeaves(companyId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { companyId },
      include: {
        employee: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. Admin Approves / Rejects leave
  async updateLeaveStatus(companyId: string, leaveId: string, status: LeaveStatus, userRole: string) {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'HR_HEAD') {
      throw new ForbiddenException('Only Admins or HR can update leave status.');
    }

    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id: leaveId, companyId },
    });

    if (!leave) throw new NotFoundException('Leave request not found.');

    return this.prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status },
    });
  }
}
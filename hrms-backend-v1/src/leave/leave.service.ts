import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { LeaveStatus } from '../../generated/prisma/client';

@Injectable()
export class LeaveService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService, // <-- Injected correctly
  ) {}

  // 1. Employee applies for leave
  async createLeaveRequest(
    employeeId: string,
    companyId: string,
    dto: CreateLeaveDto,
  ) {
    // Ensure balance record exists, if not create default
    let balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId },
    });
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
  async updateLeaveStatus(
    companyId: string,
    leaveId: string,
    status: LeaveStatus,
    userRole: string,
  ) {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'HR_HEAD') {
      throw new ForbiddenException(
        'Only Admins or HR can update leave status.',
      );
    }

    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id: leaveId, companyId },
    });

    if (!leave) throw new NotFoundException('Leave request not found.');

    const updatedLeave = await this.prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status },
    });

    // --- Send Notifications based on the HR decision ---
    if (status === 'APPROVED') {
      await this.notificationService.sendInternalNotification(
        companyId,
        leave.employeeId,
        'Leave Approved! 🏖️',
        `Your leave request for ${new Date(leave.startDate).toLocaleDateString()} has been approved.`,
        'LEAVE',
      );
    } else if (status === 'REJECTED') {
      await this.notificationService.sendInternalNotification(
        companyId,
        leave.employeeId,
        'Leave Update',
        `Your leave request for ${new Date(leave.startDate).toLocaleDateString()} was declined.`,
        'LEAVE',
      );
    }

    return updatedLeave;
  }

  // ==========================================
  // HOLIDAY MANAGEMENT
  // ==========================================

  async getHolidays(companyId: string, year?: number) {
    const startDate = year ? new Date(`${year}-01-01`) : new Date();
    const endDate = year ? new Date(`${year}-12-31`) : undefined;

    return this.prisma.holiday.findMany({
      where: {
        companyId,
        date: endDate ? { gte: startDate, lte: endDate } : { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  async addHoliday(
    companyId: string,
    data: { name: string; date: Date; type?: string },
  ) {
    return this.prisma.holiday.create({
      data: {
        companyId,
        name: data.name,
        date: new Date(data.date),
        type: data.type || 'NATIONAL',
      },
    });
  }

  async removeHoliday(companyId: string, holidayId: string) {
    return this.prisma.holiday.delete({
      where: { id: holidayId, companyId },
    });
  }

  // ==========================================
  // SMART LEAVE CALCULATOR
  // ==========================================

  async calculateEffectiveLeaveDays(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end)
      throw new BadRequestException('Start date cannot be after end date');

    const holidays = await this.prisma.holiday.findMany({
      where: {
        companyId,
        date: { gte: start, lte: end },
      },
    });

    const holidayDateStrings = holidays.map(
      (h) => h.date.toISOString().split('T')[0],
    );

    let effectiveDays = 0;
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 6 is Saturday
      const dateString = currentDate.toISOString().split('T')[0];

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidayDateStrings.includes(dateString);

      if (!isWeekend && !isHoliday) {
        effectiveDays++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return effectiveDays;
  }

  async applyForLeave(employeeId: string, companyId: string, data: any) {
    const requestedDays = await this.calculateEffectiveLeaveDays(
      companyId,
      data.startDate,
      data.endDate,
    );

    if (requestedDays === 0) {
      throw new BadRequestException(
        'This leave request only spans across weekends or holidays!',
      );
    }

    // Balance checking and leave creation logic goes here...
  }
}

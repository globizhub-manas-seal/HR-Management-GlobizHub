import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  // 1. Get schedule for the logged-in employee (Upcoming 7 days)
  async getMySchedule(employeeId: string, companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return this.prisma.schedule.findMany({
      where: {
        employeeId,
        companyId,
        date: { gte: today, lte: nextWeek },
      },
      include: {
        shift: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  // 2. Admin: Create a new Shift Template
  async createShift(companyId: string, dto: any, userRole: string) {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'HR_HEAD') {
      throw new ForbiddenException('Only Admins can create shifts.');
    }
    return this.prisma.shift.create({
      data: { ...dto, companyId },
    });
  }

  // Get all Shift Templates for the Company
  async getShifts(companyId: string) {
    return this.prisma.shift.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 3. Admin: Assign Schedule to an Employee
  async assignSchedule(companyId: string, dto: any, userRole: string) {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'HR_HEAD') {
      throw new ForbiddenException('Only Admins can assign schedules.');
    }
    
    // Upsert ensures if a schedule already exists for that date, it updates it instead of crashing
    return this.prisma.schedule.upsert({
      where: {
        employeeId_date: {
          employeeId: dto.employeeId,
          date: new Date(dto.date),
        }
      },
      update: {
        shiftId: dto.shiftId,
        isDayOff: dto.isDayOff || false,
      },
      create: {
        employeeId: dto.employeeId,
        companyId,
        shiftId: dto.shiftId,
        date: new Date(dto.date),
        isDayOff: dto.isDayOff || false,
      },
    });
  }
}
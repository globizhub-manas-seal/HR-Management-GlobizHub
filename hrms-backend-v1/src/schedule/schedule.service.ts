import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
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

  // 3. Get all Shift Templates for the Company
  async getShifts(companyId: string) {
    return this.prisma.shift.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 4. Admin: Update a Shift Template
  async updateShift(shiftId: string, companyId: string, dto: any, userRole: string) {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'HR_HEAD') {
      throw new ForbiddenException('Only Admins can edit shifts.');
    }

    // Security Check: Ensure the shift actually belongs to this company
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, companyId },
    });
    if (!shift) throw new NotFoundException('Shift not found in your organization.');

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: dto,
    });
  }

  // 5. Admin: Delete a Shift Template
  async deleteShift(shiftId: string, companyId: string, userRole: string) {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'HR_HEAD') {
      throw new ForbiddenException('Only Admins can delete shifts.');
    }

    // Security Check: Ensure the shift actually belongs to this company
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, companyId },
    });
    if (!shift) throw new NotFoundException('Shift not found in your organization.');

    return this.prisma.shift.delete({
      where: { id: shiftId },
    });
  }

  // 6. Admin: Assign Schedule to an Employee
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
        shiftId: dto.shiftId || null,
        isDayOff: dto.isDayOff || false,
      },
      create: {
        employeeId: dto.employeeId,
        companyId,
        shiftId: dto.shiftId || null,
        date: new Date(dto.date),
        isDayOff: dto.isDayOff || false,
      },
    });
  }
}
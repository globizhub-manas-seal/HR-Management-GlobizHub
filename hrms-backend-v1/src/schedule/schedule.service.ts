import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ScheduleService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // 1. Get schedule for the logged-in employee (Upcoming 7 days)
  async getMySchedule(employeeId: string, companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const schedules = await this.prisma.schedule.findMany({
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

    const overrides = await this.prisma.shiftAssignmentOverride.findMany({
      where: {
        employeeId,
        companyId,
        date: { gte: today, lte: nextWeek },
        status: 'ACTIVE',
      },
      include: {
        overrideShift: true,
        relatedSwapRequest: {
          include: {
            requester: { select: { id: true, firstName: true, lastName: true } },
            target: { select: { id: true, firstName: true, lastName: true } },
          }
        }
      },
    });

    return schedules.map((schedule) => {
      const override = overrides.find(
        (o) => o.date.toDateString() === schedule.date.toDateString()
      );
      if (override) {
        return {
          ...schedule,
          isOverride: true,
          originalShift: schedule.shift,
          isDayOff: override.overrideShiftId === null ? true : schedule.isDayOff,
          shift: override.overrideShift,
          overrideSource: override.source,
          relatedSwapRequest: override.relatedSwapRequest,
        };
      }
      return schedule;
    });
  }

  // 2. Admin: Create a new Shift Template
  async createShift(companyId: string, dto: any, userRole: string, actorId?: string) {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'HR_HEAD') {
      throw new ForbiddenException('Only Admins can create shifts.');
    }
    const shift = await this.prisma.shift.create({
      data: { ...dto, companyId },
    });

    await this.auditService.logAction(
      companyId,
      actorId || null,
      'CREATE',
      'Shift',
      shift.id,
      null,
      { name: shift.name, startTime: shift.startTime, endTime: shift.endTime }
    );

    return shift;
  }

  // 3. Get all Shift Templates for the Company
  async getShifts(companyId: string) {
    return this.prisma.shift.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 4. Admin: Update a Shift Template
  async updateShift(shiftId: string, companyId: string, dto: any, userRole: string, actorId?: string) {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'HR_HEAD') {
      throw new ForbiddenException('Only Admins can edit shifts.');
    }

    // Security Check: Ensure the shift actually belongs to this company
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, companyId },
    });
    if (!shift) throw new NotFoundException('Shift not found in your organization.');

    const updated = await this.prisma.shift.update({
      where: { id: shiftId },
      data: dto,
    });

    await this.auditService.logAction(
      companyId,
      actorId || null,
      'UPDATE',
      'Shift',
      shiftId,
      { name: shift.name, startTime: shift.startTime, endTime: shift.endTime },
      { name: updated.name, startTime: updated.startTime, endTime: updated.endTime }
    );

    return updated;
  }

  // 5. Admin: Delete a Shift Template
  async deleteShift(shiftId: string, companyId: string, userRole: string, actorId?: string) {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'HR_HEAD') {
      throw new ForbiddenException('Only Admins can delete shifts.');
    }

    // Security Check: Ensure the shift actually belongs to this company
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, companyId },
    });
    if (!shift) throw new NotFoundException('Shift not found in your organization.');

    const deleted = await this.prisma.shift.delete({
      where: { id: shiftId },
    });

    await this.auditService.logAction(
      companyId,
      actorId || null,
      'DELETE',
      'Shift',
      shiftId,
      { name: shift.name, startTime: shift.startTime, endTime: shift.endTime },
      null
    );

    return deleted;
  }

  // 6. Admin: Assign Schedule to an Employee
  async assignSchedule(companyId: string, dto: any, userRole: string, actorId?: string) {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'HR_HEAD') {
      throw new ForbiddenException('Only Admins can assign schedules.');
    }
    
    // Upsert ensures if a schedule already exists for that date, it updates it instead of crashing
    const schedule = await this.prisma.schedule.upsert({
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

    await this.auditService.logAction(
      companyId,
      actorId || null,
      'UPDATE',
      'Schedule',
      schedule.id,
      null,
      { employeeId: dto.employeeId, date: dto.date, shiftId: dto.shiftId, isDayOff: dto.isDayOff }
    );

    return schedule;
  }

  // 7. Get an employee's schedule on a specific date (for Shift Swap helper)
  async getEmployeeScheduleOnDate(employeeId: string, dateStr: string, companyId: string) {
    const queryDate = new Date(dateStr);
    queryDate.setUTCHours(0, 0, 0, 0);
    return this.prisma.schedule.findFirst({
      where: {
        employeeId,
        companyId,
        date: queryDate,
      },
      include: {
        shift: true,
      },
    });
  }
}
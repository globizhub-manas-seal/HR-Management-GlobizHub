import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { OverrideSource } from '../../generated/prisma/client';

@Injectable()
export class AttendanceCronService {
  private readonly logger = new Logger(AttendanceCronService.name);

  constructor(private prisma: PrismaService) {}

  // Helper to calculate shift duration in hours
  private getShiftDurationHours(
    startTimeStr: string,
    endTimeStr: string,
    isNightShift: boolean,
  ): number {
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    const start = startH + startM / 60;
    let end = endH + endM / 60;

    if (isNightShift || end < start) {
      end += 24; // spans past midnight
    }

    return Math.round((end - start) * 100) / 100;
  }

  // This runs automatically every night at 11:59 PM
  @Cron('59 23 * * *')
  async handleDailyAttendanceCalculation() {
    this.logger.log('Starting daily attendance calculation...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Fetch all active employees
    const employees = await this.prisma.employee.findMany({
      include: { company: { include: { settings: true } } },
    });

    for (const employee of employees) {
      // Find their attendance record for today
      const record = await this.prisma.attendance.findFirst({
        where: {
          employeeId: employee.id,
          date: { gte: today, lte: endOfDay },
        },
      });

      // Check if employee has a shift transfer override (meaning they gave their shift away)
      const override = await this.prisma.shiftAssignmentOverride.findFirst({
        where: {
          employeeId: employee.id,
          date: today,
          status: 'ACTIVE',
        },
      });

      // 2. Mark SHIFT_GIVEN if they gave their shift away and didn't clock in
      if (
        !record &&
        override &&
        override.overrideShiftId === null &&
        override.source === OverrideSource.SHIFT_SWAP
      ) {
        await this.prisma.attendance.create({
          data: {
            employeeId: employee.id,
            companyId: employee.companyId,
            date: today,
            status: 'SHIFT_GIVEN',
            workingHours: 0,
            overtimeHours: 0,
            shiftId: override.originalShiftId,
            shiftSwapRequestId: override.relatedSwapRequestId,
          },
        });
        continue; // Skip to next employee
      }

      // 3. Mark ABSENT if no record exists
      if (!record) {
        await this.prisma.attendance.create({
          data: {
            employeeId: employee.id,
            companyId: employee.companyId,
            date: today,
            status: 'ABSENT',
          },
        });
        continue; // Skip to next employee
      }

      // 4. If they have a record, calculate Late Status, Working Hours, and Overtime
      let finalStatus = record.status;
      let totalHours = 0;
      let overtimeHours = 0;
      let isLate = false;

      // Find the shift info to evaluate times
      let shift: any = null;
      if (record.shiftId) {
        shift = await this.prisma.shift.findUnique({
          where: { id: record.shiftId },
        });
      } else {
        // Fallback to schedule
        const schedule = await this.prisma.schedule.findFirst({
          where: { employeeId: employee.id, date: today },
          include: { shift: true },
        });
        shift = schedule?.shift || null;
      }

      // Default fallback times if no shift found
      const shiftStartTimeStr = shift?.startTime || '09:00';
      const shiftEndTimeStr = shift?.endTime || '18:00';
      const isNight = shift?.isNightShift || false;
      const grace = employee.company.settings?.gracePeriodMinutes ?? 15;

      const shiftStart = new Date(today);
      const [startH, startM] = shiftStartTimeStr.split(':').map(Number);
      shiftStart.setHours(startH, startM, 0, 0);

      // Determine default checkOutTime if not checked out (shift end time)
      const defaultCheckOut = new Date(today);
      const [endH, endM] = shiftEndTimeStr.split(':').map(Number);
      defaultCheckOut.setHours(endH, endM, 0, 0);
      if (isNight || endH < startH) {
        defaultCheckOut.setDate(defaultCheckOut.getDate() + 1);
      }

      const checkOutTime = record.checkOutTime || defaultCheckOut;

      // Calculate Hours
      if (record.checkInTime) {
        const diffMs = checkOutTime.getTime() - record.checkInTime.getTime();
        totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Convert MS to Hours (e.g., 8.5)

        // Calculate if late
        const shiftStartWithGrace = new Date(shiftStart);
        shiftStartWithGrace.setMinutes(
          shiftStartWithGrace.getMinutes() + grace,
        );

        if (record.checkInTime > shiftStartWithGrace) {
          isLate = true;
        }

        // Set status
        if (record.shiftSwapRequestId) {
          finalStatus = 'PROXY_SHIFT_SWAP';
        } else {
          finalStatus = isLate ? 'LATE' : 'PRESENT';
        }

        // Calculate overtime
        const shiftDuration = this.getShiftDurationHours(
          shiftStartTimeStr,
          shiftEndTimeStr,
          isNight,
        );
        if (totalHours > shiftDuration) {
          const extra = totalHours - shiftDuration;
          if (record.shiftSwapRequestId) {
            const otIncludesSwap =
              employee.company.settings?.overtimeIncludesShiftSwaps ?? false;
            overtimeHours = otIncludesSwap ? extra : 0;
          } else {
            overtimeHours = extra;
          }
        }
      }

      // 5. Update the database record with the final calculated math
      await this.prisma.attendance.update({
        where: { id: record.id },
        data: {
          status: finalStatus,
          workingHours: totalHours,
          overtimeHours,
          isLate,
          checkOutTime: record.checkOutTime
            ? record.checkOutTime
            : checkOutTime, // Save the auto-checkout if they forgot
        },
      });
    }

    this.logger.log('Daily attendance calculation completed successfully!');
  }
}

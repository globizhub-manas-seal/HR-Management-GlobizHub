import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceCronService {
  private readonly logger = new Logger(AttendanceCronService.name);

  constructor(private prisma: PrismaService) {}

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
      include: { company: { include: { settings: true } } }
    });

    for (const employee of employees) {
      // Find their attendance record for today
      const record = await this.prisma.attendance.findFirst({
        where: {
          employeeId: employee.id,
          date: { gte: today, lte: endOfDay },
        },
      });

      // 2. Mark ABSENT if no record exists
      if (!record) {
        await this.prisma.attendance.create({
          data: {
            employeeId: employee.id,
            companyId: employee.companyId,
            date: new Date(),
            status: 'ABSENT',
          },
        });
        continue; // Skip to next employee
      }

      // 3. If they have a record, calculate Late Status and Working Hours
      let finalStatus = record.status;
      let totalHours = 0;

      // Ensure we have a valid Check-Out time (auto-checkout at 6 PM if they forgot)
      const checkOutTime = record.checkOutTime || new Date(today.setHours(18, 0, 0, 0));

      // Calculate Hours
      if (record.checkInTime) {
        const diffMs = checkOutTime.getTime() - record.checkInTime.getTime();
        totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Convert MS to Hours (e.g., 8.5)

        // Assume standard shift starts at 9:00 AM (09:00). We give a 15-minute grace period.
        const shiftStart = new Date(today);
        shiftStart.setHours(9, 15, 0, 0);

        if (record.checkInTime > shiftStart) {
          finalStatus = 'LATE';
        } else {
          finalStatus = 'PRESENT'; // Only present if they were on time
        }
      }

      // 4. Update the database record with the final calculated math
      await this.prisma.attendance.update({
        where: { id: record.id },
        data: {
          status: finalStatus,
          workingHours: totalHours,
          checkOutTime: record.checkOutTime ? record.checkOutTime : checkOutTime, // Save the auto-checkout if they forgot
        },
      });
    }

    this.logger.log('Daily attendance calculation completed successfully!');
  }
}
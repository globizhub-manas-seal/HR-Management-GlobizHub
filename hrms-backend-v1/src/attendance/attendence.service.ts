import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClockInDto } from './dto/clock-in.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // The Haversine Formula to calculate distance in meters
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async clockIn(employeeId: string, companyId: string, dto: ClockInDto, userIp: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Check if the employee already has an attendance record for today
    const existingRecord = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        companyId,
        date: { gte: today, lte: endOfDay },
      },
    });

    // 2. Prevent duplicate clock-in if they haven't clocked out yet
    if (existingRecord && !existingRecord.checkOutTime) {
      throw new BadRequestException('You are already clocked in. Please clock out first before starting a new session.');
    }

    // 3. Optional: If they already completed a shift today, prevent a second full clock-in or handle it
    if (existingRecord && existingRecord.checkOutTime) {
      throw new BadRequestException('You have already completed your attendance for today.');
    }

    // 4. Fetch Company Settings for location/IP validation
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId },
    });

    if (!settings) throw new BadRequestException('Company settings not configured.');

    let isVerified = false;
    let verificationMethod = 'NONE';

    // 5. Verification Method A: Geolocation (Haversine Check)
    if (settings.isGpsRestrictionOn && settings.officeLatitude && settings.officeLongitude && dto.latitude && dto.longitude) {
      const distanceMeters = this.calculateDistance(
        settings.officeLatitude,
        settings.officeLongitude,
        dto.latitude,
        dto.longitude
      );

      if (distanceMeters <= settings.allowedRadiusMeters) {
        isVerified = true;
        verificationMethod = 'GPS';
      }
    }

    // 6. Verification Method B: Network IP Check (Fallback)
    if (!isVerified && settings.isIpRestrictionOn && settings.officeIpAddress) {
      if (userIp.includes(settings.officeIpAddress)) {
        isVerified = true;
        verificationMethod = 'WIFI_IP';
      }
    }

    // If neither restriction is turned on in settings, allow it by default or enforce verification
    if (!settings.isGpsRestrictionOn && !settings.isIpRestrictionOn) {
      isVerified = true;
      verificationMethod = 'MANUAL';
    }

    if (!isVerified) {
      throw new UnauthorizedException('You must be at the office location or connected to office Wi-Fi to clock in.');
    }

    // 7. Create the single unique attendance record for today
    const attendance = await this.prisma.attendance.create({
      data: {
        employeeId,
        companyId,
        date: new Date(),
        checkInTime: new Date(),
        status: 'PRESENT',
        verificationMethod: verificationMethod,
      },
    });

    return { message: `Successfully clocked in via ${verificationMethod}`, attendance };
  }

  async clockOut(employeeId: string, companyId: string) {
    // Find today's open attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        companyId,
        checkOutTime: null, // Find the one they haven't closed yet
        date: { gte: today },
      },
    });

    if (!record) {
      throw new BadRequestException(
        'No active clock-in record found for today.',
      );
    }

    // Update with checkout time
    const updated = await this.prisma.attendance.update({
      where: { id: record.id },
      data: { checkOutTime: new Date() },
    });

    return { message: 'Successfully clocked out!', data: updated };
  }

  // Fetch Attendance History for an Employee
  async getMyHistory(employeeId: string, companyId: string) {
    return this.prisma.attendance.findMany({
      where: {
        employeeId: employeeId,
        companyId: companyId,
      },
      orderBy: { date: 'desc' }, // Show newest records first
      take: 30, // Limit to the last 30 days for performance
    });
  }

  // Fetch Live Admin Dashboard Stats for Today
  async getAdminTodayStats(companyId: string) {
    // 1. Get the exact start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Count total active employees in the company
    const totalEmployees = await this.prisma.employee.count({
      where: { companyId },
    });

    // 3. Fetch all attendance records generated today
    const todayRecords = await this.prisma.attendance.findMany({
      where: {
        companyId,
        date: { gte: today, lte: endOfDay },
      },
    });

    // 4. Calculate the real-time metrics
    const presentToday = todayRecords.filter(record => record.status === 'PRESENT').length;
    const lateToday = todayRecords.filter(record => record.status === 'LATE').length;
    
    // Anyone who hasn't clocked in yet today is technically pending/absent
    const absentToday = totalEmployees - todayRecords.length;

    return {
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
    };
  }

  // Fetch Personal Employee Dashboard Stats
  async getMyDashboardStats(employeeId: string, companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Get today's specific record
    const todayRecord = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        companyId,
        date: { gte: today, lte: endOfDay },
      },
    });

    // 2. Get current month's records for aggregated stats
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthRecords = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        companyId,
        date: { gte: startOfMonth, lte: endOfDay },
      },
    });

    // 3. Calculate Monthly Stats
    const presentDays = monthRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absentDays = monthRecords.filter(r => r.status === 'ABSENT').length;
    
    // Simple Attendance % (Present Days / Total Days passed in the month so far)
    const currentDayOfMonth = today.getDate();
    const attendancePercentage = Math.round((presentDays / currentDayOfMonth) * 100) || 0;

    return {
      todayStatus: todayRecord ? todayRecord.status : 'PENDING',
      checkInTime: todayRecord?.checkInTime || null,
      checkOutTime: todayRecord?.checkOutTime || null,
      workingHours: todayRecord?.workingHours || 0,
      presentDays,
      absentDays,
      attendancePercentage,
    };
  }
}

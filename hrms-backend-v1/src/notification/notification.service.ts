import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  // 1. Fetch unread notifications for a specific user
  async getMyUnreadNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20, // Only fetch the 20 most recent
    });
  }

  // 2. Mark a notification as read
  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  // 3. Mark ALL as read
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // ========================================================
  // INTERNAL HELPER: Call this from LeaveService, AttendanceService, etc.
  // ========================================================
  async sendInternalNotification(
    companyId: string,
    userId: string,
    title: string,
    message: string,
    type: 'LEAVE' | 'ATTENDANCE' | 'SYSTEM' = 'SYSTEM',
  ) {
    return this.prisma.notification.create({
      data: { companyId, userId, title, message, type },
    });
  }
}

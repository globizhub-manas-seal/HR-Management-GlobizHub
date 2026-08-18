import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementService {
  constructor(private prisma: PrismaService) {}

  async createAnnouncement(companyId: string, title: string, content: string) {
    return this.prisma.announcement.create({
      data: {
        companyId,
        title,
        content,
      },
    });
  }

  async getAnnouncements(companyId: string) {
    return this.prisma.announcement.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAnnouncement(companyId: string, id: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, companyId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found in your workspace');
    }

    return this.prisma.announcement.delete({
      where: { id },
    });
  }
}

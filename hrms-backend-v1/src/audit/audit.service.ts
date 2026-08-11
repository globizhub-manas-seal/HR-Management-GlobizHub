import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  // 1. Internal helper for other services to call
  async logAction(
    companyId: string,
    actorId: string | null,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'REJECT',
    entity: string,
    entityId?: string,
    oldValue?: any,
    newValue?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // We execute this asynchronously without awaiting it in the main thread
    // so that auditing doesn't slow down the actual user request.
    this.prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action,
        entity,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        ipAddress,
        userAgent,
      }
    }).catch(err => {
      console.error("Failed to write audit log:", err);
    });
  }

  // 2. Fetch logs for the Admin Dashboard
  async getLogs(companyId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: { companyId },
      include: {
        actor: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
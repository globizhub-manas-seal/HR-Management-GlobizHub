import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SequenceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates a transaction-safe, tenant-isolated sequential identifier.
   * Format: {PREFIX}-{YEAR}-{0000} (e.g. MR-2026-0001, JOB-2026-0001)
   * Uses PostgreSQL atomic upsert to guarantee zero race condition collisions.
   */
  async getNextSequence(
    companyId: string,
    entityType:
      'MANPOWER_REQUISITION' | 'JOB_REQUISITION' | 'JOB_OFFER' | 'EMPLOYEE',
    prefix: string,
  ): Promise<string> {
    const year = new Date().getFullYear();

    const result = await this.prisma.$queryRaw<Array<{ currentValue: number }>>`
      INSERT INTO "CompanySequence" ("id", "companyId", "entityType", "year", "currentValue", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${companyId}, ${entityType}, ${year}, 1, NOW(), NOW())
      ON CONFLICT ("companyId", "entityType", "year")
      DO UPDATE SET "currentValue" = "CompanySequence"."currentValue" + 1, "updatedAt" = NOW()
      RETURNING "currentValue";
    `;

    const seqNum = result[0]?.currentValue || 1;
    const padded = String(seqNum).padStart(4, '0');
    return `${prefix}-${year}-${padded}`;
  }
}

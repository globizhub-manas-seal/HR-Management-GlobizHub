import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unified User hub.
 *
 * Every person on the platform — super admins, platform staff, company
 * owners/admins, managers and employees — gets exactly one row in the
 * `User` table. Domain profiles (Employee / PlatformUser) keep their domain
 * data and link back to the hub through `Employee.userId` /
 * `PlatformUser.userId`.
 *
 * The hub is the canonical credential store. `syncForEmployee` /
 * `syncForPlatformUser` keep it in sync after every create / password
 * change, `backfillAll` provisions rows for existing data, and the login
 * flow self-heals any drift (compare + re-sync) so no code path can
 * silently desync credentials.
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create/update the User hub row for an Employee profile.
   * Idempotent — safe to call after any employee create or password write.
   */
  async syncForEmployee(email: string) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    const employee = await this.prisma.employee.findUnique({
      where: { email: normalized },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        companyId: true,
        firstName: true,
        lastName: true,
        employmentStatus: true,
      },
    });
    if (!employee) return null;

    const data = {
      password: employee.password,
      scope: 'COMPANY' as const,
      role: employee.role,
      displayName: `${employee.firstName} ${employee.lastName}`.trim(),
      companyId: employee.companyId,
      isActive: !['TERMINATED', 'RESIGNED'].includes(employee.employmentStatus),
    };

    const user = await this.prisma.user.upsert({
      where: { email: normalized },
      create: { email: normalized, ...data, employeeId: employee.id },
      update: { ...data, employeeId: employee.id },
      select: { id: true },
    });

    // Ensure the back-link on the profile row (older rows may miss it)
    if (employee.id) {
      await this.prisma.employee
        .updateMany({
          where: { id: employee.id, userId: null },
          data: { userId: user.id },
        })
        .catch(() => {});
    }
    return user;
  }

  /**
   * Create/update the User hub row for a PlatformUser profile.
   */
  async syncForPlatformUser(email: string) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    const pu = await this.prisma.platformUser.findUnique({
      where: { email: normalized },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
    if (!pu) return null;

    const data = {
      password: pu.password,
      scope: 'PLATFORM' as const,
      role: pu.role,
      displayName: `${pu.firstName} ${pu.lastName}`.trim(),
      companyId: null,
      isActive: pu.isActive,
    };

    const user = await this.prisma.user.upsert({
      where: { email: normalized },
      create: { email: normalized, ...data, platformUserId: pu.id },
      update: { ...data, platformUserId: pu.id },
      select: { id: true },
    });

    await this.prisma.platformUser
      .updateMany({
        where: { id: pu.id, userId: null },
        data: { userId: user.id },
      })
      .catch(() => {});
    return user;
  }

  /**
   * Provision hub rows for every existing Employee / PlatformUser.
   * Called by the seed script and safe to re-run any time.
   */
  async backfillAll(): Promise<{ employees: number; platformUsers: number }> {
    const [employees, platformUsers] = await Promise.all([
      this.prisma.employee.findMany({ select: { email: true } }),
      this.prisma.platformUser.findMany({ select: { email: true } }),
    ]);

    let eCount = 0;
    for (const e of employees) {
      const r = await this.syncForEmployee(e.email).catch(() => null);
      if (r) eCount++;
    }
    let pCount = 0;
    for (const p of platformUsers) {
      const r = await this.syncForPlatformUser(p.email).catch(() => null);
      if (r) pCount++;
    }

    this.logger.log(
      `User hub backfill: ${eCount} employee(s), ${pCount} platform user(s) synced.`,
    );
    return { employees: eCount, platformUsers: pCount };
  }

  /**
   * Self-heal: if the profile password hash differs from the hub (e.g. a
   * legacy write path we did not instrument), re-sync the hub so the next
   * login works.
   */
  async healPasswordDrift(email: string) {
    try {
      const normalized = email.trim().toLowerCase();
      const user = await this.prisma.user.findUnique({
        where: { email: normalized },
        select: { id: true, employeeId: true, platformUserId: true },
      });
      if (!user) return;
      if (user.employeeId) {
        const emp = await this.prisma.employee.findUnique({
          where: { id: user.employeeId },
          select: { password: true },
        });
        if (emp && emp.password) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { password: emp.password },
          });
        }
      } else if (user.platformUserId) {
        const pu = await this.prisma.platformUser.findUnique({
          where: { id: user.platformUserId },
          select: { password: true },
        });
        if (pu && pu.password) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { password: pu.password },
          });
        }
      }
    } catch {
      // self-healing must never break the login flow
    }
  }
}

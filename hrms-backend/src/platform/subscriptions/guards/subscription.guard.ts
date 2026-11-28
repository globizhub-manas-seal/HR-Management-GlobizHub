import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformSettingsService } from '../../settings/platform-settings.service';

/**
 * Prefixes a tenant session may always reach, even when payment is overdue.
 * Everything else requires an active subscription / trial / grace period.
 */
const ALWAYS_ALLOWED_PREFIXES = [
  '/auth',
  '/organization/subscription',
  '/organization/billing',
  '/notifications',
  '/support',
];

const PUBLIC_PREFIXES = [
  '/uploads',
  '/careers',
  '/platform',
  // Health root endpoint
  '/',
];

interface CompanyAccessState {
  allowed: boolean;
  reason?: 'SUSPENDED' | 'UNVERIFIED' | 'PAST_DUE' | 'INACTIVE';
  graceUntil?: Date;
  /** Custom upgrade message for expired freemium accounts */
  freemiumMessage?: string;
  invoice?: { id: string; amountDue: number; dueDate: Date; invoiceNumber: string };
}

/**
 * Global subscription enforcement guard.
 *
 * Runs for every request BEFORE controller guards. It independently verifies
 * the JWT (controller guards like AuthGuard run later and will still reject
 * invalid tokens), then applies the company's subscription state:
 *
 *  - FREEMIUM (PLAN_FREE, within freemiumEndsAt) -> full access
 *  - ACTIVE                 -> full access
 *  - PAST_DUE               -> full access during grace window (SystemConfig
 *                              gracePeriodDays after the unpaid invoice due
 *                              date), then 402 locked to billing endpoints
 *  - EXPIRED (freemium period over) -> 402 locked to billing endpoints with
 *                              an upgrade message
 *  - EXPIRED / CANCELLED (paid) -> 402 locked to billing endpoints
 *  - SUSPENDED company      -> 403 everywhere
 *
 * All thresholds come from SystemConfig — nothing is hardcoded.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);
  private readonly stateCache = new Map<
    string,
    { state: CompanyAccessState; at: number }
  >();
  private readonly CACHE_TTL_MS = 15_000;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private settings: PlatformSettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawPath: string = request.originalUrl || request.url || '/';
    const path = rawPath.split('?')[0];

    // Never touch platform admin surface, public careers page or static files.
    // ('/' matches the health endpoint exactly — a prefix match would match all paths.)
    const isPublic =
      path === '/' ||
      PUBLIC_PREFIXES.some((p) => p !== '/' && path.startsWith(p));
    if (isPublic) {
      return true;
    }

    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) return true; // AuthGuard enforces auth

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      return true; // invalid token -> AuthGuard will reject properly
    }

    if (payload?.isPlatform) return true;
    const companyId = payload?.companyId;
    if (!companyId) return true;

    const state = await this.resolveState(companyId);

    if (state.allowed) return true;

    // Locked accounts may still reach billing & basic self-service
    const allowedWhileLocked = ALWAYS_ALLOWED_PREFIXES.some(
      (p) => path === p || path.startsWith(p),
    );
    if (allowedWhileLocked) return true;

    if (state.reason === 'SUSPENDED') {
      throw new ForbiddenException(
        'This organization has been suspended. Contact platform support.',
      );
    }
    if (state.reason === 'UNVERIFIED') {
      throw new ForbiddenException(
        'This organization has not completed verification yet. Check your admin email inbox.',
      );
    }

    // PAST_DUE / EXPIRED / CANCELLED
    throw new HttpException(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: 'PAYMENT_REQUIRED',
        message:
          state.freemiumMessage ||
          'Your subscription payment is overdue. Complete the pending invoice to restore full workspace access.',
        invoice: state.invoice
          ? {
              id: state.invoice.id,
              invoiceNumber: state.invoice.invoiceNumber,
              amountDue: state.invoice.amountDue,
              dueDate: state.invoice.dueDate,
            }
          : null,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }

  private async resolveState(companyId: string): Promise<CompanyAccessState> {
    const cached = this.stateCache.get(companyId);
    if (cached && Date.now() - cached.at < this.CACHE_TTL_MS) return cached.state;

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, status: true },
    });
    if (!company) return { allowed: true }; // AuthGuard would have failed earlier
    if (company.status === 'SUSPENDED') {
      return this.cache(companyId, { allowed: false, reason: 'SUSPENDED' });
    }
    if (company.status === 'PENDING_VERIFICATION') {
      return this.cache(companyId, { allowed: false, reason: 'UNVERIFIED' });
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: { select: { code: true } } },
    });
    if (!subscription) return { allowed: true }; // legacy safety; backfill cron handles

    const now = new Date();

    // Freemium accounts whose free period has ended are locked immediately
    // (lazy check — the cron transition also flips status to EXPIRED).
    if (
      subscription.plan?.code === 'PLAN_FREE' &&
      (subscription as any).freemiumEndsAt &&
      new Date((subscription as any).freemiumEndsAt) < now
    ) {
      const config = await this.settings.getConfig();
      return this.cache(companyId, {
        allowed: false,
        reason: 'INACTIVE',
        freemiumMessage: `Your ${config.freemiumMonths}-month free period ended on ${new Date((subscription as any).freemiumEndsAt).toDateString()}. Upgrade to the paid annual plan (${config.currency} ${config.pricePerUserPerMonth}/user/month, billed annually) to restore full access.`,
      });
    }

    if (subscription.status === 'ACTIVE') {
      return this.cache(companyId, { allowed: true });
    }

    // PAST_DUE: honour grace window from SystemConfig
    if (subscription.status === 'PAST_DUE') {
      const unpaid = await this.prisma.invoice.findFirst({
        where: { companyId, status: { in: ['ISSUED', 'DRAFT'] } },
        orderBy: { dueDate: 'desc' },
      });
      const config = await this.settings.getConfig();
      if (unpaid) {
        const deadline = new Date(unpaid.dueDate);
        deadline.setDate(deadline.getDate() + config.gracePeriodDays);
        if (now < deadline) {
          return this.cache(companyId, { allowed: true });
        }
        return this.cache(companyId, {
          allowed: false,
          reason: 'PAST_DUE',
          invoice: {
            id: unpaid.id,
            amountDue: Number(unpaid.amountDue),
            dueDate: unpaid.dueDate,
            invoiceNumber: unpaid.invoiceNumber,
          },
        });
      }
      // No invoice to settle — do not lock the tenant
      return this.cache(companyId, { allowed: true });
    }

    // EXPIRED / CANCELLED
    return this.cache(companyId, { allowed: false, reason: 'INACTIVE' });
  }

  private cache(companyId: string, state: CompanyAccessState): CompanyAccessState {
    this.stateCache.set(companyId, { state, at: Date.now() });
    return state;
  }

  invalidate(companyId?: string) {
    if (companyId) this.stateCache.delete(companyId);
    else this.stateCache.clear();
  }
}

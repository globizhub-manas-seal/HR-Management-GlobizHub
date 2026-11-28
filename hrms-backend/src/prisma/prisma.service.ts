import '../load-env';
import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

/**
 * Right-sized connection pool (memory + Postgres max_connections safety).
 *
 * The pg driver defaults to max=10 clients per process, each preallocating
 * buffers. Multiple replicas x 10 connections quickly exhausts Postgres
 * (default max_connections=100) and inflates RSS. Tune via DB_POOL_MAX.
 */
const poolConfig = {
  connectionString: process.env.DATABASE_URL!,
  max: Number(process.env.DB_POOL_MAX ?? 10),
  idleTimeoutMillis: 30_000, // close idle sockets after 30s (frees memory)
  connectionTimeoutMillis: 5_000, // fail fast instead of queueing forever
  statement_timeout: 30_000, // never let a query pin a connection forever
  keepAlive: true, // avoid stale sockets behind NAT / load balancers
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg(poolConfig),
      // 'minimal' skips full query-param serialization in error paths
      errorFormat: 'minimal',
      transactionOptions: { maxWait: 5_000, timeout: 15_000 },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  /**
   * enableShutdownHooks() in main.ts triggers this on SIGTERM/SIGINT so the
   * pool's sockets are released immediately instead of leaking until the
   * process is force-killed.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

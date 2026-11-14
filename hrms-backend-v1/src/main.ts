import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Initialize Sentry conditionally
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [nodeProfilingIntegration()],
      // S-16: lower sampling in production — 100% is fine for dev/staging only
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  }

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      // S-13: Use exact string comparison only — no wildcard regex conversion.
      // Listing "https://*.vercel.app" would previously allow every Vercel tenant.
      // Allowed origins must be explicit, comma-separated in FRONTEND_ORIGIN.
      const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

      const isProduction = process.env.NODE_ENV === 'production';
      // In development, automatically allow localhost and 127.0.0.1 on any port
      const isLocalhost =
        !isProduction &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isLocalhost || configuredOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new Error(`Not allowed by CORS: Origin ${origin} is not authorized`),
        );
      }
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 5000);
}
void bootstrap();

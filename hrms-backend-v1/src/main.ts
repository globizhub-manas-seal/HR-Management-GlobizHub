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
      // Tracing
      tracesSampleRate: 1.0, //  Capture 100% of the transactions
      // Set sampling rate for profiling - this is relative to tracesSampleRate
      profilesSampleRate: 1.0,
    });
  }

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = process.env.FRONTEND_ORIGIN?.split(',') ?? [];
      const isAllowed =
        allowedOrigins.some((allowed) => {
          const pattern = allowed
            .trim()
            .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&') // escape regex chars
            .replace(/\*/g, '.*'); // turn wildcard * into .*
          return new RegExp(`^${pattern}$`).test(origin);
        }) || allowedOrigins.length === 0;

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 5000);
}
void bootstrap();

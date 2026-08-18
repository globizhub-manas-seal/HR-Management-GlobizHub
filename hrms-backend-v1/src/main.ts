import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = process.env.FRONTEND_ORIGIN?.split(',') ?? [];
      const isAllowed = allowedOrigins.some(allowed => {
        const pattern = allowed.trim()
          .replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&') // escape regex chars
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

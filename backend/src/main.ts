import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config as loadEnvFile } from 'dotenv';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

loadEnvFile();

// 5173 is where start.sh publishes the SPA; 3001 is where `next dev` lands
// when the API already holds 3000. Both are local-only defaults.
const DEFAULT_ORIGINS = 'http://localhost:5173,http://localhost:3001';

/**
 * CORS_ORIGIN accepts a comma-separated list, because the same API is usually
 * reached from more than one origin: the local dev server, the deployed SPA,
 * and Vercel's per-branch preview URLs. `*` allows any origin.
 */
function parseAllowedOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? DEFAULT_ORIGINS)
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const allowedOrigins = parseAllowedOrigins();
  const allowAny = allowedOrigins.includes('*');

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      // No Origin header: curl, server-to-server, same-origin navigations.
      if (!origin || allowAny || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      // Without this the misconfiguration is invisible on the server and shows
      // up in the browser only as an opaque "Failed to fetch".
      logger.warn(
        `Blocked a cross-origin request from "${origin}". ` +
          `CORS_ORIGIN currently allows: ${allowedOrigins.join(', ')}`,
      );
      return callback(null, false);
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  logger.log(`Notes API listening on http://localhost:${port}/api`);
  logger.log(
    allowAny
      ? 'CORS: every origin is allowed (CORS_ORIGIN=*)'
      : `CORS: allowing ${allowedOrigins.join(', ')}`,
  );
}

void bootstrap();

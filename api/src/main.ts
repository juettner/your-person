import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind a hosting proxy (Fly, Render, a load balancer) the client IP arrives in
  // X-Forwarded-For. Trusting the first hop keeps rate limiting per real client.
  app.set('trust proxy', 1);

  // Every route lives under /api so a web host can serve the app and API from one origin.
  app.setGlobalPrefix('api');

  // Validate every request body against its DTO class (see profiles/dto).
  //  - whitelist: silently drop properties the DTO doesn't declare
  //  - forbidNonWhitelisted: ...actually, reject them, so typos surface early
  //  - transform: convert the plain JSON into a DTO instance (and query strings to numbers)
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // The Expo web build runs on a different origin during development.
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true });

  // 0.0.0.0 so the process is reachable from outside a container; localhost would not be.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
await bootstrap();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

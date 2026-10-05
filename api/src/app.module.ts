import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AiModule } from './ai/ai.module.js';
import { HealthController } from './health/health.controller.js';
import { PersistenceModule } from './persistence/persistence.module.js';
import { ProfilesModule } from './profiles/profiles.module.js';
import { QuestionsModule } from './questions/questions.module.js';

/**
 * Root module. Spring Boot analogy: the @SpringBootApplication class.
 *
 * ConfigModule.forRoot() loads `.env` into process.env (like application.properties).
 * It must come first so PersistenceModule.forRoot() can read MONGODB_URI.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting: 60 requests per minute per client IP, on every route.
    // Spring analogy: a Bucket4j filter. Cheap insurance for a public API with no auth yet.
    // (forRootAsync so the env var is read when the module initializes, not when this file is imported.)
    ThrottlerModule.forRootAsync({
      useFactory: () => [{ ttl: 60_000, limit: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 60) }],
    }),
    PersistenceModule.forRoot(),
    AiModule.forRoot(),
    ProfilesModule,
    QuestionsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

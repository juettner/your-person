import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    PersistenceModule.forRoot(),
    ProfilesModule,
    QuestionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

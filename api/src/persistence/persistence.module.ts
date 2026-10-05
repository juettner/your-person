import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InMemoryProfileRepository } from '../profiles/in-memory-profile.repository.js';
import { MongoProfileRepository } from '../profiles/mongo/mongo-profile.repository.js';
import { ProfileDocument, ProfileSchema } from '../profiles/mongo/profile.schema.js';
import { ProfileRepository } from '../profiles/profile.repository.js';

export type StorageKind = 'memory' | 'mongo';

/** Injection token for the StorageKind string, so /health can report it. */
export const STORAGE_KIND = 'STORAGE_KIND';

/**
 * Chooses the persistence implementation at startup.
 *
 * Spring Boot analogy: @ConditionalOnProperty("MONGODB_URI"). If the env var
 * is set we wire Mongoose and the Mongo repository; otherwise the in-memory
 * repository. Either way the rest of the app only ever sees `ProfileRepository`.
 *
 * @Global means other modules don't need to import this one to inject
 * ProfileRepository. Use sparingly; it is convenient here because every
 * feature module needs storage.
 */
@Global()
@Module({})
export class PersistenceModule {
  static forRoot(): DynamicModule {
    const uri = process.env.MONGODB_URI;
    const logger = new Logger(PersistenceModule.name);

    if (uri) {
      logger.log('Using MongoDB storage');
      return {
        module: PersistenceModule,
        imports: [
          MongooseModule.forRoot(uri),
          MongooseModule.forFeature([{ name: ProfileDocument.name, schema: ProfileSchema }]),
        ],
        providers: [
          { provide: ProfileRepository, useClass: MongoProfileRepository },
          { provide: STORAGE_KIND, useValue: 'mongo' satisfies StorageKind },
        ],
        exports: [ProfileRepository, STORAGE_KIND],
      };
    }

    logger.warn('MONGODB_URI not set: using in-memory storage (data is lost on restart)');
    return {
      module: PersistenceModule,
      providers: [
        { provide: ProfileRepository, useClass: InMemoryProfileRepository },
        { provide: STORAGE_KIND, useValue: 'memory' satisfies StorageKind },
      ],
      exports: [ProfileRepository, STORAGE_KIND],
    };
  }
}

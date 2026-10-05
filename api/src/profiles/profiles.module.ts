import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';

/**
 * Spring Boot analogy: a package with its own @Configuration. Nest modules
 * declare what they provide and what they export to other modules.
 * ProfileRepository is provided by the global PersistenceModule.
 */
@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}

import type { PartnerProfile } from './profile.model.js';

/**
 * Port for profile persistence.
 *
 * Spring Boot analogy: a repository interface. NestJS can't inject against a
 * TypeScript `interface` (interfaces vanish at runtime), so the convention is
 * to declare an abstract class and use it as the injection token:
 *
 *   providers: [{ provide: ProfileRepository, useClass: InMemoryProfileRepository }]
 *
 * See persistence/persistence.module.ts for how the implementation is chosen.
 */
export abstract class ProfileRepository {
  abstract findById(id: string): Promise<PartnerProfile | null>;
  abstract save(profile: PartnerProfile): Promise<PartnerProfile>;
}

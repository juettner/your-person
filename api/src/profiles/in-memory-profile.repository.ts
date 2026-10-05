import { Injectable } from '@nestjs/common';
import type { PartnerProfile } from './profile.model.js';
import { ProfileRepository } from './profile.repository.js';

/**
 * Keeps profiles in a Map. Used for local development and automated tests so
 * nothing external (no Mongo, no Docker) is needed to run the API.
 *
 * Data disappears on restart. That is the point.
 */
@Injectable()
export class InMemoryProfileRepository extends ProfileRepository {
  private readonly store = new Map<string, PartnerProfile>();

  async findById(id: string): Promise<PartnerProfile | null> {
    const found = this.store.get(id);
    // Clone on the way out so callers can't mutate our stored copy by accident.
    return found ? structuredClone(found) : null;
  }

  async save(profile: PartnerProfile): Promise<PartnerProfile> {
    this.store.set(profile.id, structuredClone(profile));
    return structuredClone(profile);
  }
}

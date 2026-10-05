import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateProfileDto } from './dto/create-profile.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import { InterestDetails, PartnerProfile, ProfileResponse, toProfileResponse } from './profile.model.js';
import { ProfileRepository } from './profile.repository.js';

/**
 * Spring Boot analogy: a @Service. Holds the use cases; the controller stays thin.
 */
@Injectable()
export class ProfilesService {
  constructor(private readonly profiles: ProfileRepository) {}

  async create(dto: CreateProfileDto): Promise<ProfileResponse> {
    const now = new Date();
    const interests = dedupe(dto.interests);
    const profile: PartnerProfile = {
      id: randomUUID(),
      name: dto.name.trim(),
      interests,
      interestDetails: cleanDetails(dto.interestDetails ?? {}, interests),
      currentFocus: blankToUndefined(dto.currentFocus),
      notes: blankToUndefined(dto.notes),
      feedback: [],
      recentlyShown: [],
      createdAt: now,
      updatedAt: now,
    };
    return toProfileResponse(await this.profiles.save(profile));
  }

  async get(id: string): Promise<ProfileResponse> {
    return toProfileResponse(await this.load(id));
  }

  async update(id: string, dto: UpdateProfileDto): Promise<ProfileResponse> {
    const profile = await this.load(id);
    if (dto.name !== undefined) profile.name = dto.name.trim();
    if (dto.interests !== undefined) profile.interests = dedupe(dto.interests);
    if (dto.interestDetails !== undefined) profile.interestDetails = dto.interestDetails;
    // Details only make sense for interests that are still selected, so re-clean
    // whenever either side changed.
    if (dto.interests !== undefined || dto.interestDetails !== undefined) {
      profile.interestDetails = cleanDetails(profile.interestDetails, profile.interests);
    }
    if (dto.currentFocus !== undefined) profile.currentFocus = blankToUndefined(dto.currentFocus);
    if (dto.notes !== undefined) profile.notes = blankToUndefined(dto.notes);
    profile.updatedAt = new Date();
    return toProfileResponse(await this.profiles.save(profile));
  }

  /** Internal: full aggregate for other services (questions). Throws 404 if missing. */
  async load(id: string): Promise<PartnerProfile> {
    const profile = await this.profiles.findById(id);
    if (!profile) throw new NotFoundException(`Profile ${id} not found`);
    return profile;
  }
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

function blankToUndefined(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Keeps only details for selected interests, trims strings, and drops blanks,
 * so a half-finished questionnaire never leaves empty answers behind.
 */
export function cleanDetails(details: InterestDetails, interests: string[]): InterestDetails {
  const out: InterestDetails = {};
  for (const interestId of interests) {
    const answers = details[interestId];
    if (!answers) continue;
    const cleaned: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(answers)) {
      if (Array.isArray(value)) {
        const items = dedupe(value.map((v) => v.trim()).filter(Boolean));
        if (items.length) cleaned[key] = items;
      } else {
        const trimmed = value.trim();
        if (trimmed) cleaned[key] = trimmed;
      }
    }
    if (Object.keys(cleaned).length) out[interestId] = cleaned;
  }
  return out;
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { GenerationScheduler } from '../ai/generation-scheduler.service.js';
import type { CreateProfileDto } from './dto/create-profile.dto.js';
import type { ImportantDateDto } from './dto/important-date.dto.js';
import type { LocationDto } from './dto/location.dto.js';
import type { CreateMemoryDto } from './dto/memory.dto.js';
import { findQuestion } from '../questions/question-bank.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import {
  EMPTY_GENERATED,
  ImportantDate,
  InterestDetails,
  Memory,
  PartnerProfile,
  ProfileLocation,
  ProfileResponse,
  toProfileResponse,
} from './profile.model.js';
import { ProfileRepository } from './profile.repository.js';

/**
 * Spring Boot analogy: a @Service. Holds the use cases; the controller stays thin.
 */
@Injectable()
export class ProfilesService {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly scheduler: GenerationScheduler,
  ) {}

  async create(dto: CreateProfileDto): Promise<ProfileResponse> {
    const now = new Date();
    const interests = dedupe(dto.interests);
    const profile: PartnerProfile = {
      id: randomUUID(),
      name: dto.name.trim(),
      interests,
      interestDetails: cleanDetails(dto.interestDetails ?? {}, interests),
      location: cleanLocation(dto.location),
      currentFocus: blankToUndefined(dto.currentFocus),
      notes: blankToUndefined(dto.notes),
      feedback: [],
      recentlyShown: [],
      generated: { ...EMPTY_GENERATED },
      memories: [],
      dates: cleanDates(dto.dates ?? []),
      detailsUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const saved = await this.profiles.save(profile);
    // Start writing AI questions right away so the first batch can include them.
    this.scheduler.refreshInBackground(saved.id);
    return toProfileResponse(saved);
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
      profile.detailsUpdatedAt = new Date();
    }
    if (dto.dates !== undefined) profile.dates = cleanDates(dto.dates);
    if (dto.location !== undefined) profile.location = cleanLocation(dto.location);
    if (dto.currentFocus !== undefined) profile.currentFocus = blankToUndefined(dto.currentFocus);
    if (dto.notes !== undefined) profile.notes = blankToUndefined(dto.notes);
    profile.updatedAt = new Date();
    const saved = await this.profiles.save(profile);
    // The inputs may have changed; the scheduler decides whether the AI deck is stale.
    if (this.scheduler.isStale(saved)) this.scheduler.refreshInBackground(saved.id);
    return toProfileResponse(saved);
  }

  /** Write down something your person said. */
  async addMemory(id: string, dto: CreateMemoryDto): Promise<Memory> {
    const profile = await this.load(id);
    const questionText = dto.questionId
      ? (findQuestion(dto.questionId)?.text ?? profile.generated.questions.find((q) => q.id === dto.questionId)?.text)
      : undefined;
    const memory: Memory = {
      id: randomUUID(),
      questionId: dto.questionId,
      questionText,
      text: dto.text.trim(),
      createdAt: new Date(),
    };
    profile.memories = [...profile.memories, memory].slice(-500);
    profile.updatedAt = new Date();
    await this.profiles.save(profile);
    return memory;
  }

  async listMemories(id: string): Promise<Memory[]> {
    const profile = await this.load(id);
    return [...profile.memories].reverse(); // newest first
  }

  async deleteMemory(id: string, memoryId: string): Promise<void> {
    const profile = await this.load(id);
    if (!profile.memories.some((m) => m.id === memoryId)) throw new NotFoundException(`Memory ${memoryId} not found`);
    profile.memories = profile.memories.filter((m) => m.id !== memoryId);
    await this.profiles.save(profile);
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

function cleanLocation(location: LocationDto | null | undefined): ProfileLocation | undefined {
  if (!location) return undefined;
  const city = location.city.trim();
  if (!city) return undefined;
  return {
    city,
    region: blankToUndefined(location.region),
    country: blankToUndefined(location.country),
  };
}

function cleanDates(dates: ImportantDateDto[]): ImportantDate[] {
  const seen = new Set<string>();
  const out: ImportantDate[] = [];
  for (const d of dates) {
    const label = d.label.trim();
    if (!label) continue;
    const id = `date-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${d.month}-${d.day}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label, month: d.month, day: d.day });
  }
  return out;
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

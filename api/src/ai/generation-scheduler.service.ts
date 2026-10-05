import { Inject, Injectable, Logger } from '@nestjs/common';
import { PartnerProfile } from '../profiles/profile.model.js';
import { ProfileRepository } from '../profiles/profile.repository.js';
import { AI_CONFIG, type AiConfig } from './ai.config.js';
import { QuestionGeneratorService } from './question-generator.service.js';

/** Below this many unhidden AI questions, the deck is refreshed. */
const MIN_FRESH_QUESTIONS = 3;

/**
 * Decides WHEN to (re)generate a profile's AI deck and runs it without
 * blocking the request that noticed. One refresh per profile at a time.
 *
 * Spring analogy: an @Async method guarded by a per-key lock. In a multi-
 * instance deployment this would move to a queue; for now the in-process
 * Set is enough.
 */
@Injectable()
export class GenerationScheduler {
  private readonly logger = new Logger(GenerationScheduler.name);
  private readonly inFlight = new Set<string>();

  constructor(
    private readonly generator: QuestionGeneratorService,
    private readonly profiles: ProfileRepository,
    @Inject(AI_CONFIG) private readonly config: AiConfig,
  ) {}

  get enabled(): boolean {
    return this.generator.enabled;
  }

  isStale(profile: PartnerProfile): boolean {
    if (!this.enabled) return false;
    const set = profile.generated;
    if (!set.generatedAt) return true;
    if (set.basis !== this.generator.basisFor(profile)) return true;
    const ageDays = (Date.now() - new Date(set.generatedAt).getTime()) / 86_400_000;
    if (ageDays > this.config.maxAgeDays) return true;
    const hidden = new Set(profile.feedback.filter((f) => f.score === -1).map((f) => f.questionId));
    const fresh = set.questions.filter((q) => !hidden.has(q.id)).length;
    return fresh < MIN_FRESH_QUESTIONS;
  }

  /** Fire-and-forget. Safe to call often; duplicates are dropped. */
  refreshInBackground(profileId: string): void {
    if (!this.enabled || this.inFlight.has(profileId)) return;
    this.inFlight.add(profileId);
    this.refresh(profileId)
      .then((n) => this.logger.log(`Wrote ${n} AI questions for ${profileId}`))
      .catch((err) => this.logger.error(`AI refresh failed for ${profileId}: ${(err as Error).message}`))
      .finally(() => this.inFlight.delete(profileId));
  }

  /** Generate now and wait. Returns how many questions were written. */
  async refresh(profileId: string): Promise<number> {
    if (!this.enabled) return 0;
    const profile = await this.profiles.findById(profileId);
    if (!profile) return 0;

    const questions = await this.generator.generate(profile, this.config.batchSize);

    // Reload before saving: the user may have edited the profile while we waited.
    const latest = (await this.profiles.findById(profileId)) ?? profile;
    latest.generated = {
      questions,
      generatedAt: new Date(),
      basis: this.generator.basisFor(latest),
    };
    await this.profiles.save(latest);
    return questions.length;
  }
}

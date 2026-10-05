import { Injectable, NotFoundException } from '@nestjs/common';
import { GenerationScheduler } from '../ai/generation-scheduler.service.js';
import { ProfileRepository } from '../profiles/profile.repository.js';
import { ProfilesService } from '../profiles/profiles.service.js';
import { InterestDetails, PartnerProfile, RECENTLY_SHOWN_LIMIT, Score } from '../profiles/profile.model.js';
import { GENERAL_TAG, interestLabel } from './interests.js';
import { findQuestion, Question } from './question-bank.js';
import { QuestionSelectorService } from './question-selector.service.js';
import { renderTemplate } from './question-template.js';

/** One prompt as the app displays it. */
export interface PromptResponse {
  id: string;
  /** Fully rendered: placeholders like {sports.team} are already filled in. */
  text: string;
  /** Human label of the matched interest, or null for a general question. */
  interest: string | null;
  /** Where it came from: the hand-written bank, or the AI engine for this profile. */
  source: 'curated' | 'ai';
}

export interface PromptsResponse {
  /** "Ask <name>" */
  askName: string;
  questions: PromptResponse[];
}

export interface RatingResponse {
  questionId: string;
  score: Score;
  /** True when this rating hides the question from future batches. */
  hidden: boolean;
}

export interface GenerateResponse {
  enabled: boolean;
  generated: number;
}

@Injectable()
export class QuestionsService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly profiles: ProfileRepository,
    private readonly selector: QuestionSelectorService,
    private readonly scheduler: GenerationScheduler,
  ) {}

  async getPrompts(profileId: string, count: number): Promise<PromptsResponse> {
    const profile = await this.profilesService.load(profileId);

    const hidden = new Set(profile.feedback.filter((f) => f.score === -1).map((f) => f.questionId));
    const liked = new Set(profile.feedback.filter((f) => f.score === 1).map((f) => f.questionId));
    const details = templateContext(profile);

    const chosen = this.selector.select({
      interests: profile.interests,
      details,
      extra: aiQuestions(profile),
      hidden,
      liked,
      recentlyShown: profile.recentlyShown,
      count,
    });

    // Remember what we showed so the next batch feels new. Oldest entries fall off.
    const shownIds = chosen.map((q) => q.id);
    profile.recentlyShown = [
      ...profile.recentlyShown.filter((id) => !shownIds.includes(id)),
      ...shownIds,
    ].slice(-RECENTLY_SHOWN_LIMIT);
    await this.profiles.save(profile);

    // Top up the AI deck in the background when it is empty, old, or mostly hidden.
    if (this.scheduler.isStale(profile)) this.scheduler.refreshInBackground(profile.id);

    return {
      askName: profile.name,
      questions: chosen.map((q) => toPrompt(q, profile.interests, details)),
    };
  }

  async rate(profileId: string, questionId: string, score: Score): Promise<RatingResponse> {
    const profile = await this.profilesService.load(profileId);
    const known = findQuestion(questionId) ?? profile.generated.questions.find((q) => q.id === questionId);
    if (!known) throw new NotFoundException(`Question ${questionId} not found`);

    // Upsert: a person can change their mind, so the latest rating replaces the old one.
    profile.feedback = [
      ...profile.feedback.filter((f) => f.questionId !== questionId),
      { questionId, score, ratedAt: new Date() },
    ];
    profile.updatedAt = new Date();
    await this.profiles.save(profile);

    return { questionId, score, hidden: score === -1 };
  }

  /** Explicit refresh of the AI deck; waits for it. */
  async generate(profileId: string): Promise<GenerateResponse> {
    await this.profilesService.load(profileId); // 404 if missing
    if (!this.scheduler.enabled) return { enabled: false, generated: 0 };
    const generated = await this.scheduler.refresh(profileId);
    return { enabled: true, generated };
  }
}

/** Follow-up answers plus a `profile` pseudo-interest so templates can say {profile.city}. */
function templateContext(profile: PartnerProfile): InterestDetails {
  return {
    ...profile.interestDetails,
    profile: { city: profile.location?.city ?? '' },
  };
}

function aiQuestions(profile: PartnerProfile): Question[] {
  return profile.generated.questions.map((q) => ({ id: q.id, text: q.text, tags: q.tags, source: 'ai' as const }));
}

function toPrompt(question: Question, interests: readonly string[], details: InterestDetails): PromptResponse {
  const matched = question.tags.find((t) => t !== GENERAL_TAG && interests.includes(t));
  return {
    id: question.id,
    text: question.source === 'ai' ? question.text : renderTemplate(question.text, details),
    interest: matched ? (interestLabel(matched) ?? null) : null,
    source: question.source ?? 'curated',
  };
}

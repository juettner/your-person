import { Injectable, NotFoundException } from '@nestjs/common';
import { GenerationScheduler } from '../ai/generation-scheduler.service.js';
import { ProfileRepository } from '../profiles/profile.repository.js';
import { ProfilesService } from '../profiles/profiles.service.js';
import { ImportantDate, InterestDetails, PartnerProfile, RECENTLY_SHOWN_LIMIT, Score } from '../profiles/profile.model.js';
import { GENERAL_TAG, interestLabel } from './interests.js';
import { findQuestion, Question, QuestionKind } from './question-bank.js';
import { QuestionSelectorService, SelectionMode } from './question-selector.service.js';
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
  /** question (ask), appreciation (say), bid (do today), dream (deeper), stress (evening, listen). */
  kind: QuestionKind;
}

export interface PromptsResponse {
  /** "Ask <name>" */
  askName: string;
  mode: SelectionMode;
  questions: PromptResponse[];
  nudges: {
    /** True when interests and follow-ups have not been touched for a month: "still true?" */
    reviewDetails: boolean;
    /** Dates within the next three weeks, so the app can show them. */
    upcomingDates: { label: string; month: number; day: number; daysAway: number }[];
  };
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

  async getPrompts(profileId: string, count: number, mode: SelectionMode = 'day', now = new Date()): Promise<PromptsResponse> {
    const profile = await this.profilesService.load(profileId);
    const upcoming = upcomingDates(profile.dates, now);

    const hidden = new Set(profile.feedback.filter((f) => f.score === -1).map((f) => f.questionId));
    const liked = new Set(profile.feedback.filter((f) => f.score === 1).map((f) => f.questionId));
    const details = templateContext(profile);

    const chosen = this.selector.select({
      interests: profile.interests,
      details,
      extra: [...aiQuestions(profile), ...(mode === 'day' ? dateQuestions(upcoming) : [])],
      hidden,
      liked,
      recentlyShown: profile.recentlyShown,
      count,
      mode,
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

    const detailAgeDays = (now.getTime() - new Date(profile.detailsUpdatedAt).getTime()) / 86_400_000;

    return {
      askName: profile.name,
      mode,
      questions: chosen.map((q) => toPrompt(q, profile.interests, details)),
      nudges: {
        reviewDetails: detailAgeDays > REVIEW_DETAILS_AFTER_DAYS,
        upcomingDates: upcoming.map(({ date, daysAway }) => ({ label: date.label, month: date.month, day: date.day, daysAway })),
      },
    };
  }

  async rate(profileId: string, questionId: string, score: Score): Promise<RatingResponse> {
    const profile = await this.profilesService.load(profileId);
    const known =
      findQuestion(questionId) ??
      profile.generated.questions.find((q) => q.id === questionId) ??
      profile.dates.find((d) => d.id === questionId);
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

const REVIEW_DETAILS_AFTER_DAYS = 30;
const DATE_HORIZON_DAYS = 21;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Dates coming up within the horizon, with how many days away they are. */
export function upcomingDates(dates: readonly ImportantDate[], now: Date): { date: ImportantDate; daysAway: number }[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return dates
    .map((date) => {
      let next = Date.UTC(now.getUTCFullYear(), date.month - 1, date.day);
      if (next < today) next = Date.UTC(now.getUTCFullYear() + 1, date.month - 1, date.day);
      return { date, daysAway: Math.round((next - today) / 86_400_000) };
    })
    .filter((d) => d.daysAway <= DATE_HORIZON_DAYS)
    .sort((a, b) => a.daysAway - b.daysAway);
}

/** One synthesized question per upcoming date; its id is the date's id so it can be rated and hidden. */
function dateQuestions(upcoming: { date: ImportantDate; daysAway: number }[]): Question[] {
  return upcoming.map(({ date, daysAway }) => {
    const when = daysAway === 0 ? 'today' : daysAway === 1 ? 'tomorrow' : `on ${MONTHS[date.month - 1]} ${date.day}`;
    return {
      id: date.id,
      text: `${date.label} is ${when}. What would make it feel special?`,
      tags: [GENERAL_TAG],
      personal: true,
      kind: 'question',
    };
  });
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
    kind: question.kind ?? 'question',
  };
}

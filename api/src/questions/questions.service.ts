import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileRepository } from '../profiles/profile.repository.js';
import { ProfilesService } from '../profiles/profiles.service.js';
import { InterestDetails, RECENTLY_SHOWN_LIMIT, Score } from '../profiles/profile.model.js';
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

@Injectable()
export class QuestionsService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly profiles: ProfileRepository,
    private readonly selector: QuestionSelectorService,
  ) {}

  async getPrompts(profileId: string, count: number): Promise<PromptsResponse> {
    const profile = await this.profilesService.load(profileId);

    const hidden = new Set(profile.feedback.filter((f) => f.score === -1).map((f) => f.questionId));
    const liked = new Set(profile.feedback.filter((f) => f.score === 1).map((f) => f.questionId));

    const chosen = this.selector.select({
      interests: profile.interests,
      details: profile.interestDetails,
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

    return {
      askName: profile.name,
      questions: chosen.map((q) => toPrompt(q, profile.interests, profile.interestDetails)),
    };
  }

  async rate(profileId: string, questionId: string, score: Score): Promise<RatingResponse> {
    if (!findQuestion(questionId)) {
      throw new NotFoundException(`Question ${questionId} not found`);
    }
    const profile = await this.profilesService.load(profileId);

    // Upsert: a person can change their mind, so the latest rating replaces the old one.
    profile.feedback = [
      ...profile.feedback.filter((f) => f.questionId !== questionId),
      { questionId, score, ratedAt: new Date() },
    ];
    profile.updatedAt = new Date();
    await this.profiles.save(profile);

    return { questionId, score, hidden: score === -1 };
  }
}

function toPrompt(question: Question, interests: readonly string[], details: InterestDetails): PromptResponse {
  const matched = question.tags.find((t) => t !== GENERAL_TAG && interests.includes(t));
  return {
    id: question.id,
    text: renderTemplate(question.text, details),
    interest: matched ? (interestLabel(matched) ?? null) : null,
  };
}

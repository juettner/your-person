import { Inject, Injectable } from '@nestjs/common';
import { GENERAL_TAG } from './interests.js';
import type { Question } from './question-bank.js';

/**
 * Injection token for the question list. Letting the bank be injected (rather
 * than imported directly) is what will allow an LLM-backed or database-backed
 * source to be swapped in later without touching the selection logic.
 */
export const QUESTION_SOURCE = 'QUESTION_SOURCE';

/** Everything the selector needs to know about a profile, and nothing more. */
export interface SelectionInput {
  interests: readonly string[];
  /** Question ids the user rated -1. Never shown again. */
  hidden: ReadonlySet<string>;
  /** Question ids the user rated +1. Slightly favoured. */
  liked: ReadonlySet<string>;
  /** Question ids shown recently, oldest first. Avoided while fresh ones exist. */
  recentlyShown: readonly string[];
  count: number;
}

/** A function returning a float in [0, 1). Injected so tests are deterministic. */
export type Rng = () => number;

const WEIGHT_INTEREST_MATCH = 3;
const WEIGHT_GENERAL = 1;
const WEIGHT_LIKED_BONUS = 1;

/**
 * Picks which questions to show. Pure logic, no I/O, so it is cheap to unit test.
 *
 * Rules, in order:
 *  1. Hidden questions are out, full stop.
 *  2. Candidates are questions tagged `general` or matching an interest.
 *  3. Prefer questions not shown recently. Fall back to the longest-ago ones
 *     only when there aren't enough fresh candidates.
 *  4. Interest-matched questions outweigh general ones; liked ones get a bump.
 *  5. Avoid two questions about the same interest in one batch when possible.
 */
@Injectable()
export class QuestionSelectorService {
  constructor(@Inject(QUESTION_SOURCE) private readonly bank: readonly Question[]) {}

  select(input: SelectionInput, rng: Rng = Math.random): Question[] {
    const interests = new Set(input.interests);
    const matchesProfile = (q: Question) =>
      q.tags.includes(GENERAL_TAG) || q.tags.some((t) => interests.has(t));

    const candidates = this.bank.filter((q) => !input.hidden.has(q.id) && matchesProfile(q));

    const recentIndex = new Map(input.recentlyShown.map((id, i) => [id, i]));
    const fresh = candidates.filter((q) => !recentIndex.has(q.id));

    // Not enough fresh questions? Top up with the ones shown longest ago.
    let pool = fresh;
    if (fresh.length < input.count) {
      const stale = candidates
        .filter((q) => recentIndex.has(q.id))
        .sort((a, b) => recentIndex.get(a.id)! - recentIndex.get(b.id)!);
      pool = [...fresh, ...stale];
    }

    const weightOf = (q: Question) => {
      const matched = q.tags.some((t) => interests.has(t));
      let w = matched ? WEIGHT_INTEREST_MATCH : WEIGHT_GENERAL;
      if (input.liked.has(q.id)) w += WEIGHT_LIKED_BONUS;
      return w;
    };

    const picked: Question[] = [];
    const usedTags = new Set<string>();
    let remaining = [...pool];

    while (picked.length < input.count && remaining.length > 0) {
      // Rule 5: try to keep variety by skipping tags already picked this batch.
      const varied = remaining.filter((q) => !q.tags.some((t) => t !== GENERAL_TAG && usedTags.has(t)));
      const choices = varied.length > 0 ? varied : remaining;

      const chosen = weightedPick(choices, weightOf, rng);
      picked.push(chosen);
      chosen.tags.forEach((t) => usedTags.add(t));
      remaining = remaining.filter((q) => q.id !== chosen.id);
    }

    return picked;
  }
}

/** Roulette-wheel selection: probability proportional to weight. */
function weightedPick(items: Question[], weightOf: (q: Question) => number, rng: Rng): Question {
  const total = items.reduce((sum, q) => sum + weightOf(q), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= weightOf(item);
    if (roll < 0) return item;
  }
  // Floating point can leave a hair of weight unspent; fall back to the last item.
  return items[items.length - 1];
}

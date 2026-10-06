import { QuestionSelectorService } from './question-selector.service.js';
import { QUESTION_BANK } from './question-bank.js';

/** A deterministic RNG that always returns the same value. */
const fixed = (v: number) => () => v;

function selector() {
  return new QuestionSelectorService(QUESTION_BANK);
}

describe('QuestionSelectorService', () => {
  it('returns the requested number of questions', () => {
    const result = selector().select({
      interests: ['cooking'],
      details: {},
      extra: [],
      hidden: new Set(),
      liked: new Set(),
      recentlyShown: [],
      count: 3,
    });
    expect(result).toHaveLength(3);
  });

  it('never returns hidden questions', () => {
    const hidden = new Set(QUESTION_BANK.filter((q) => q.tags.includes('general')).map((q) => q.id));
    const result = selector().select({
      interests: [],
      details: {},
      extra: [],
      hidden,
      liked: new Set(),
      recentlyShown: [],
      count: 3,
    });
    // Every general question is hidden and there are no interests, so nothing qualifies.
    expect(result).toHaveLength(0);
  });

  it('only returns general questions or ones matching an interest', () => {
    for (let i = 0; i < 50; i++) {
      const result = selector().select({
        interests: ['gaming'],
        details: {},
      extra: [],
      hidden: new Set(),
        liked: new Set(),
        recentlyShown: [],
        count: 3,
      });
      for (const q of result) {
        expect(q.tags.includes('general') || q.tags.includes('gaming')).toBe(true);
      }
    }
  });

  it('prefers fresh questions over recently shown ones', () => {
    // General questions that need no details (city questions are general but require profile.city).
    const general = QUESTION_BANK.filter((q) => q.tags.includes('general') && !q.requires?.length && q.kind !== 'stress').map((q) => q.id);
    const recentlyShown = general.slice(0, general.length - 2);
    const result = selector().select({
      interests: [],
      details: {},
      extra: [],
      hidden: new Set(),
      liked: new Set(),
      recentlyShown,
      count: 2,
    });
    expect(result.map((q) => q.id).sort()).toEqual(general.slice(-2).sort());
  });

  it('falls back to the longest-ago questions when the pool runs dry', () => {
    const general = QUESTION_BANK.filter((q) => q.tags.includes('general') && !q.requires?.length && q.kind !== 'stress').map((q) => q.id);
    // Everything has been shown; oldest first.
    const result = selector().select(
      { interests: [], details: {}, extra: [], hidden: new Set(), liked: new Set(), recentlyShown: general, count: 2 },
      fixed(0),
    );
    expect(result.map((q) => q.id)).toEqual(general.slice(0, 2));
  });

  it('avoids repeating an interest within one batch when it can', () => {
    for (let i = 0; i < 50; i++) {
      const result = selector().select({
        interests: ['reading', 'music'],
        details: {},
      extra: [],
      hidden: new Set(),
        liked: new Set(),
        recentlyShown: [],
        count: 2,
      });
      const specific = result.flatMap((q) => q.tags.filter((t) => t !== 'general'));
      expect(new Set(specific).size).toBe(specific.length);
    }
  });

  it('only offers detail-driven questions when the answers exist', () => {
    const withoutDetails = selector().select({
      interests: ['sports'],
      details: {},
      extra: [],
      hidden: new Set(),
      liked: new Set(),
      recentlyShown: [],
      count: 50,
    });
    expect(withoutDetails.some((q) => q.requires?.length)).toBe(false);

    const withDetails = selector().select({
      interests: ['sports'],
      details: { sports: { team: 'Vikings' } },
      extra: [],
      hidden: new Set(),
      liked: new Set(),
      recentlyShown: [],
      count: 50,
    });
    const ids = withDetails.map((q) => q.id);
    expect(ids).toContain('spo03');
    expect(ids).toContain('spo04');
    expect(ids).not.toContain('spo05'); // needs sports.sport, which is not answered
  });

  it('always offers AI questions for the profile and favours them', () => {
    const extra = [{ id: 'ai-1', text: 'Made for you', tags: ['general'], source: 'ai' as const }];
    const result = selector().select(
      { interests: [], details: {}, extra, hidden: new Set(), liked: new Set(), recentlyShown: [], count: 1 },
      () => 0, // the first (heaviest-first? no: first in weighted order) candidate... see below
    );
    expect(result).toHaveLength(1);

    let aiPicks = 0;
    for (let i = 0; i < 200; i++) {
      const [q] = selector().select({ interests: [], details: {}, extra, hidden: new Set(), liked: new Set(), recentlyShown: [], count: 1 });
      if (q.id === 'ai-1') aiPicks++;
    }
    // 14 general questions at weight 1 vs one AI question at weight 5: ~26% expected.
    expect(aiPicks).toBeGreaterThan(20);

    const hiddenResult = selector().select({ interests: [], details: {}, extra, hidden: new Set(['ai-1']), liked: new Set(), recentlyShown: [], count: 50 });
    expect(hiddenResult.some((q) => q.id === 'ai-1')).toBe(false);
  });
});

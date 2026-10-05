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
    const general = QUESTION_BANK.filter((q) => q.tags.includes('general')).map((q) => q.id);
    const recentlyShown = general.slice(0, general.length - 2);
    const result = selector().select({
      interests: [],
      hidden: new Set(),
      liked: new Set(),
      recentlyShown,
      count: 2,
    });
    expect(result.map((q) => q.id).sort()).toEqual(general.slice(-2).sort());
  });

  it('falls back to the longest-ago questions when the pool runs dry', () => {
    const general = QUESTION_BANK.filter((q) => q.tags.includes('general')).map((q) => q.id);
    // Everything has been shown; oldest first.
    const result = selector().select(
      { interests: [], hidden: new Set(), liked: new Set(), recentlyShown: general, count: 2 },
      fixed(0),
    );
    expect(result.map((q) => q.id)).toEqual(general.slice(0, 2));
  });

  it('avoids repeating an interest within one batch when it can', () => {
    for (let i = 0; i < 50; i++) {
      const result = selector().select({
        interests: ['reading', 'music'],
        hidden: new Set(),
        liked: new Set(),
        recentlyShown: [],
        count: 2,
      });
      const specific = result.flatMap((q) => q.tags.filter((t) => t !== 'general'));
      expect(new Set(specific).size).toBe(specific.length);
    }
  });
});

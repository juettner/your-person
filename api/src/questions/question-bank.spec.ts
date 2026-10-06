import { QUESTION_BANK } from './question-bank.js';

/**
 * Guards two editorial rules of the bank.
 */
describe('question bank', () => {
  it('has unique ids', () => {
    const ids = QUESTION_BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('leans open-ended: most questions start with what, how, when, where, who, which, or why', () => {
    const asks = QUESTION_BANK.filter((q) => (q.kind ?? 'question') === 'question' || q.kind === 'stress' || q.kind === 'dream');
    const open = asks.filter((q) => /^(what|how|when|where|who|which|why|if|tell)\b/i.test(q.text.replace(/^\{[^}]+\}\s*/, '')));
    const ratio = open.length / asks.length;
    // Yes/no openers ("Is there...", "Want to...") are fine as invitations, but should stay the minority.
    expect(ratio, `open-ended ratio ${ratio.toFixed(2)} (${open.length}/${asks.length})`).toBeGreaterThanOrEqual(0.55);
  });

  it('has no negative framing in questions', () => {
    const banned = /\b(dread|worr(y|ied|ies)|annoy|complain|hate|fight|wrong with|bugging)\b/i;
    for (const q of QUESTION_BANK) {
      expect(q.text.replace(/\{[^}]+\}/g, ''), q.id).not.toMatch(banned);
    }
  });
});

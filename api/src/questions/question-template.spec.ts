import { hasRequiredDetails, renderTemplate } from './question-template.js';
import { QUESTION_BANK } from './question-bank.js';
import { findFollowUp } from './interests.js';

describe('question templates', () => {
  const details = {
    sports: { sport: ['Football', 'Hockey'], team: 'Vikings' },
    music: { genre: ['Jazz'] },
  };

  it('fills single-value placeholders', () => {
    expect(renderTemplate('How are the {sports.team} doing?', details)).toBe('How are the Vikings doing?');
  });

  it('picks one item from a list, driven by the rng', () => {
    expect(renderTemplate('Into {sports.sport}?', details, () => 0)).toBe('Into Football?');
    expect(renderTemplate('Into {sports.sport}?', details, () => 0.99)).toBe('Into Hockey?');
  });

  it('lowercases with the |lower modifier', () => {
    expect(renderTemplate('A {music.genre|lower} record', details)).toBe('A jazz record');
  });

  it('reports missing requirements', () => {
    expect(hasRequiredDetails(details, ['sports.team'])).toBe(true);
    expect(hasRequiredDetails(details, ['sports.team', 'music.artist'])).toBe(false);
    expect(hasRequiredDetails({}, undefined)).toBe(true);
    expect(hasRequiredDetails({ sports: { sport: [] } }, ['sports.sport'])).toBe(false);
  });

  it('every placeholder in the bank refers to a real follow-up and is declared in requires', () => {
    const re = /\{([a-z]+)\.([a-zA-Z]+)(\|lower)?\}/g;
    for (const q of QUESTION_BANK) {
      for (const m of q.text.matchAll(re)) {
        const key = `${m[1]}.${m[2]}`;
        expect(findFollowUp(m[1], m[2]), `${q.id}: ${key} is not a follow-up`).toBeDefined();
        expect(q.requires ?? [], `${q.id}: ${key} missing from requires`).toContain(key);
        expect(q.tags, `${q.id}: should be tagged ${m[1]}`).toContain(m[1]);
      }
    }
  });
});

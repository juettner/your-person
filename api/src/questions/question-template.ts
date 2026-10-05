import type { InterestDetails } from '../profiles/profile.model.js';

/**
 * Placeholders in question text refer to follow-up answers:
 *
 *   "How are the {sports.team} looking this year?"
 *   "What's a {music.genre|lower} record you'd put on for me?"
 *
 * `{interest.followUp}` is replaced by the stored answer. For a multi-choice
 * answer (an array) one item is picked at random so repeated showings vary.
 * The `|lower` modifier lowercases the value for mid-sentence use.
 */
const PLACEHOLDER = /\{([a-z]+)\.([a-zA-Z]+)(\|lower)?\}/g;

export type Rng = () => number;

/** True when every `interest.followUp` key in `requires` has a non-empty answer. */
export function hasRequiredDetails(details: InterestDetails, requires: readonly string[] | undefined): boolean {
  if (!requires || requires.length === 0) return true;
  return requires.every((key) => {
    const [interestId, followUpId] = key.split('.');
    const value = details[interestId]?.[followUpId];
    return Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.length > 0;
  });
}

/** Fills placeholders from `details`. Leaves nothing unresolved if `hasRequiredDetails` passed. */
export function renderTemplate(text: string, details: InterestDetails, rng: Rng = Math.random): string {
  return text.replace(PLACEHOLDER, (match, interestId: string, followUpId: string, lower?: string) => {
    const value = details[interestId]?.[followUpId];
    let chosen: string | undefined;
    if (Array.isArray(value)) {
      chosen = value.length ? value[Math.min(value.length - 1, Math.floor(rng() * value.length))] : undefined;
    } else {
      chosen = value;
    }
    if (!chosen) return match; // should not happen for eligible questions; keep visible for debugging
    return lower ? chosen.toLowerCase() : chosen;
  });
}

import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { findFollowUp, findInterest } from '../../questions/interests.js';

export const MAX_DETAIL_LENGTH = 120;
export const MAX_DETAIL_ITEMS = 10;

/**
 * Validates the nested `interestDetails` object:
 *
 *   { "sports": { "sport": ["Football"], "team": "Vikings" }, "music": { "genre": ["Jazz"] } }
 *
 * Every outer key must be a known interest, every inner key a follow-up of
 * that interest, and the value must match the follow-up's shape: an array of
 * strings for a multi-choice, a single string otherwise.
 *
 * class-validator has no built-in for "a map whose shape depends on a lookup",
 * so this is a custom decorator. Spring analogy: a custom ConstraintValidator.
 * Returning a reason string from `check` keeps the 400 response informative.
 */
export function IsInterestDetails(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isInterestDetails',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return check(value) === null;
        },
        defaultMessage(args: ValidationArguments) {
          return `interestDetails: ${check(args.value) ?? 'invalid'}`;
        },
      },
    });
  };
}

/** Returns null when valid, otherwise a human-readable reason. */
export function check(value: unknown): string | null {
  if (!isPlainObject(value)) return 'must be an object';

  for (const [interestId, answers] of Object.entries(value)) {
    const interest = findInterest(interestId);
    if (!interest) return `unknown interest "${interestId}"`;
    if (!isPlainObject(answers)) return `answers for "${interestId}" must be an object`;

    for (const [followUpId, answer] of Object.entries(answers)) {
      const followUp = findFollowUp(interestId, followUpId);
      if (!followUp) return `unknown follow-up "${interestId}.${followUpId}"`;

      if (followUp.kind === 'choice' && followUp.multi) {
        if (!Array.isArray(answer)) return `"${interestId}.${followUpId}" must be a list`;
        if (answer.length > MAX_DETAIL_ITEMS) return `"${interestId}.${followUpId}" has too many items`;
        if (!answer.every(isShortString)) return `"${interestId}.${followUpId}" items must be short strings`;
      } else if (!isShortString(answer)) {
        return `"${interestId}.${followUpId}" must be a string of at most ${MAX_DETAIL_LENGTH} characters`;
      }
    }
  }
  return null;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isShortString(v: unknown): v is string {
  return typeof v === 'string' && v.length <= MAX_DETAIL_LENGTH;
}

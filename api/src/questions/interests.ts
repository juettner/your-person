/**
 * The fixed list of interests a user can pick during the partner questionnaire.
 *
 * Keeping this a closed list (rather than free text) is what lets us match
 * questions to interests reliably. Free-text context lives in
 * `PartnerProfile.currentFocus` instead.
 */
export interface Interest {
  id: string;
  label: string;
}

export const INTERESTS: readonly Interest[] = [
  { id: 'work', label: 'Work & career' },
  { id: 'cooking', label: 'Cooking & food' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'running', label: 'Running' },
  { id: 'reading', label: 'Books & reading' },
  { id: 'movies', label: 'Movies' },
  { id: 'tv', label: 'TV shows' },
  { id: 'music', label: 'Music' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'travel', label: 'Travel' },
  { id: 'outdoors', label: 'The outdoors' },
  { id: 'gardening', label: 'Gardening' },
  { id: 'sports', label: 'Sports' },
  { id: 'kids', label: 'Kids & parenting' },
  { id: 'friends', label: 'Friends' },
  { id: 'family', label: 'Family' },
  { id: 'pets', label: 'Pets' },
  { id: 'art', label: 'Art & making things' },
  { id: 'faith', label: 'Faith & spirituality' },
  { id: 'finance', label: 'Money & planning' },
  { id: 'home', label: 'Home projects' },
  { id: 'learning', label: 'Learning new things' },
];

export const INTEREST_IDS: readonly string[] = INTERESTS.map((i) => i.id);

/** Questions tagged `general` apply to everyone regardless of interests. */
export const GENERAL_TAG = 'general';

export function interestLabel(id: string): string | undefined {
  return INTERESTS.find((i) => i.id === id)?.label;
}

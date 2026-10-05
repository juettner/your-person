/**
 * The interest taxonomy: what a user can pick during the partner questionnaire,
 * and for each interest the follow-up questions that dig one or two levels
 * deeper ("Sports" -> which sport -> which team).
 *
 * This is served to the app by GET /api/interests, so adding or rewording a
 * follow-up here changes the questionnaire without an app release. The answers
 * land in `PartnerProfile.interestDetails` keyed by interest id then follow-up
 * id, and the question bank uses them as placeholders ({sports.team}).
 */

export interface FollowUp {
  /** Stable key for the answer inside interestDetails[interestId]. */
  id: string;
  /** The question the app shows. */
  prompt: string;
  /** `choice` renders chips from `options`; `text` renders a free-text input. */
  kind: 'choice' | 'text';
  options?: readonly string[];
  /** For `choice`: allow several picks (answer is an array). Default single. */
  multi?: boolean;
  /** For `text`: placeholder hint in the input. */
  placeholder?: string;
}

export interface Interest {
  id: string;
  label: string;
  followUps: readonly FollowUp[];
}

const choice = (id: string, prompt: string, options: readonly string[], multi = false): FollowUp => ({
  id,
  prompt,
  kind: 'choice',
  options,
  multi,
});
const text = (id: string, prompt: string, placeholder?: string): FollowUp => ({ id, prompt, kind: 'text', placeholder });

export const INTERESTS: readonly Interest[] = [
  {
    id: 'work',
    label: 'Work & career',
    followUps: [
      text('role', 'What do they do?', 'Nurse, product manager, electrician...'),
      choice('mood', 'How is work treating them lately?', ['Loving it', "It's fine", 'Rough patch']),
    ],
  },
  {
    id: 'cooking',
    label: 'Cooking & food',
    followUps: [
      choice('cuisine', 'Which cuisines do they reach for?', ['Italian', 'Mexican', 'Thai', 'Indian', 'Japanese', 'Mediterranean', 'American comfort', 'Barbecue'], true),
      choice('style', 'How do they cook?', ['Follows recipes', 'Improvises', 'Mostly bakes']),
      text('dish', "A dish they're proud of?", 'Their lasagna, Sunday pancakes...'),
      text('spot', 'Their favorite local restaurant?', 'Hai Hai, the taco truck on Lake...'),
    ],
  },
  {
    id: 'fitness',
    label: 'Fitness',
    followUps: [
      choice('activity', 'What kind?', ['Gym', 'Yoga', 'Cycling', 'Swimming', 'Classes', 'Walking', 'Pilates'], true),
      text('goal', "A goal they're working toward?", 'A pull-up, 10,000 steps, feeling less tired...'),
    ],
  },
  {
    id: 'running',
    label: 'Running',
    followUps: [
      choice('distance', 'Their kind of running?', ['5k', '10k', 'Half marathon', 'Marathon', 'Trails', 'Just for fun']),
      text('race', "A race they're eyeing?", 'Twin Cities Marathon, the Turkey Trot...'),
    ],
  },
  {
    id: 'reading',
    label: 'Books & reading',
    followUps: [
      choice('genre', 'What do they read?', ['Fiction', 'Mystery & thrillers', 'Sci-fi & fantasy', 'Romance', 'History', 'Biography', 'Self-improvement', 'Business'], true),
      text('author', 'An author they love?', 'Octavia Butler, Michael Lewis...'),
    ],
  },
  {
    id: 'movies',
    label: 'Movies',
    followUps: [
      choice('genre', 'Their go-to genres?', ['Comedy', 'Drama', 'Action', 'Horror', 'Sci-fi', 'Documentary', 'Romance', 'Animation'], true),
      text('favorite', 'A movie they can rewatch forever?', 'The Princess Bride, Heat...'),
    ],
  },
  {
    id: 'tv',
    label: 'TV shows',
    followUps: [
      text('show', 'What are they watching right now?', 'Severance, The Bear...'),
      choice('style', 'How do they watch?', ['Binges a season', 'One episode a night', 'Background noise']),
    ],
  },
  {
    id: 'music',
    label: 'Music',
    followUps: [
      choice('genre', 'What do they listen to?', ['Rock', 'Pop', 'Hip-hop', 'Country', 'Jazz', 'Classical', 'Electronic', 'Indie', 'Metal', 'R&B', 'Folk'], true),
      text('artist', 'Artists they keep coming back to?', 'Bon Iver, Beyoncé...'),
      choice('live', 'Live shows?', ['Loves a concert', 'Prefers headphones']),
      text('venue', 'A local venue they love?', 'First Avenue, the Dakota...'),
    ],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    followUps: [
      choice('platform', 'Where do they play?', ['PlayStation', 'Xbox', 'Switch', 'PC', 'Phone', 'Board games'], true),
      text('game', 'What are they playing right now?', 'Zelda, Baldur’s Gate, Wingspan...'),
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    followUps: [
      text('destination', 'A place they dream about?', 'Japan, Lisbon, the Boundary Waters...'),
      choice('style', 'Their kind of trip?', ['Beach', 'Big city', 'Mountains', 'Road trip', 'Somewhere new every time']),
    ],
  },
  {
    id: 'outdoors',
    label: 'The outdoors',
    followUps: [
      choice('activity', 'What gets them outside?', ['Hiking', 'Camping', 'Fishing', 'Kayaking', 'Biking', 'Skiing', 'Gardening'], true),
      text('spot', 'A favorite spot?', 'Gooseberry Falls, the lake cabin...'),
    ],
  },
  {
    id: 'gardening',
    label: 'Gardening',
    followUps: [
      choice('grows', 'What do they grow?', ['Vegetables', 'Flowers', 'Houseplants', 'Herbs', 'Fruit'], true),
      text('project', "Something they're trying this year?", 'Tomatoes from seed, a raised bed...'),
    ],
  },
  {
    id: 'sports',
    label: 'Sports',
    followUps: [
      choice('sport', 'Which sport?', ['Football', 'Basketball', 'Baseball', 'Hockey', 'Soccer', 'Golf', 'Tennis', 'Pickleball'], true),
      text('team', 'Which team?', 'Vikings, Lynx, Wild...'),
      choice('involvement', 'Fan, player, or both?', ['Watches', 'Plays', 'Both']),
      text('watchSpot', 'Where do they like to watch games?', 'The couch, the stadium, a bar with friends...'),
    ],
  },
  {
    id: 'kids',
    label: 'Kids & parenting',
    followUps: [
      choice('ages', 'How old are the kids?', ['Baby', 'Toddler', 'School age', 'Teen', 'Grown'], true),
      text('activity', "Something the kids are into?", 'Soccer, Minecraft, dinosaurs...'),
    ],
  },
  {
    id: 'friends',
    label: 'Friends',
    followUps: [
      text('names', 'Their closest friends?', 'Priya, the college group...'),
      choice('cadence', 'How often do they see them?', ['Weekly', 'Mostly texting', 'Wishes it were more']),
      text('hangout', 'Where do they usually meet up?', 'Trivia night at the Nook, the climbing gym...'),
    ],
  },
  {
    id: 'family',
    label: 'Family',
    followUps: [
      text('closest', 'Who are they closest to?', 'Their mom, their brother Dan...'),
      text('upcoming', 'Anything coming up with family?', 'A reunion, a birthday, a hard anniversary...'),
    ],
  },
  {
    id: 'pets',
    label: 'Pets',
    followUps: [
      choice('kind', 'What kind?', ['Dog', 'Cat', 'Other'], true),
      text('name', "The pet's name?", 'Waffles'),
    ],
  },
  {
    id: 'art',
    label: 'Art & making things',
    followUps: [
      choice('medium', 'What do they make?', ['Drawing', 'Painting', 'Photography', 'Writing', 'Music', 'Knitting & crafts', 'Woodworking', 'Pottery'], true),
      text('project', "Something they're working on?", 'A quilt, a short story...'),
    ],
  },
  {
    id: 'faith',
    label: 'Faith & spirituality',
    followUps: [
      text('community', 'Their tradition or community?', 'St. Mark’s, a meditation group...'),
      choice('practice', 'What does it look like day to day?', ['Weekly services', 'Personal practice', 'Exploring']),
    ],
  },
  {
    id: 'finance',
    label: 'Money & planning',
    followUps: [
      text('goal', 'What are they saving toward?', 'A house, a trip, retiring early...'),
      choice('style', 'Their money style?', ['Spreadsheet person', 'Go with the flow', 'Somewhere between']),
    ],
  },
  {
    id: 'home',
    label: 'Home projects',
    followUps: [
      text('project', 'The project on their list?', 'The basement, a new fence...'),
      choice('style', 'How do they like to do it?', ['DIY all the way', 'Hire it out', 'Depends on the mess']),
    ],
  },
  {
    id: 'local',
    label: 'Around town',
    followUps: [
      text('neighborhood', 'What part of town are they in?', 'Northeast, Uptown, the suburbs...'),
      text('spot', 'A spot they keep going back to?', 'The coffee shop on the corner, the lake path...'),
      text('wishlist', "A place they've been meaning to try?", 'That new ramen place, the climbing gym...'),
      choice('weekend', 'Their ideal weekend around town?', ['Farmers market', 'Long walk', 'Brunch', 'A show', 'Staying in']),
    ],
  },
  {
    id: 'learning',
    label: 'Learning new things',
    followUps: [
      text('topic', 'What are they curious about right now?', 'Spanish, woodworking, Roman history...'),
      choice('how', 'How do they learn?', ['Courses', 'Books & podcasts', 'Just trying things']),
    ],
  },
];

export const INTEREST_IDS: readonly string[] = INTERESTS.map((i) => i.id);

/** Questions tagged `general` apply to everyone regardless of interests. */
export const GENERAL_TAG = 'general';

const byId = new Map(INTERESTS.map((i) => [i.id, i]));

export function findInterest(id: string): Interest | undefined {
  return byId.get(id);
}

export function interestLabel(id: string): string | undefined {
  return byId.get(id)?.label;
}

export function findFollowUp(interestId: string, followUpId: string): FollowUp | undefined {
  return byId.get(interestId)?.followUps.find((f) => f.id === followUpId);
}

import { GENERAL_TAG } from './interests.js';

/**
 * A conversation prompt. Phrased as something YOU ask YOUR PERSON, so the app
 * shows it as:  "Ask Sam"  /  "What's been taking up the most space in your head this week?"
 *
 * `tags` are interest ids (see interests.ts) or `general`. A question is a
 * candidate for a profile when any of its tags match the profile's interests,
 * or when it is tagged `general`.
 */
export interface Question {
  id: string;
  text: string;
  tags: readonly string[];
}

const G = GENERAL_TAG;

/**
 * The starter question bank. Curated by hand on purpose: quality beats volume
 * for an MVP, and a static list is trivially testable and works offline.
 * An LLM-generated source is a planned extension (docs/ROADMAP.md), behind
 * the same `Question` shape.
 */
export const QUESTION_BANK: readonly Question[] = [
  // --- general: good for anyone ---
  { id: 'g01', text: "What's been taking up the most space in your head this week?", tags: [G] },
  { id: 'g02', text: "What's one small thing that would make tomorrow easier for you?", tags: [G] },
  { id: 'g03', text: "Is there anything you've been meaning to tell me but haven't found the moment for?", tags: [G] },
  { id: 'g04', text: "What's something you're looking forward to right now?", tags: [G] },
  { id: 'g05', text: "Who did you talk to today that I don't know much about?", tags: [G] },
  { id: 'g06', text: "What's one thing I did recently that you appreciated?", tags: [G] },
  { id: 'g07', text: 'Is there something you would like more of from me lately?', tags: [G] },
  { id: 'g08', text: "What's a decision you're chewing on right now?", tags: [G] },
  { id: 'g09', text: 'What would a perfect, lazy Saturday look like for you this month?', tags: [G] },
  { id: 'g10', text: "What's something you learned recently that stuck with you?", tags: [G] },
  { id: 'g11', text: 'Is there something stressing you that I could help carry?', tags: [G] },
  { id: 'g12', text: "What's a memory from this year you don't want to forget?", tags: [G] },
  { id: 'g13', text: "What's something you've changed your mind about lately?", tags: [G] },
  { id: 'g14', text: 'When did you last feel really rested? What was different that day?', tags: [G] },

  // --- work ---
  { id: 'work01', text: "What's the part of work you're most dreading this week?", tags: ['work'] },
  { id: 'work02', text: 'Who at work has been making your days better, or harder, lately?', tags: ['work'] },
  { id: 'work03', text: "Is there a project you're actually excited about right now?", tags: ['work'] },
  { id: 'work04', text: 'If you could drop one responsibility at work, which would it be?', tags: ['work'] },
  { id: 'work05', text: 'What would make you feel more appreciated at work?', tags: ['work'] },

  // --- cooking ---
  { id: 'cook01', text: "Is there a dish you've been wanting to try making?", tags: ['cooking'] },
  { id: 'cook02', text: "What's a meal from your childhood you'd love to have again?", tags: ['cooking'] },
  { id: 'cook03', text: "Any new ingredient or restaurant you've been curious about?", tags: ['cooking'] },
  { id: 'cook04', text: 'What do you wish I cooked more often?', tags: ['cooking'] },

  // --- fitness / running ---
  { id: 'fit01', text: 'How is your body feeling this week?', tags: ['fitness', 'running'] },
  { id: 'fit02', text: "Is there a fitness goal you're quietly working toward?", tags: ['fitness'] },
  { id: 'fit03', text: 'Want company on a workout or a walk this week?', tags: ['fitness', 'outdoors'] },
  { id: 'run01', text: "What's your favorite route right now, and why?", tags: ['running'] },
  { id: 'run02', text: "Is there a race or distance you've been thinking about?", tags: ['running'] },

  // --- reading ---
  { id: 'read01', text: 'What are you reading right now, and is it any good?', tags: ['reading'] },
  { id: 'read02', text: "Is there a book you'd want me to read so we could talk about it?", tags: ['reading'] },
  { id: 'read03', text: "What's a book that changed how you think?", tags: ['reading'] },

  // --- movies / tv ---
  { id: 'mov01', text: "What's a movie you've been meaning to watch?", tags: ['movies'] },
  { id: 'mov02', text: "What's something you watched recently that you keep thinking about?", tags: ['movies', 'tv'] },
  { id: 'tv01', text: 'Which show are you into right now, and where are you in it?', tags: ['tv'] },
  { id: 'tv02', text: "Is there a show you'd want to start together?", tags: ['tv'] },

  // --- music ---
  { id: 'mus01', text: 'What have you had on repeat lately?', tags: ['music'] },
  { id: 'mus02', text: "Is there a concert or artist you'd love to see live?", tags: ['music'] },
  { id: 'mus03', text: 'What song puts you in a good mood instantly?', tags: ['music'] },

  // --- gaming ---
  { id: 'game01', text: "What are you playing right now, and what's hooking you?", tags: ['gaming'] },
  { id: 'game02', text: "Is there a game you'd want to try together?", tags: ['gaming'] },

  // --- travel / outdoors ---
  { id: 'trav01', text: 'Where would you go if we could leave next weekend?', tags: ['travel'] },
  { id: 'trav02', text: "What's a trip you still think about?", tags: ['travel'] },
  { id: 'trav03', text: "Is there a place nearby you've been wanting to explore?", tags: ['travel', 'outdoors'] },
  { id: 'out01', text: 'Where do you most want to get outside before the season changes?', tags: ['outdoors'] },
  { id: 'out02', text: "What's your favorite way to spend a day outside?", tags: ['outdoors'] },

  // --- gardening ---
  { id: 'gard01', text: "What's growing well, and what's giving you trouble?", tags: ['gardening'] },
  { id: 'gard02', text: 'Anything you want to plant or change in the garden this year?', tags: ['gardening'] },

  // --- sports ---
  { id: 'spo01', text: "How's your team doing, and how are you feeling about it?", tags: ['sports'] },
  { id: 'spo02', text: "Is there a game coming up you'd like to watch together?", tags: ['sports'] },

  // --- kids ---
  { id: 'kid01', text: "What's something one of the kids did this week that surprised you?", tags: ['kids'] },
  { id: 'kid02', text: 'What part of parenting feels hardest right now?', tags: ['kids'] },
  { id: 'kid03', text: "Is there something you'd like us to do differently with the kids?", tags: ['kids'] },

  // --- friends / family ---
  { id: 'fri01', text: "Who haven't you seen in a while that you miss?", tags: ['friends'] },
  { id: 'fri02', text: "Is there a friend you'd like to have over soon?", tags: ['friends'] },
  { id: 'fam01', text: "How's your family doing? Anyone on your mind?", tags: ['family'] },
  { id: 'fam02', text: "Is there a family thing coming up you're not looking forward to?", tags: ['family'] },

  // --- pets ---
  { id: 'pet01', text: "What's the pet been up to lately that made you laugh?", tags: ['pets'] },
  { id: 'pet02', text: "Anything you've been worrying about with the pets?", tags: ['pets'] },

  // --- art ---
  { id: 'art01', text: 'What have you been making, or wanting to make, lately?', tags: ['art'] },
  { id: 'art02', text: "Is there a creative project you've been putting off?", tags: ['art'] },

  // --- faith ---
  { id: 'faith01', text: "Is there something you've been reflecting on or praying about lately?", tags: ['faith'] },
  { id: 'faith02', text: "Is there a community or gathering you'd like us to go to?", tags: ['faith'] },

  // --- finance ---
  { id: 'fin01', text: 'Is there a money thing on your mind we should talk through?', tags: ['finance'] },
  { id: 'fin02', text: "What's something you'd love to save up for?", tags: ['finance'] },

  // --- home ---
  { id: 'home01', text: "What's the next project you want to tackle around the house?", tags: ['home'] },
  { id: 'home02', text: "Is there something about our place that's been bugging you?", tags: ['home'] },

  // --- learning ---
  { id: 'learn01', text: "What's something you've been curious to learn more about?", tags: ['learning'] },
  { id: 'learn02', text: "Is there a class or skill you'd want to pick up this year?", tags: ['learning'] },
];

const byId = new Map(QUESTION_BANK.map((q) => [q.id, q]));

export function findQuestion(id: string): Question | undefined {
  return byId.get(id);
}

import { GENERAL_TAG } from './interests.js';

/**
 * A conversation prompt. Phrased as something YOU ask YOUR PERSON, so the app
 * shows it as:  "Ask Sam"  /  "What's been taking up the most space in your head this week?"
 *
 * `tags` are interest ids (see interests.ts) or `general`. A question is a
 * candidate for a profile when any of its tags match the profile's interests,
 * or when it is tagged `general`.
 *
 * `requires` lists follow-up answers the text needs, as `interest.followUp`.
 * Such a question is only eligible when the profile has those answers, and its
 * placeholders are filled in at render time (see question-template.ts). These
 * are the most personal questions in the bank, so the selector favours them.
 */
export interface Question {
  id: string;
  text: string;
  tags: readonly string[];
  requires?: readonly string[];
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
  { id: 'work06', text: "What's the part of being a {work.role|lower} that nobody outside it understands?", tags: ['work'], requires: ['work.role'] },

  // --- cooking ---
  { id: 'cook01', text: "Is there a dish you've been wanting to try making?", tags: ['cooking'] },
  { id: 'cook02', text: "What's a meal from your childhood you'd love to have again?", tags: ['cooking'] },
  { id: 'cook03', text: "Any new ingredient or restaurant you've been curious about?", tags: ['cooking'] },
  { id: 'cook04', text: 'What do you wish I cooked more often?', tags: ['cooking'] },
  { id: 'cook05', text: 'Want to find a new {cooking.cuisine} place to try this month?', tags: ['cooking'], requires: ['cooking.cuisine'] },
  { id: 'cook06', text: 'When are you making {cooking.dish} again? I could help.', tags: ['cooking'], requires: ['cooking.dish'] },

  // --- fitness / running ---
  { id: 'fit01', text: 'How is your body feeling this week?', tags: ['fitness', 'running'] },
  { id: 'fit02', text: "Is there a fitness goal you're quietly working toward?", tags: ['fitness'] },
  { id: 'fit03', text: 'Want company on a workout or a walk this week?', tags: ['fitness', 'outdoors'] },
  { id: 'fit04', text: "How's {fitness.activity|lower} going lately? Still enjoying it?", tags: ['fitness'], requires: ['fitness.activity'] },
  { id: 'fit05', text: "How's the “{fitness.goal}” goal coming along?", tags: ['fitness'], requires: ['fitness.goal'] },
  { id: 'run01', text: "What's your favorite route right now, and why?", tags: ['running'] },
  { id: 'run02', text: "Is there a race or distance you've been thinking about?", tags: ['running'] },
  { id: 'run03', text: "How's training for {running.race} feeling? What's the long run like?", tags: ['running'], requires: ['running.race'] },

  // --- reading ---
  { id: 'read01', text: 'What are you reading right now, and is it any good?', tags: ['reading'] },
  { id: 'read02', text: "Is there a book you'd want me to read so we could talk about it?", tags: ['reading'] },
  { id: 'read03', text: "What's a book that changed how you think?", tags: ['reading'] },
  { id: 'read04', text: 'Read any good {reading.genre|lower} lately?', tags: ['reading'], requires: ['reading.genre'] },
  { id: 'read05', text: 'If {reading.author} wrote one more book, what would you want it to be about?', tags: ['reading'], requires: ['reading.author'] },

  // --- movies / tv ---
  { id: 'mov01', text: "What's a movie you've been meaning to watch?", tags: ['movies'] },
  { id: 'mov02', text: "What's something you watched recently that you keep thinking about?", tags: ['movies', 'tv'] },
  { id: 'mov03', text: "What is it about {movies.favorite} that never gets old for you?", tags: ['movies'], requires: ['movies.favorite'] },
  { id: 'tv01', text: 'Which show are you into right now, and where are you in it?', tags: ['tv'] },
  { id: 'tv02', text: "Is there a show you'd want to start together?", tags: ['tv'] },
  { id: 'tv03', text: 'Where are you in {tv.show}? No spoilers, just the vibe.', tags: ['tv'], requires: ['tv.show'] },

  // --- music ---
  { id: 'mus01', text: 'What have you had on repeat lately?', tags: ['music'] },
  { id: 'mus02', text: "Is there a concert or artist you'd love to see live?", tags: ['music'] },
  { id: 'mus03', text: 'What song puts you in a good mood instantly?', tags: ['music'] },
  { id: 'mus04', text: "What's a {music.genre|lower} record you'd put on to get me into it?", tags: ['music'], requires: ['music.genre'] },
  { id: 'mus05', text: 'Has {music.artist} put out anything new? Where would you start me?', tags: ['music'], requires: ['music.artist'] },

  // --- gaming ---
  { id: 'game01', text: "What are you playing right now, and what's hooking you?", tags: ['gaming'] },
  { id: 'game02', text: "Is there a game you'd want to try together?", tags: ['gaming'] },
  { id: 'game03', text: "How's {gaming.game} going? What are you stuck on, or what just clicked?", tags: ['gaming'], requires: ['gaming.game'] },

  // --- travel / outdoors ---
  { id: 'trav01', text: 'Where would you go if we could leave next weekend?', tags: ['travel'] },
  { id: 'trav02', text: "What's a trip you still think about?", tags: ['travel'] },
  { id: 'trav03', text: "Is there a place nearby you've been wanting to explore?", tags: ['travel', 'outdoors'] },
  { id: 'trav04', text: "If we booked {travel.destination} tomorrow, what's the first thing you'd want to do there?", tags: ['travel'], requires: ['travel.destination'] },
  { id: 'out01', text: 'Where do you most want to get outside before the season changes?', tags: ['outdoors'] },
  { id: 'out02', text: "What's your favorite way to spend a day outside?", tags: ['outdoors'] },
  { id: 'out03', text: 'When did you last get to {outdoors.spot}? Should we plan a day?', tags: ['outdoors'], requires: ['outdoors.spot'] },

  // --- gardening ---
  { id: 'gard01', text: "What's growing well, and what's giving you trouble?", tags: ['gardening'] },
  { id: 'gard02', text: 'Anything you want to plant or change in the garden this year?', tags: ['gardening'] },
  { id: 'gard03', text: "How's the {gardening.project|lower} experiment going?", tags: ['gardening'], requires: ['gardening.project'] },

  // --- sports ---
  { id: 'spo01', text: "How's your team doing, and how are you feeling about it?", tags: ['sports'] },
  { id: 'spo02', text: "Is there a game coming up you'd like to watch together?", tags: ['sports'] },
  { id: 'spo03', text: 'How are the {sports.team} looking right now, honestly?', tags: ['sports'], requires: ['sports.team'] },
  { id: 'spo04', text: 'Is there a {sports.team} game coming up we should make a thing of?', tags: ['sports'], requires: ['sports.team'] },
  { id: 'spo05', text: 'What got you into {sports.sport|lower} in the first place?', tags: ['sports'], requires: ['sports.sport'] },

  // --- kids ---
  { id: 'kid01', text: "What's something one of the kids did this week that surprised you?", tags: ['kids'] },
  { id: 'kid02', text: 'What part of parenting feels hardest right now?', tags: ['kids'] },
  { id: 'kid03', text: "Is there something you'd like us to do differently with the kids?", tags: ['kids'] },
  { id: 'kid04', text: "How's the {kids.activity|lower} phase going? Still all they talk about?", tags: ['kids'], requires: ['kids.activity'] },

  // --- friends / family ---
  { id: 'fri01', text: "Who haven't you seen in a while that you miss?", tags: ['friends'] },
  { id: 'fri02', text: "Is there a friend you'd like to have over soon?", tags: ['friends'] },
  { id: 'fri03', text: 'Heard from {friends.names} lately? How are they doing?', tags: ['friends'], requires: ['friends.names'] },
  { id: 'fam01', text: "How's your family doing? Anyone on your mind?", tags: ['family'] },
  { id: 'fam02', text: "Is there a family thing coming up you're not looking forward to?", tags: ['family'] },
  { id: 'fam03', text: "How's {family.closest} doing? Talked recently?", tags: ['family'], requires: ['family.closest'] },
  { id: 'fam04', text: 'How are you feeling about {family.upcoming|lower}?', tags: ['family'], requires: ['family.upcoming'] },

  // --- pets ---
  { id: 'pet01', text: "What's the pet been up to lately that made you laugh?", tags: ['pets'] },
  { id: 'pet02', text: "Anything you've been worrying about with the pets?", tags: ['pets'] },
  { id: 'pet03', text: "What's {pets.name} been up to that made you laugh this week?", tags: ['pets'], requires: ['pets.name'] },

  // --- art ---
  { id: 'art01', text: 'What have you been making, or wanting to make, lately?', tags: ['art'] },
  { id: 'art02', text: "Is there a creative project you've been putting off?", tags: ['art'] },
  { id: 'art03', text: "How's {art.project|lower} coming along? Can I see?", tags: ['art'], requires: ['art.project'] },

  // --- faith ---
  { id: 'faith01', text: "Is there something you've been reflecting on or praying about lately?", tags: ['faith'] },
  { id: 'faith02', text: "Is there a community or gathering you'd like us to go to?", tags: ['faith'] },
  { id: 'faith03', text: "How are things at {faith.community}? Anyone I should know about?", tags: ['faith'], requires: ['faith.community'] },

  // --- finance ---
  { id: 'fin01', text: 'Is there a money thing on your mind we should talk through?', tags: ['finance'] },
  { id: 'fin02', text: "What's something you'd love to save up for?", tags: ['finance'] },
  { id: 'fin03', text: "How's the {finance.goal|lower} fund looking? Closer than last month?", tags: ['finance'], requires: ['finance.goal'] },

  // --- home ---
  { id: 'home01', text: "What's the next project you want to tackle around the house?", tags: ['home'] },
  { id: 'home02', text: "Is there something about our place that's been bugging you?", tags: ['home'] },
  { id: 'home03', text: "What's the next step on {home.project|lower}? Want a hand this weekend?", tags: ['home'], requires: ['home.project'] },

  // --- learning ---
  { id: 'learn01', text: "What's something you've been curious to learn more about?", tags: ['learning'] },
  { id: 'learn02', text: "Is there a class or skill you'd want to pick up this year?", tags: ['learning'] },
  { id: 'learn03', text: 'Learned anything surprising about {learning.topic|lower} lately?', tags: ['learning'], requires: ['learning.topic'] },
];

const byId = new Map(QUESTION_BANK.map((q) => [q.id, q]));

export function findQuestion(id: string): Question | undefined {
  return byId.get(id);
}

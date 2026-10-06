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
  /** Curated (default) or written by the AI engine for one profile. */
  source?: 'curated' | 'ai';
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
  { id: 'g11', text: "What's one thing that went right this week that we should celebrate?", tags: [G] },
  { id: 'g12', text: "What's a memory from this year you don't want to forget?", tags: [G] },
  { id: 'g13', text: "What's something you've changed your mind about lately?", tags: [G] },
  { id: 'g14', text: 'When did you last feel really rested? What was different that day?', tags: [G] },

  // --- work ---
  { id: 'work01', text: "What's the part of work you're most looking forward to this week?", tags: ['work'] },
  { id: 'work02', text: 'Who at work has been making your days better lately?', tags: ['work'] },
  { id: 'work03', text: "Is there a project you're actually excited about right now?", tags: ['work'] },
  { id: 'work04', text: 'If you could spend a whole day on just one part of your job, which part?', tags: ['work'] },
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
  { id: 'kid02', text: 'What part of parenting are you better at than you expected?', tags: ['kids'] },
  { id: 'kid03', text: "What's something you'd love us to do more of with the kids?", tags: ['kids'] },
  { id: 'kid04', text: "How's the {kids.activity|lower} phase going? Still all they talk about?", tags: ['kids'], requires: ['kids.activity'] },

  // --- friends / family ---
  { id: 'fri01', text: "Who haven't you seen in a while that you miss?", tags: ['friends'] },
  { id: 'fri02', text: "Is there a friend you'd like to have over soon?", tags: ['friends'] },
  { id: 'fri03', text: 'Heard from {friends.names} lately? How are they doing?', tags: ['friends'], requires: ['friends.names'] },
  { id: 'fam01', text: "How's your family doing? Anyone on your mind?", tags: ['family'] },
  { id: 'fam02', text: "Is there a family thing coming up you're looking forward to?", tags: ['family'] },
  { id: 'fam03', text: "How's {family.closest} doing? Talked recently?", tags: ['family'], requires: ['family.closest'] },
  { id: 'fam04', text: 'How are you feeling about {family.upcoming|lower}?', tags: ['family'], requires: ['family.upcoming'] },

  // --- pets ---
  { id: 'pet01', text: "What's the pet been up to lately that made you laugh?", tags: ['pets'] },
  { id: 'pet02', text: "What's the thing the pet does that you'd never want to change?", tags: ['pets'] },
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
  { id: 'fin01', text: "What's a money win we should celebrate, even a small one?", tags: ['finance'] },
  { id: 'fin02', text: "What's something you'd love to save up for?", tags: ['finance'] },
  { id: 'fin03', text: "How's the {finance.goal|lower} fund looking? Closer than last month?", tags: ['finance'], requires: ['finance.goal'] },

  // --- home ---
  { id: 'home01', text: "What's the next project you want to tackle around the house?", tags: ['home'] },
  { id: 'home02', text: "What's a small thing about our place that makes you happy?", tags: ['home'] },
  { id: 'home03', text: "What's the next step on {home.project|lower}? Want a hand this weekend?", tags: ['home'], requires: ['home.project'] },

  // --- learning ---
  { id: 'learn01', text: "What's something you've been curious to learn more about?", tags: ['learning'] },
  { id: 'learn02', text: "Is there a class or skill you'd want to pick up this year?", tags: ['learning'] },
  { id: 'learn03', text: 'Learned anything surprising about {learning.topic|lower} lately?', tags: ['learning'], requires: ['learning.topic'] },

  // --- around town (local interest) ---
  { id: 'loc01', text: "What's a place around here you've been meaning to try?", tags: ['local'] },
  { id: 'loc02', text: 'If we had a free Saturday morning, where would you want to go?', tags: ['local'] },
  { id: 'loc03', text: 'When did we last go to {local.spot}? Want to go this week?', tags: ['local'], requires: ['local.spot'] },
  { id: 'loc04', text: 'What do you love most about {local.neighborhood}?', tags: ['local'], requires: ['local.neighborhood'] },
  { id: 'loc05', text: "Should we finally try {local.wishlist}? I'll book it.", tags: ['local'], requires: ['local.wishlist'] },
  { id: 'loc06', text: "What's your favorite thing about living in {profile.city} right now?", tags: ['local', G], requires: ['profile.city'] },
  { id: 'loc07', text: 'Is there anything happening in {profile.city} this month you want to go to?', tags: ['local', G], requires: ['profile.city'] },

  // --- location-aware follow-ups on other interests ---
  { id: 'cook07', text: 'Is {cooking.spot} still the best, or has somewhere new taken over?', tags: ['cooking'], requires: ['cooking.spot'] },
  { id: 'spo06', text: 'Want to catch the next game at {sports.watchSpot}?', tags: ['sports'], requires: ['sports.watchSpot'] },
  { id: 'mus06', text: "Who's playing at {music.venue} soon that you'd actually go see?", tags: ['music'], requires: ['music.venue'] },
  { id: 'fri04', text: 'When are you next at {friends.hangout}? Should I come along, or is that yours?', tags: ['friends'], requires: ['friends.hangout'] },

  // --- deeper general: memory, values, the future ---
  { id: 'g15', text: "What's something you were proud of this week that nobody noticed?", tags: [G] },
  { id: 'g16', text: 'If you could hand one chore to someone else forever, which one?', tags: [G] },
  { id: 'g17', text: "What's something about us that turned out better than you expected a year ago?", tags: [G] },
  { id: 'g18', text: "What's a small ritual you'd like us to have?", tags: [G] },
  { id: 'g19', text: 'When do you feel most like yourself?', tags: [G] },
  { id: 'g20', text: "Who's someone you've been meaning to thank?", tags: [G] },
  { id: 'g21', text: "What's something you miss that we could bring back?", tags: [G] },
  { id: 'g22', text: 'If next year went perfectly, what would be different in October?', tags: [G] },
  { id: 'g23', text: "What's something I do that you'd never ask me to stop, but secretly love?", tags: [G] },
  { id: 'g24', text: "What's the best thing you ate this week?", tags: [G] },

  // --- deeper, detail-driven ---
  { id: 'work07', text: "How's {work.project|lower} going? What's the part you're proudest of so far?", tags: ['work'], requires: ['work.project'] },
  { id: 'work08', text: "What's the latest with {work.colleague}?", tags: ['work'], requires: ['work.colleague'] },
  { id: 'cook08', text: 'Want to pick a weekend to finally try making {cooking.want|lower}?', tags: ['cooking'], requires: ['cooking.want'] },
  { id: 'fit06', text: 'Are {fitness.when|lower} still working for your workouts, or should we move things around?', tags: ['fitness'], requires: ['fitness.when'] },
  { id: 'read06', text: 'How far are you into {reading.current}? Is it holding up?', tags: ['reading'], requires: ['reading.current'] },
  { id: 'mus07', text: 'When did {music.song} become ours for you?', tags: ['music'], requires: ['music.song'] },
  { id: 'game04', text: 'Want to play {gaming.game} together this week? I promise to be bad at it.', tags: ['gaming'], requires: ['gaming.game', 'gaming.with'] },
  { id: 'trav05', text: "What's one thing you want to make sure we do on the {travel.next} trip?", tags: ['travel'], requires: ['travel.next'] },
  { id: 'spo07', text: 'Is {sports.player} having the season you hoped for?', tags: ['sports'], requires: ['sports.player'] },
  { id: 'spo08', text: 'When do we play the {sports.rival} next? Should we make an event of it?', tags: ['sports'], requires: ['sports.rival'] },
  { id: 'pet04', text: 'Did {pets.name} do the thing again today?', tags: ['pets'], requires: ['pets.name', 'pets.quirk'] },
  { id: 'fri05', text: 'How are you feeling about {friends.upcoming|lower}? Anything I can do?', tags: ['friends'], requires: ['friends.upcoming'] },
  { id: 'home04', text: 'If {home.blocker|lower} went away tomorrow, what would you do first on {home.project|lower}?', tags: ['home'], requires: ['home.blocker', 'home.project'] },
  { id: 'learn04', text: "What first got you curious about {learning.topic|lower}?", tags: ['learning'], requires: ['learning.topic'] },
  { id: 'kid05', text: "What's the thing the kids said this week that you don't want to forget?", tags: ['kids'] },
  { id: 'fam05', text: 'What did you learn from your family that you want to pass on?', tags: ['family'] },
  { id: 'faith04', text: "What's a question about faith you've been sitting with lately?", tags: ['faith'] },
  { id: 'fin04', text: 'What would you do with a surprise thousand dollars, no strings?', tags: ['finance'] },
  { id: 'art04', text: 'When you make {art.medium|lower}, what are you thinking about?', tags: ['art'], requires: ['art.medium'] },
  { id: 'out04', text: 'If we did {outdoors.activity|lower} next weekend, where would you want to go?', tags: ['outdoors'], requires: ['outdoors.activity'] },

  // --- more general ---
  { id: 'g25', text: "What's a compliment you got recently that you're still thinking about?", tags: [G] },
  { id: 'g26', text: 'If we had no plans this weekend, what would you want the first morning to look like?', tags: [G] },
  { id: 'g27', text: "What's something you want to get better at, just for you?", tags: [G] },
  { id: 'g28', text: "What's one thing that would make tomorrow feel like a win?", tags: [G] },
  { id: 'g29', text: "What's one thing about your parents you understand better now?", tags: [G] },
  { id: 'g30', text: "What's a sound or smell that takes you right back somewhere?", tags: [G] },
  { id: 'g31', text: "When's the last time you laughed so hard it hurt?", tags: [G] },
  { id: 'g32', text: "What's a boring errand you'd happily do together?", tags: [G] },
  { id: 'g33', text: 'What would you tell yourself at 25?', tags: [G] },
  { id: 'g34', text: "What's a small thing I do that makes your day better?", tags: [G] },
  { id: 'g35', text: 'What do you want more of in the next three months, and less of?', tags: [G] },
  { id: 'g36', text: "What's something you're quietly looking forward to this winter?", tags: [G] },

  // --- new follow-up templates on existing interests ---
  { id: 'cook09', text: 'Tonight: {cooking.eatOut|lower}, or should I surprise you?', tags: ['cooking'], requires: ['cooking.eatOut'] },
  { id: 'run04', text: "Is running {running.company|lower} still what you need, or do you want a change?", tags: ['running'], requires: ['running.company'] },
  { id: 'read07', text: "Would you want a {reading.format|lower} version of something I'm reading, so we could talk about it?", tags: ['reading'], requires: ['reading.format'] },
  { id: 'mov04', text: 'Has {movies.actor} made anything lately we should watch?', tags: ['movies'], requires: ['movies.actor'] },
  { id: 'mov05', text: 'Want to make a {movies.where|lower} night of it this week?', tags: ['movies'], requires: ['movies.where'] },
  { id: 'tv04', text: 'Want to put on {tv.comfort} tonight and just be cozy?', tags: ['tv'], requires: ['tv.comfort'] },
  { id: 'trav06', text: 'What would it take to actually do {travel.bucket}? Not someday. A year?', tags: ['travel'], requires: ['travel.bucket'] },
  { id: 'out05', text: "It's almost {outdoors.season|lower}. What's the first thing you want to do outside?", tags: ['outdoors'], requires: ['outdoors.season'] },
  { id: 'gard04', text: "How's {gardening.pride|lower} doing? Still the favorite?", tags: ['gardening'], requires: ['gardening.pride'] },
  { id: 'kid06', text: "How's {kids.school|lower} going? Anything I should know before I hear it from the kids?", tags: ['kids'], requires: ['kids.school'] },
  { id: 'kid07', text: "What would make {kids.hardest|lower} a little more fun this week?", tags: ['kids'], requires: ['kids.hardest'] },
  { id: 'fam06', text: 'Is {family.tradition|lower} happening this year? How do you feel about it?', tags: ['family'], requires: ['family.tradition'] },
  { id: 'faith05', text: 'What do you want {faith.season} to feel like for us this year?', tags: ['faith'], requires: ['faith.season'] },
  { id: 'fin05', text: 'What would it feel like to have {finance.worry|lower} sorted? Want to make a plan together?', tags: ['finance'], requires: ['finance.worry'] },
  { id: 'game05', text: 'What is it about {gaming.alltime} that nothing since has matched?', tags: ['gaming'], requires: ['gaming.alltime'] },
  { id: 'pet05', text: "Any update on {pets.vet|lower} with {pets.name}?", tags: ['pets'], requires: ['pets.vet', 'pets.name'] },
  { id: 'mus08', text: 'What are you listening to on the {music.listen|lower} these days?', tags: ['music'], requires: ['music.listen'] },
  { id: 'work09', text: 'If {work.dream|lower} happened next year, what would change for us?', tags: ['work'], requires: ['work.dream'] },

  // --- podcasts & youtube ---
  { id: 'pod01', text: 'What did {podcasts.show} cover this week that you want to tell me about?', tags: ['podcasts'], requires: ['podcasts.show'] },
  { id: 'pod02', text: "What's something you learned from a podcast that you've been dying to bring up?", tags: ['podcasts'] },
  { id: 'pod03', text: 'Is there an episode you want me to listen to so we can argue about it?', tags: ['podcasts'] },
  { id: 'pod04', text: "What's a {podcasts.kind|lower} show you'd recommend to someone brand new to it?", tags: ['podcasts'], requires: ['podcasts.kind'] },

  // --- coffee & drinks ---
  { id: 'drk01', text: 'Should I grab you {drinks.order|lower} on the way home?', tags: ['drinks'], requires: ['drinks.order'] },
  { id: 'drk02', text: 'When did we last go to {drinks.spot}? Want to go this weekend?', tags: ['drinks'], requires: ['drinks.spot'] },
  { id: 'drk03', text: 'Is {drinks.ritual|lower} still sacred, or has it slipped?', tags: ['drinks'], requires: ['drinks.ritual'] },
  { id: 'drk04', text: "What's a place you'd want to sit for an hour with nothing to do?", tags: ['drinks', 'local'] },

  // --- style & self-care ---
  { id: 'sty01', text: 'When did you last do something just for yourself?', tags: ['style', 'wellness'] },
  { id: 'sty02', text: 'Should {style.wishlist|lower} finally happen? Birthday is coming.', tags: ['style'], requires: ['style.wishlist'] },
  { id: 'sty03', text: "I love you in {style.signature|lower}. When did that become your thing?", tags: ['style'], requires: ['style.signature'] },
  { id: 'sty04', text: 'Want me to book {style.care|lower} for you this month?', tags: ['style'], requires: ['style.care'] },

  // --- causes & volunteering ---
  { id: 'vol01', text: "What's going on with {volunteering.cause|lower} right now?", tags: ['volunteering'], requires: ['volunteering.cause'] },
  { id: 'vol02', text: "Is there something at {volunteering.org} I could help with?", tags: ['volunteering'], requires: ['volunteering.org'] },
  { id: 'vol03', text: "What's a cause you'd give a whole weekend to?", tags: ['volunteering'] },
  { id: 'vol04', text: 'Who do you admire for how they show up for people?', tags: ['volunteering', G] },

  // --- sleep & wellness ---
  { id: 'wel01', text: 'When did you last sleep really well? What was different that night?', tags: ['wellness'] },
  { id: 'wel02', text: 'Have you had time for {wellness.unwind|lower} lately? Want me to make some?', tags: ['wellness'], requires: ['wellness.unwind'] },
  { id: 'wel03', text: 'You recharge with {wellness.recharge|lower}. When did you last get enough of it?', tags: ['wellness'], requires: ['wellness.recharge'] },
  { id: 'wel04', text: 'What would a genuinely restful day look like for you right now?', tags: ['wellness', G] },
  { id: 'wel05', text: "What's one thing I could take off your plate this week?", tags: ['wellness', G] },
];

const byId = new Map(QUESTION_BANK.map((q) => [q.id, q]));

export function findQuestion(id: string): Question | undefined {
  return byId.get(id);
}

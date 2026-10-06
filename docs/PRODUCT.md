# Your Person: product brief

## The idea in one line

Tell the app a little about your person. It hands you a couple of simple questions that get the two of you talking about what is actually going on in each other's world.

## Who it is for

Couples first. Anyone in a long-term relationship who likes their partner, wants to stay curious about them, and notices that the day-to-day ("how was work", "fine") crowds out the real conversations.

The user is one half of the couple. They set up a profile *about* their person. The person being asked never needs the app. That keeps onboarding to one install and one short questionnaire. Pairing two accounts is a later phase (see `ROADMAP.md`).

## Principles

1. **Simplicity is the feature.** One screen with one question beats a dashboard. Every added field has to earn its place.
2. **Prompts, not advice.** The app never tells you how to have a relationship. It just hands you a good question and gets out of the way.
3. **The user is the editor.** A thumbs-down hides a question for good. A thumbs-up nudges more like it. The question bank gets better for *this* couple over time.
4. **Low ceremony.** No account to create for the MVP. No daily streaks or guilt. Open it when you want a question.

## MVP scope

### Screens

| Screen | Purpose | Notes |
| --- | --- | --- |
| **Onboarding** | Set up the partner profile | A short stack of index cards. Card 1: name, pick interests from chips, one free-text box: "What's going on in their world lately?" Then one card per chosen interest that goes deeper: Sports asks which sport, then which team, then fan or player; Music asks genres, then artists, then live shows or headphones. Every deeper answer is optional. |
| **Today** | Show questions | One question on a card. Big text. "Ask Sam" at the top. "Nope" hides it, "Good one" keeps it coming back, "Next card" advances. Three per batch, then deal three more. |
| **Profile** | Update the profile and pick a look | Same cards as onboarding, pre-filled. Save from the first card or walk into the details. Five color palettes to choose from. |

### Where they live

The first card asks for a city, with a "Use my location" shortcut that fills it from the phone. Only the city name is kept. It unlocks "Around town" questions and anchors the AI research step (what's on in Minneapolis this month, which new Thai place opened).

### Questions written for this person

With an API key configured, the backend asks Claude to write a deck of ten questions from the whole profile: name, city, every follow-up answer, what's going on lately, and which questions the asker liked or hid. Optionally it first web-searches for timely local facts (the team's next game, a festival this month). Those questions appear in the normal rotation marked "Written for Sam", carry the most weight, and are rated and hidden like any other. The deck refreshes itself when it goes stale or the profile changes. Without a key, nothing changes: the curated bank carries the app.

### Why go deep on interests

"They like sports" produces a generic question. "They follow the Vikings" produces "How are the Vikings looking right now, honestly?" The follow-ups exist to turn the question bank from a list of pleasantries into something that sounds like it knows your person. Each interest has three to six follow-ups, and the question bank has templates that use those answers (`docs/ARCHITECTURE.md`, "Deep interests").

### Behaviour

- Questions are chosen from a curated bank. Each question is tagged with interests. A profile sees general questions, ones matching its interests, and, favoured above both, ones built from its follow-up answers.
- Recently shown questions are avoided until the pool runs dry.
- Thumbs-down hides a question permanently for that profile. Thumbs-up makes it slightly more likely to come back later.
- The profile is stored on the server and its id is kept on the device. Reinstalling the app loses the link to the profile. Acceptable for an MVP; accounts fix it later.

### Not in the MVP

- Accounts, login, pairing two people.
- Push notifications or a daily reminder.
- AI-generated questions. The bank is hand-written on purpose so quality is controlled. The API is shaped so an LLM source can slot in later.
- Analytics, sharing, social features.

## Platforms and order

1. iPhone
2. Android
3. Web, designed for a phone screen

All three come from one Expo codebase. See `ARCHITECTURE.md` for why.

## Open product questions

- How many questions per batch feels right: one, three, five?
- Should the app ever suggest *when* to ask (a nudge on Friday evening)? Leans against principle 4.
- Does the free-text "what's going on in their world" box need to affect question selection, or is it enough that the user re-reads it? The MVP stores it and shows it on the profile screen only.
- Name: "Your Person" is a working title.

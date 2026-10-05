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
| **Onboarding** | Set up the partner profile | Name, pick interests from chips, one free-text box: "What's going on in their world lately?" Three taps and you are in. |
| **Today** | Show questions | Full-screen, one question at a time. Big text. "Ask Sam" at the top. Thumbs up / thumbs down / next. Three questions per batch, then "Get more". |
| **Profile** | Update the profile | Same form as onboarding, pre-filled. Reachable from a small icon on the Today screen. |

### Behaviour

- Questions are chosen from a curated bank. Each question is tagged with interests. A profile sees general questions plus ones matching its interests.
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

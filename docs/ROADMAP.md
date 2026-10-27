# Roadmap

Phases, not dates. Each phase should be shippable on its own.

## Phase 0: walking skeleton (this commit)

- [x] NestJS API: profiles, curated question bank, selection with hide/like, in-memory and MongoDB storage
- [x] App: onboarding questionnaire, one question at a time with thumbs up/down, profile edit (first as an Expo app, since rebuilt natively)
- [x] Runs against an in-memory API with no infrastructure
- [x] Index Card look with five selectable palettes (replaced by the Letter look, then the Journal)
- [x] Deep interests: per-interest follow-up cards in onboarding, answers feed templated questions
- [x] Location as a place name, "Around town" interest, local follow-ups and city questions
- [x] AI question engine: Claude writes a per-profile deck from the whole profile and feedback, optional web research, mixed into selection, rated like curated questions
- [x] Gottman-inspired cards: appreciation, bids, dreams, evening mode, rituals
- [x] Memories ("what they said"), Not now, dates that matter, weekly nudge, shorter onboarding
- [x] The Letter look: one soft colour, a script hand, the question writes itself with haptic ticks (grug's idea, our own hand)
- [x] Rebuilt as a native SwiftUI iPhone app: system haptics, no dependencies
- [x] The Journal look: white paper, a typewriter face, the question types itself with a blinking underscore, words instead of buttons, ink circles, page turns (replaced the Letter look and its papers)
- [ ] Turn the engine on with a real key and read a few decks critically; tune the system prompt from what comes back
- [ ] Run it on a real iPhone from Xcode and tune the typing speed, the circle, and the haptics by hand

## Phase 1: make it real

- Deploy the API with MongoDB Atlas
- TestFlight build from Xcode
- App icon, splash screen, a name that is not a working title
- Error states and empty states polished (no API reachable, no questions left)
- Simple rate limiting on the API

## Phase 2: accounts and pairing

- Sign in (Apple, Google) so a profile survives a reinstall and syncs across devices
- Optional pairing: both partners install the app, each fills in the other, each gets prompts. Still works solo.
- Replace "profile id is the credential" with real authorization: a user can only read their own profiles

## Phase 3: better questions

- More template questions per follow-up; "Other" free text on choice chips
- Research step: look up a venue's calendar, the team's schedule, the farmers market's season; cache briefs per city so profiles in the same town share lookups
- Let the engine propose new follow-up questions for the taxonomy when it notices a gap ("they said hockey; ask which league")
- A nightly refresh for active profiles instead of refresh-on-read, once there is a job runner
- Seasonal and situational prompts (new job, new baby, moved house)
- Let users write their own questions

## Phase 4: gentle habits

- Optional weekly nudge notification, off by default
- "Questions you both loved" history
- A home screen widget with today's question

## Known debt

- `--legacy-peer-deps` is needed on `npm install` for both projects because npm 10.9 crashes resolving vitest 5's optional peers. Revisit when npm or vitest moves on.
- The app does not cache questions offline. If the API is down, it says so and offers retry.

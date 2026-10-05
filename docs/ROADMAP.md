# Roadmap

Phases, not dates. Each phase should be shippable on its own.

## Phase 0: walking skeleton (this commit)

- [x] NestJS API: profiles, curated question bank, selection with hide/like, in-memory and MongoDB storage
- [x] Expo app: onboarding questionnaire, full-screen question cards with thumbs up/down, profile edit
- [x] Runs on web with no infrastructure; iOS and Android via Expo Go
- [x] Index Card look with five selectable palettes
- [x] Deep interests: per-interest follow-up cards in onboarding, answers feed templated questions
- [ ] Try it on a real phone with Expo Go and fix what feels wrong

## Phase 1: make it real

- Deploy the API with MongoDB Atlas
- EAS Build for iOS (TestFlight) and Android (internal testing track)
- App icon, splash screen, a name that is not a working title
- Error states and empty states polished (no API reachable, no questions left)
- Simple rate limiting on the API

## Phase 2: accounts and pairing

- Sign in (Apple, Google) so a profile survives a reinstall and syncs across devices
- Optional pairing: both partners install the app, each fills in the other, each gets prompts. Still works solo.
- Replace "profile id is the credential" with real authorization: a user can only read their own profiles

## Phase 3: better questions

- Use `currentFocus` in selection, not just display
- More template questions per follow-up; "Other" free text on choice chips
- LLM-generated questions behind the existing `QUESTION_SOURCE` port, with the curated bank as fallback. The follow-up answers are the natural prompt context. Generate a small batch per profile, cache it, let ratings prune it exactly like curated ones.
- Seasonal and situational prompts (new job, new baby, moved house)
- Let users write their own questions

## Phase 4: gentle habits

- Optional weekly nudge notification, off by default
- "Questions you both loved" history
- Widgets (iOS home screen, Android)

## Known debt

- `--legacy-peer-deps` is needed on `npm install` for both projects because npm 10.9 crashes resolving vitest 5's optional peers. Revisit when npm or vitest moves on.
- The app does not cache questions offline. If the API is down, it says so and offers retry.

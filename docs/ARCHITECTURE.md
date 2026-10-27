# Architecture

This document explains what the system is made of and, more importantly, why. It is written for someone comfortable with Java and Spring Boot who is newer to the JavaScript ecosystem and to document databases. Analogies to Spring are deliberate.

## The shape of the system

```
+-------------------------------+        HTTPS / JSON        +---------------------------+
|  ios/  (Swift, SwiftUI)       |  ----------------------->  |  api/  (NestJS, Node 22)  |
|  iPhone                       |                            |  REST under /api          |
+-------------------------------+                            +------------+--------------+
                                                                          |
                                                              ProfileRepository (port)
                                                                 /                 \
                                                   InMemoryProfileRepository   MongoProfileRepository
                                                   (dev + tests, no setup)     (MONGODB_URI set)
```

Two deployable units, one repo. The app never talks to the database; it only talks to the API.

## Decision 1: a native SwiftUI app for iPhone

**Options considered**

| Option | Pros | Cons |
| --- | --- | --- |
| Expo (React Native) | One TypeScript codebase for iOS, Android and web | Every pixel goes through a bridge and a web-ish layout engine; animations, haptics and typography are always a translation of the native thing. The first version of this app was built this way. |
| Flutter | One codebase, good performance | Dart, and its own widgets rather than the platform's |
| **Swift + SwiftUI** | The real thing. Canvas, TimelineView, Core Haptics, the system font pipeline and the navigation stack are all first-party and all free. No dependencies at all. | iPhone only. A Mac with Xcode to build. |

**Decision:** SwiftUI, iPhone only. The app is a page of typed text and a handful of words; what matters is how it feels, and feel is where cross-platform layers charge their tax. Android and web can come later as their own apps if they are ever wanted; the API does not care.

**What to know coming from Java**

- SwiftUI is a declarative component model like React, with the compiler doing the work: a `View` is a struct whose `body` describes the UI, and `@State` / `@StateObject` / `@EnvironmentObject` hold the state that makes it re-render. No classes to speak of for the UI itself.
- There is no build system to learn: the Xcode project (`ios/YourPerson.xcodeproj`) is the equivalent of a Gradle or Maven file, and it has zero third-party dependencies. The folder on disk is the project; add a file and it is in the build.
- `async/await` and `actor` are Swift's concurrency; `URLSession` plus `Codable` do what RestTemplate plus Jackson do, with field names mapped by convention (`API/Models.swift`).
- One store lives for the whole run and is injected through the environment (`YourPersonApp.swift`): which profile this phone uses. Spring analogy: an application-scoped bean. There is one look, so there is no theme store: `Theme/Ink.swift` holds the ink colours, the one font, and the type sizes, and views read them directly.
- The journal pieces live in `Components/`: `Page` (white paper, the folded corner, the swipe), `Typewriter` (the typing line with its three cursor states), `Word` (a tappable word; the app has no buttons), `Circled` (a word with an ink circle drawn around it), `Choices` (a list of them), `Line` (a text field with only a rule underneath), and `Small` (the grey text).

### The typewriter and the circle

Both animations are plain SwiftUI, no engine and no dependencies.

- **Typing.** `Typewriter` keeps a character count in `@State`. A `.task(id: text)` loop sleeps for one character's worth of time (26 a second) and bumps the count; changing the text cancels the loop and starts over, and leaving the screen cancels it too, so there is nothing to clean up. The cursor is a non-breaking space and an underscore appended to the text so it can never wrap onto its own line. It is steady while typing, blinks (a second loop toggling its colour every half second) once the line is done and the page is waiting, and turns clear once the page has an answer. Each word's first character ticks the Taptic Engine through `Services/Haptics.swift`. Reduce Motion shows the finished line at once; a tap on the line does the same.
- **The circle.** `Circled` lays an SVG-style path (one loop with a run-up and an overlap, drawn once in a 100 x 40 box) over the word as a SwiftUI `Shape`, scaled to the word's size. Picking the word animates `trim(from: 0, to: progress)` from 0 to 1 over 0.7 s on a curve that moves fast through the middle and slows into the overlap, which reads as a pen closing a loop. Unpicking sets it to 0 at once. A word that starts picked shows its circle without redrawing it.
- **The page turn.** `Page` draws the fold as a filled triangle with a crease line in the bottom-right corner and listens for a horizontal drag anywhere on the page; a drag that is clearly sideways and long enough turns the page or, where allowed, goes back.
- Navigation is a `NavigationStack`. Screens push and pop; the swipe-back gesture is free.
- The app code is heavily commented. Start with `ios/YourPerson/YourPersonApp.swift` and follow the types.

## Decision 2: NestJS for the API

**Options considered**

| Option | Notes |
| --- | --- |
| Spring Boot | Zero learning curve for the author. Excellent choice in its own right. Chosen against only because a stated goal of this project is to learn a mainstream JavaScript backend, and sharing TypeScript types between app and API is a real convenience. |
| Express | The classic minimal Node framework. Unopinionated to a fault: no DI, no module system, no validation. You end up inventing your own Spring. |
| Fastify / Hono | Fast and modern, but similarly minimal. |
| **NestJS** | The Node framework that looks the most like Spring Boot: modules, controllers, providers (services), constructor injection, decorators, pipes (like `@Valid`), guards (like security filters), interceptors (like AOP). Built on top of Express by default. |

**Decision:** NestJS. If you know Spring, you can read the API today.

**Rosetta stone**

| Spring Boot | NestJS | Where in this repo |
| --- | --- | --- |
| `@SpringBootApplication` | root `@Module` | `api/src/app.module.ts` |
| `@RestController` + `@RequestMapping` | `@Controller('path')` | `api/src/profiles/profiles.controller.ts` |
| `@Service` | `@Injectable()` provider | `api/src/profiles/profiles.service.ts` |
| Constructor injection | Constructor injection | everywhere |
| Interface + `@Repository` impl | Abstract class used as DI token | `api/src/profiles/profile.repository.ts` |
| `@ConditionalOnProperty` | Dynamic module `forRoot()` | `api/src/persistence/persistence.module.ts` |
| `@Valid` + Bean Validation | `ValidationPipe` + `class-validator` | `api/src/main.ts`, `api/src/profiles/dto/` |
| `application.properties` | `.env` via `@nestjs/config` | `api/.env.example` |
| `@SpringBootTest` + MockMvc | `@nestjs/testing` + supertest | `api/test/app.e2e-spec.ts` |
| JUnit | Vitest | `api/src/**/*.spec.ts` |
| Maven | npm + `package.json` | `api/package.json` |

**One thing that will bite you:** the API is compiled as native ES modules (`"type": "module"` in `package.json`). That is why every relative import ends in `.js` even though the source file is `.ts`. It is what Node expects at runtime, and TypeScript is fine with it.

## Decision 3: MongoDB, behind a repository port

**Why a document database here**

A partner profile is a small, self-contained blob: name, interests, free text, the list of questions this user liked or hid, the list of questions shown recently. The app always reads and writes the *whole* profile. Nothing queries across profiles. That is the textbook case for a document store: one aggregate, one document, no joins.

In a relational design you would have `profile`, `profile_interest`, `question_feedback`, and `question_history` tables, and a `JOIN FETCH` to load one person. In MongoDB it is one document:

```json
{
  "_id": "3f2a...",
  "name": "Sam",
  "interests": ["cooking", "running"],
  "currentFocus": "Big deadline at work",
  "feedback": [{ "questionId": "cook02", "score": 1, "ratedAt": "..." }],
  "recentlyShown": ["g01", "cook02", "run01"],
  "createdAt": "...", "updatedAt": "..."
}
```

Embedding is the right call *because* the children are small, bounded, and never needed on their own. If feedback grew unbounded or needed cross-profile reporting, it would move to its own collection. That judgement call is the whole art of document modelling.

**Why it is behind a port**

`ProfileRepository` is an abstract class with two methods: `findById` and `save`. The in-memory implementation runs the whole API and test suite with no infrastructure. The Mongo implementation switches on when `MONGODB_URI` is set. The question-selection logic is pure and never sees a database, so it is unit tested in milliseconds.

**Mongoose** is the ODM (the document-world equivalent of an ORM). It gives you a schema and a typed model on top of a schemaless store. `@nestjs/mongoose` wires it into Nest's DI.

## Deep interests: follow-ups, details, and templates

Picking "Sports" is level one. The taxonomy in `api/src/questions/interests.ts` gives each interest two or three **follow-ups**: a `choice` (chips, single or multi) or `text` (free input). Sports asks which sport (multi-choice), which team (text), and fan, player, or both (single choice). The app renders these from `GET /api/interests`, so the questionnaire is data-driven: add a follow-up on the server and it appears in the app.

Answers are stored on the profile as `interestDetails`, keyed by interest id then follow-up id:

```json
{ "sports": { "sport": ["Football"], "team": "Vikings", "involvement": "Watches" },
  "music":  { "genre": ["Jazz", "Folk"], "artist": "Bon Iver" } }
```

The shape varies per profile, which is exactly what a document store is comfortable with. In the Mongoose schema this field is `Mixed` (schemaless); the API validates it on the way in with a custom class-validator decorator (`profiles/dto/interest-details.validator.ts`) that checks every key against the taxonomy and every value against its follow-up's kind. Details for an interest that gets deselected are dropped.

Questions can then use the answers. A template question declares what it needs:

```ts
{ id: 'spo03', text: 'How are the {sports.team} looking right now, honestly?', tags: ['sports'], requires: ['sports.team'] }
```

The selector only considers it when the profile has those answers, and weights it above interest-matched and general questions. `question-template.ts` fills the placeholders at render time; a multi-choice answer contributes one random item per showing, and `{music.genre|lower}` lowercases for mid-sentence use. A unit test walks the whole bank to make sure every placeholder refers to a real follow-up and is declared in `requires`.

## Location: a place name, not a pin

The profile can carry `location: { city, region?, country? }`. The app offers "Use my location", which asks the device for a low-accuracy position and reverse-geocodes it to a city name on the phone; only the name is sent. No coordinates are stored anywhere. The city feeds two things: curated templates that use `{profile.city}` ("anything happening in Minneapolis this month?"), and the AI engine's research step.

There is also an "Around town" interest with follow-ups for a neighborhood, a favorite spot, and a place they keep meaning to try, plus location-flavored follow-ups on other interests (favorite restaurant, local venue, where they watch games, where friends meet).

## The AI question engine

`api/src/ai/` writes questions for one person from everything the profile knows. It is off until `ANTHROPIC_API_KEY` is set, and the app is unchanged either way.

```
profile  ──►  (optional) research: Claude + web search  ──►  brief
                                                               │
profile + brief + liked/hidden history  ──►  generate: Claude, structured JSON  ──►  10 questions
                                                                                        │
                                                            saved on the profile as `generated`
                                                            mixed into every batch at the top weight
                                                            rated and hidden like any other question
```

**Ports and adapters.** `GenerationClient` is an abstract class with two methods, `generateQuestions` and `research`. `AnthropicGenerationClient` is the only file that imports the Anthropic SDK; `NoopGenerationClient` is wired when there is no key. Tests swap in a fake, so the whole loop (generate, select, rate, hide) runs end to end in CI with no network. Spring analogy: an interface with a real and a no-op implementation chosen by configuration.

**Prompting.** The system prompt is stable and marked for prompt caching. The user message carries the profile (name, city, "lately", interests with every follow-up answer), the texts of questions the asker liked and hid, the current deck (to avoid repeats), the research brief if any, and the count. Output is constrained with structured outputs to `{ questions: [{ text, interest, basis }] }`, so there is no parsing of prose. The model is `claude-opus-5-5` by default (`ANTHROPIC_MODEL` overrides) with thinking left adaptive and effort set to medium. The research call enables the server-side refusal fallback so a declined request is retried on a sibling model automatically.

**Research.** With `AI_RESEARCH=true`, a first call gives Claude the web search tool and a brief built from the details: upcoming games for the team, releases or tour dates for the artist, new restaurants of their cuisine in their city, events in town in the coming weeks. The reply is a bulleted brief that the generation call may use "where it fits, without inventing beyond it". The web search tool is told the user's approximate city so results are local. It is off by default because it costs more per refresh.

**When it runs.** `GenerationScheduler` refreshes a deck in the background, one refresh per profile at a time, when the deck is empty, older than seven days, built from different inputs (a hash of name, interests, details, location, and "lately"), or when fewer than three unhidden AI questions remain. Profile create and update trigger it, and so does fetching prompts. `POST /api/profiles/:id/questions/generate` runs it now and waits; the profile screen has a button for that.

**Storage.** The deck lives on the profile document as `generated: { questions, generatedAt, basis }`. AI question ids start with `ai-` and sit in the same `feedback` list as curated ones.

**What "deeper" looks like from here.** The engine already has every lever the roadmap needs: give the research step more to look up (a venue's calendar, the team's schedule), feed thumbs history back as examples, or let the model also propose new follow-up questions for the taxonomy. None of that changes the port.

## Card kinds and modes

Every bank entry has a `kind`: `question` (the default), `appreciation`, `bid`, `dream`, or `stress`. Day mode deals questions and allows at most one appreciation, bid, or dream card per batch, each at a reduced weight so they stay occasional. Evening mode deals only stress and appreciation cards. Dates within three weeks become synthesized questions whose id is the date's id, so they can be rated and hidden like any other. Memories are stored on the profile and the last fifteen go into the AI prompt as "things they have said".

## The question selection algorithm

Lives in `api/src/questions/question-selector.service.ts`. Pure function of the profile, with an injectable random source so tests are deterministic.

1. Drop any question the user hid (thumbs-down).
2. Candidates are questions tagged `general` plus questions matching any of the profile's interests, provided any `requires` are answered in the profile's details.
3. Prefer questions not shown recently. If there are not enough fresh ones, top up with the ones shown longest ago.
4. Weighted random pick: AI-written and detail-driven questions weigh 5, interest-matched 3, general 1, liked ones get +1.
5. Within one batch, avoid two questions about the same interest when there is a choice.

The question bank (`question-bank.ts`) is injected under the `QUESTION_SOURCE` token. Swapping in an LLM-generated or database-backed source later does not touch the selector.

## API contract

All routes are under `/api`. JSON in, JSON out. No auth in the MVP; the profile UUID is the only credential (see `ROADMAP.md`).

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/health` | | `{ status, storage: "memory" \| "mongo", ai: boolean }` |
| GET | `/api/interests` | | `[{ id, label, followUps: [{ id, prompt, kind, options?, multi?, placeholder? }] }]` |
| POST | `/api/profiles` | `{ name, interests[], interestDetails?, currentFocus?, notes? }` | profile |
| GET | `/api/profiles/:id` | | profile |
| PATCH | `/api/profiles/:id` | any subset of the create body | profile |
| GET | `/api/profiles/:id/questions?count=3&mode=day\|evening` | | `{ askName, mode, questions: [{ id, text, interest, source, kind }], nudges: { reviewDetails, upcomingDates } }` |
| GET | `/api/profiles/:id/memories` | | `[{ id, questionId?, questionText?, text, createdAt }]` newest first |
| POST | `/api/profiles/:id/memories` | `{ text, questionId? }` | memory |
| DELETE | `/api/profiles/:id/memories/:memoryId` | | 204 |
| POST | `/api/profiles/:id/questions/:questionId/rating` | `{ score: 1 \| -1 }` | `{ questionId, score, hidden }` |
| POST | `/api/profiles/:id/questions/generate` | | `{ enabled, generated }` |

Profile bodies also accept `location: { city, region?, country? }` (or `null` on PATCH to clear it).

Validation errors return 400 with a list of messages. Unknown ids return 404.

## Running it

```bash
# API (in-memory storage, nothing else needed)
cd api && npm install --legacy-peer-deps && npm run start:dev
#  -> http://localhost:3000/api/health

# App (web in the browser; press i / a in the terminal for iOS simulator / Android emulator)
cd app && npm install --legacy-peer-deps && npm run web
```

To use MongoDB locally: `docker run -d -p 27017:27017 mongo:8`, then copy `api/.env.example` to `api/.env` and uncomment `MONGODB_URI`.

The app finds the API through `EXPO_PUBLIC_API_URL` (defaults to `http://localhost:3000`). On a physical phone, set it to your computer's LAN address.

## Testing

| Layer | Tool | Command |
| --- | --- | --- |
| Selection logic | Vitest unit tests | `cd api && npm test` |
| HTTP end to end, in-memory storage | Vitest + supertest | `cd api && npm run test:e2e` |
| App compiles | xcodebuild on a macOS runner | `cd ios && xcodebuild -scheme YourPerson -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO` |

## Deployment sketch (not built yet)

- **API:** a container on any host (Fly.io, Render, Azure Container Apps, AWS App Runner). `npm run build` produces `dist/`; `node dist/main` runs it. MongoDB Atlas has a free tier.
- **App:** Xcode archives and uploads to TestFlight and the App Store (`docs/NATIVE-BUILDS.md`). The Release build setting `API_BASE_URL` points it at the deployed API.

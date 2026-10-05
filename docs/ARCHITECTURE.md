# Architecture

This document explains what the system is made of and, more importantly, why. It is written for someone comfortable with Java and Spring Boot who is newer to the JavaScript ecosystem and to document databases. Analogies to Spring are deliberate.

## The shape of the system

```
+-------------------------------+        HTTPS / JSON        +---------------------------+
|  app/  (Expo, React Native)   |  ----------------------->  |  api/  (NestJS, Node 22)  |
|  iOS, Android, mobile web     |                            |  REST under /api          |
+-------------------------------+                            +------------+--------------+
                                                                          |
                                                              ProfileRepository (port)
                                                                 /                 \
                                                   InMemoryProfileRepository   MongoProfileRepository
                                                   (dev + tests, no setup)     (MONGODB_URI set)
```

Two deployable units, one repo. The app never talks to the database; it only talks to the API.

## Decision 1: one Expo codebase for iPhone, Android, and web

**Options considered**

| Option | Pros | Cons |
| --- | --- | --- |
| Native Swift + Kotlin + separate web app | Best platform fidelity | Three codebases, three skill sets, three times the work for a simple app |
| Flutter | One codebase, good performance | Dart is yet another language; web output is weaker for text-heavy UIs |
| **Expo (React Native)** | One TypeScript codebase. First-class iOS and Android. Web via `react-native-web`. Huge ecosystem. Expo Application Services (EAS) builds and signs iOS apps in the cloud, so no Mac is required day to day. | Not every native API is available in the Expo Go sandbox; some features need a "development build" |
| Progressive web app only | Simplest | Misses the stated goal of real iPhone and Android apps |

**Decision:** Expo. The app is text and buttons; it needs nothing exotic from the device. One codebase ships to all three targets in the order asked for.

**What to know coming from Java**

- React is a component model. A component is a function that takes `props` (think constructor arguments) and returns UI. State lives in hooks (`useState`, `useEffect`). There are no classes to speak of anymore.
- React Native renders real native widgets (`View` is a `UIView` on iOS, a `ViewGroup` on Android, a `div` on web). Styling uses a subset of CSS expressed as JavaScript objects.
- **Expo Router** is file-based navigation: every file under `src/app/` is a screen, and `_layout.tsx` files define the navigator around them. Think of it like Spring MVC mapping URLs to controllers by convention instead of annotations.
- The app code is heavily commented. Start with `app/src/app/_layout.tsx` and follow the imports.

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

## The question selection algorithm

Lives in `api/src/questions/question-selector.service.ts`. Pure function of the profile, with an injectable random source so tests are deterministic.

1. Drop any question the user hid (thumbs-down).
2. Candidates are questions tagged `general` plus questions matching any of the profile's interests.
3. Prefer questions not shown recently. If there are not enough fresh ones, top up with the ones shown longest ago.
4. Weighted random pick: interest-matched questions weigh 3, general ones 1, liked ones get +1.
5. Within one batch, avoid two questions about the same interest when there is a choice.

The question bank (`question-bank.ts`) is injected under the `QUESTION_SOURCE` token. Swapping in an LLM-generated or database-backed source later does not touch the selector.

## API contract

All routes are under `/api`. JSON in, JSON out. No auth in the MVP; the profile UUID is the only credential (see `ROADMAP.md`).

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/health` | | `{ status, storage: "memory" \| "mongo" }` |
| GET | `/api/interests` | | `[{ id, label }]` |
| POST | `/api/profiles` | `{ name, interests[], currentFocus?, notes? }` | profile |
| GET | `/api/profiles/:id` | | profile |
| PATCH | `/api/profiles/:id` | any subset of the create body | profile |
| GET | `/api/profiles/:id/questions?count=3` | | `{ askName, questions: [{ id, text, interest }] }` |
| POST | `/api/profiles/:id/questions/:questionId/rating` | `{ score: 1 \| -1 }` | `{ questionId, score, hidden }` |

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
| App type safety | TypeScript | `cd app && npm run typecheck` |
| App builds for web | Expo export | `cd app && npm run export:web` |

## Deployment sketch (not built yet)

- **API:** a container on any host (Fly.io, Render, Azure Container Apps, AWS App Runner). `npm run build` produces `dist/`; `node dist/main` runs it. MongoDB Atlas has a free tier.
- **App:** EAS Build produces the iOS and Android binaries and EAS Submit pushes them to TestFlight and the Play Console. The web build is static files from `expo export --platform web`, hostable anywhere.

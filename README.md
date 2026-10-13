# Your Person

An app that helps couples stay curious about each other. You fill in a short profile of your person, and the app hands you a couple of simple questions that get a real conversation going. Rate questions with a thumb to shape what you see next.

iPhone only, built natively in Swift and SwiftUI. The API is shared with nothing else, so it stays small.

## Repository layout

```
your-person/
├── ios/    SwiftUI iPhone app (Xcode project, no dependencies)
├── api/    NestJS (TypeScript) REST API with MongoDB or in-memory storage
└── docs/   Product brief, architecture and decisions, roadmap
```

Start with [`docs/PRODUCT.md`](docs/PRODUCT.md) for what we are building and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how and why, written with Spring Boot analogies throughout.

## Quick start

You need Node 22+ for the API and Xcode 16+ for the app. No database is required; the API uses in-memory storage until you give it a `MONGODB_URI`.

**Terminal: the API**

```bash
cd api
npm install --legacy-peer-deps
npm run start:dev
# http://localhost:3000/api/health  ->  {"status":"ok","storage":"memory"}
```

**Xcode: the app**

Open `ios/YourPerson.xcodeproj`, pick an iPhone simulator, press Run. The Debug build talks to `http://localhost:3000`.

On your own iPhone, the app cannot reach `localhost`. Set the `API_BASE_URL` build setting (target YourPerson, Build Settings, User-Defined) to your computer's LAN address, `http://192.168.1.23:3000` for example, select your phone as the destination, and Run. [`docs/NATIVE-BUILDS.md`](docs/NATIVE-BUILDS.md) walks through signing and TestFlight.

**AI questions.** Set `ANTHROPIC_API_KEY` in `api/.env` and the API starts writing a personalized deck per profile with Claude. Add `AI_RESEARCH=true` to let it web-search for timely local facts first. Without a key everything runs on the curated bank. See `docs/ARCHITECTURE.md`, "The AI question engine".

## Deploying

The API ships as a Docker image with configs for Fly.io (`api/fly.toml`) and Render (`render.yaml`). [`docs/DEPLOY.md`](docs/DEPLOY.md) walks through MongoDB Atlas and either host in about half an hour. [`docs/NATIVE-BUILDS.md`](docs/NATIVE-BUILDS.md) covers getting the app onto your phone and into TestFlight.

## Checks

```bash
cd api && npm run lint && npm test && npm run test:e2e && npm run build
cd ios && xcodebuild -scheme YourPerson -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO
```

CI runs both: the API on Linux, the app on a macOS runner.

## The look

The UI takes its shape from grug: one colour, handwritten type, and the question of the moment writes itself across the screen, with a soft haptic tick as each word starts. The hand is Allura, a romantic script by Rob Leuschke, traced as pen strokes (EMS Allure) by Sheldon B. Michaels and Windell H. Oskay; both under the SIL Open Font License. It is drawn with SwiftUI's Canvas and nothing else; `docs/ARCHITECTURE.md`, "The handwriting engine", explains how.

## Why `--legacy-peer-deps`

npm 10.9 currently crashes while resolving an optional peer of vitest 5. The flag skips that step and installs the pinned versions fine. See `docs/ROADMAP.md`, "Known debt".

# Your Person

An app that helps couples stay curious about each other. You fill in a short profile of your person, and the app hands you a couple of simple questions that get a real conversation going. Rate questions with a thumb to shape what you see next.

Targets, in order: iPhone, Android, mobile web. One codebase for all three.

## Repository layout

```
your-person/
├── app/    Expo (React Native + TypeScript) app for iOS, Android, and web
├── api/    NestJS (TypeScript) REST API with MongoDB or in-memory storage
└── docs/   Product brief, architecture and decisions, roadmap
```

Start with [`docs/PRODUCT.md`](docs/PRODUCT.md) for what we are building and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how and why, written with Spring Boot analogies throughout.

## Quick start

You need Node 22+. No database is required; the API uses in-memory storage until you give it a `MONGODB_URI`.

**Terminal 1: the API**

```bash
cd api
npm install --legacy-peer-deps
npm run start:dev
# http://localhost:3000/api/health  ->  {"status":"ok","storage":"memory"}
```

**Terminal 2: the app**

```bash
cd app
npm install --legacy-peer-deps
npm run web          # opens in the browser
# or: npm start      # then press i (iOS simulator), a (Android emulator), or scan the QR with Expo Go
```

On a physical phone, the app cannot reach `localhost`. Copy `app/.env.example` to `app/.env` and set `EXPO_PUBLIC_API_URL` to your computer's LAN address.

## Checks

```bash
cd api && npm run lint && npm test && npm run test:e2e && npm run build
cd app && npm run typecheck && npm run export:web
```

## Why `--legacy-peer-deps`

npm 10.9 currently crashes while resolving an optional peer of vitest 5. The flag skips that step and installs the pinned versions fine. See `docs/ROADMAP.md`, "Known debt".

# Your Person API

NestJS + TypeScript REST API. See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for the design, the Spring Boot rosetta stone, and the full endpoint table.

```bash
npm install --legacy-peer-deps
npm run start:dev        # http://localhost:3000/api/health

npm run lint             # oxlint
npm test                 # unit tests (vitest)
npm run test:e2e         # HTTP tests against in-memory storage
npm run build            # compiles to dist/
```

Storage is in-memory unless `MONGODB_URI` is set. Copy `.env.example` to `.env` to configure.

## Where things are

```
src/
├── main.ts                     bootstrap: /api prefix, validation, CORS
├── app.module.ts               root module
├── persistence/                picks in-memory vs MongoDB at startup
├── profiles/                   partner profile: model, repository port + impls, DTOs, service, controller
├── questions/                  interests taxonomy, curated question bank, selection algorithm, prompts + rating endpoints
└── health/                     GET /api/health
test/app.e2e-spec.ts            end-to-end HTTP tests
```

# Deploying the API

A phone cannot reach `localhost`, so a real iPhone build needs the API on the public internet. This is the shortest path. Budget about half an hour the first time, and under 10 USD a month after.

## 1. A database: MongoDB Atlas (free tier)

1. Create an account at mongodb.com/atlas and a free M0 cluster in a region near you (for Minnesota, AWS us-east-2 or GCP us-central1).
2. Database Access: add a user with a strong password.
3. Network Access: allow `0.0.0.0/0` for now (the hosting providers below use changing IPs). Tighten later.
4. Connect, Drivers: copy the connection string. It looks like `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/your-person?retryWrites=true&w=majority`. Put the database name `your-person` after the host as shown.

That string is `MONGODB_URI`. Keep it out of git.

## 2. A host for the API: pick one

### Fly.io (recommended: cheapest, scales to zero)

```bash
# once
curl -L https://fly.io/install.sh | sh
fly auth signup            # or fly auth login

cd api
fly launch --no-deploy --copy-config    # uses api/fly.toml; pick a free app name when asked
fly secrets set MONGODB_URI="mongodb+srv://..."
# optional: fly secrets set ANTHROPIC_API_KEY="sk-ant-..." AI_RESEARCH=true
fly deploy
```

`fly deploy` builds the Dockerfile on Fly's builders and starts one small machine. The API is then at `https://<app-name>.fly.dev/api/health`, which should return `{"status":"ok","storage":"mongo","ai":false}`. The machine stops when idle and restarts on the first request, so the first call after a quiet spell takes a second or two.

Later deploys are just `fly deploy` from `api/`.

### Render (no CLI, click-through)

1. In the Render dashboard, New, Blueprint, connect the GitHub repo. It reads `render.yaml`.
2. After the service exists, set `MONGODB_URI` (and optionally `ANTHROPIC_API_KEY`) under Environment.
3. Every push to the default branch redeploys.

The starter plan does not sleep; the free plan does, with a cold start of around 30 seconds.

### Anything that runs a container

The `api/Dockerfile` is plain: `docker build -t your-person-api api && docker run -p 3000:3000 -e MONGODB_URI=... your-person-api`. Azure Container Apps, AWS App Runner, Google Cloud Run all take it as is. Set `PORT` if the platform expects a different port.

## 3. Point the app at it

- For Expo Go and simulators: `app/.env` with `EXPO_PUBLIC_API_URL=https://<your-host>`.
- For EAS builds: replace `https://REPLACE-WITH-YOUR-API-HOST` in `app/eas.json` under the `preview` and `production` profiles.
- Then `npx expo start` or `eas build` as usual.

## What is in place for production

- The Docker image is two-stage, runs as a non-root user, and holds only compiled output and production dependencies.
- `GET /api/health` reports storage and AI status and is used as the health check.
- Rate limiting: 60 requests per minute per client IP, with `trust proxy` so the limit applies to the real client behind the host's load balancer.
- CORS is open by default; set `CORS_ORIGIN=https://your-web-host` to narrow it once the web build has a home.
- No authentication yet. The profile UUID is the only credential, so do not share profile links. Accounts are phase 2 in `ROADMAP.md`.

## Rollback

Fly: `fly releases` then `fly releases rollback <version>`. Render: Deploys tab, Rollback. The database schema is additive, so old builds read new data fine.

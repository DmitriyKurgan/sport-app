# Deploy guide — Backend on Render, Frontend on Vercel

This setup gives you a production deployment on the free tier of both services.

| Component | Where | Cost |
|-----------|-------|------|
| API (NestJS) | Render Web Service (Docker) | Free (sleeps after 15 min idle) |
| PostgreSQL | Render managed DB | Free (90 days, then paid) |
| Frontend (Next.js) | Vercel | Free (Hobby tier) |
| Redis (optional) | Upstash | Free (10k commands/day) |

> The free Render plan **sleeps the API after 15 minutes of inactivity** — first request after idle takes ~30 seconds. Upgrade to Starter ($7/mo) to keep it always-on.

---

## Prerequisites

1. Push the repo to GitHub.
2. Accounts on [render.com](https://render.com) and [vercel.com](https://vercel.com) (sign in with GitHub for the easiest setup).

---

## Step 1 — Deploy the API on Render

The repo includes [`render.yaml`](render.yaml) — a Blueprint that provisions the web service.

> **Render free tier allows only one PostgreSQL database per account.** The Blueprint does **not** create a new DB — you connect an existing one (or create one separately first).

### 1.1. Create (or reuse) a free PostgreSQL on Render

If you don't have one yet:

- Render Dashboard → **New +** → **PostgreSQL** → name `fittrack-db`, plan **Free**, version **15**, region **Frankfurt** → Create.
- Wait ~1 min until status becomes **Available**.

Then open the database → **Connect** → copy the **Internal Database URL** (looks like `postgres://fittrack:<password>@dpg-xxx-a/fittrack`).

### 1.2. Deploy the API

1. Render Dashboard → **New +** → **Blueprint** → pick this repo.
2. Render reads `render.yaml`, shows **fittrack-api**. Click **Apply**.
3. The build will start; the first one fails because `DATABASE_URL` and `CORS_ORIGIN` are not set yet. That's expected.
4. Open **fittrack-api → Environment** and set:
   - `DATABASE_URL` = Internal Database URL from step 1.1
   - `CORS_ORIGIN` = your Vercel URL (set later, you can use a placeholder for now)
5. The service redeploys automatically; wait ~3 min.
6. Copy the public URL (e.g. `https://fittrack-api.onrender.com`).

What `render.yaml` configures automatically:

- Builds the API image from `fittrack-api/Dockerfile`.
- Generates random `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- Sets `REDIS_ENABLED=false` (the app falls back to in-memory cache, no Bull queues).
- Health check: `GET /health` (Render restarts the service if it stops responding).

### Smoke-test the API

```bash
curl https://fittrack-api.onrender.com/health
# → {"status":"ok","uptimeSeconds":12}

curl https://fittrack-api.onrender.com/api/v1/screening/questions
# → {"questions":[...]}
```

---

## Step 2 — Deploy the Frontend on Vercel

1. Vercel Dashboard → **Add New** → **Project**.
2. Import the GitHub repo.
3. **Important — set Root Directory** to `fittrack-web`. Vercel auto-detects Next.js.
4. Under **Environment Variables** add:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_API_URL` | `https://fittrack-api.onrender.com` | Production, Preview, Development |

5. Click **Deploy**. First build takes ~2 min.
6. Once green, you get a URL like `https://fittrack-xxx.vercel.app`.

### Allow the Vercel domain in CORS

Go to Render → fittrack-api → **Environment** → add:

```
CORS_ORIGIN = https://fittrack-xxx.vercel.app
```

Render will redeploy automatically. Without this, the browser will block API calls from your Vercel domain.

---

## Step 3 (optional) — Add Upstash Redis to enable Bull queues and caching

The app runs fine without Redis (background jobs and Redis-backed caching are disabled, everything else works). Add Redis if you need:

- Cron-scheduled background jobs (weekly report generation, alert detection).
- Cross-instance distributed cache (only matters when you scale to >1 API instance).

Steps:

1. [console.upstash.com](https://console.upstash.com) → **Create Database** → choose Frankfurt region (matches Render).
2. Open the database → copy `Endpoint`, `Port`, `Password`.
3. Render → fittrack-api → **Environment** → set:

   ```
   REDIS_ENABLED = true
   REDIS_HOST    = <Upstash endpoint, without https://>
   REDIS_PORT    = <Upstash port, usually 6379>
   REDIS_PASSWORD = <Upstash password>
   ```

4. The service will redeploy and now run `JobsModule` + Redis cache.

---

## Step 4 — Custom domain (optional)

- **Frontend**: Vercel → Project → **Domains** → add your domain. Vercel provisions a free Let's Encrypt cert.
- **Backend**: Render → fittrack-api → **Settings → Custom Domain**. Update `NEXT_PUBLIC_API_URL` on Vercel to match (e.g. `https://api.example.com`) and `CORS_ORIGIN` on Render to your frontend domain.

---

## Updating

Both services are wired to auto-deploy on every push to `main`:

```bash
git push origin main
```

- Render rebuilds the Docker image and reapplies migrations on startup (`scripts/start-production.sh`).
- Vercel rebuilds the Next.js app and switches traffic.

Roll back by clicking **Rollback** on the previous deploy in either dashboard.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Vercel build fails with `NEXT_PUBLIC_API_URL is not defined` | Add it under Environment Variables for **all environments** (Production, Preview, Development). |
| Browser shows CORS error | `CORS_ORIGIN` on Render must match the exact Vercel URL (including `https://`). |
| Frontend works but `Network Error` on every request | Render service is sleeping. First request wakes it (~30s). Upgrade plan or hit `/health` from a cron-pinger. |
| API returns 500 with `password authentication failed` | Database wasn't ready when migration ran. Render → fittrack-api → **Manual Deploy** to retry. |
| `migration:run` crash on cold start | Check Render logs — usually a missing env var. The startup script (`scripts/start-production.sh`) waits for PG before running migrations. |
| Render: `cannot have more than one active free tier database` | Free tier allows one PG per account. Reuse it — see Step 1.1; the Blueprint doesn't create a new DB. |
| Render: `no pg_hba.conf entry ... no encryption` | The app auto-enables SSL when `NODE_ENV=production`. If you still see this, ensure `NODE_ENV=production` is set on the service. |
| Need to seed/inspect DB | Render → fittrack-db → **Connect** → use the External `psql` URL. |

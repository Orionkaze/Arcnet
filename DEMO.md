# Caliber — Run the demo

Everything below runs the full Caliber app locally with a pre-seeded dataset you can log into.

## 1. A Postgres database

Any Postgres works. Fastest via Docker:

```bash
docker run --name caliber-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=caliber -p 5432:5432 -d postgres:16
```

(Or use a local install, or a free hosted DB like Neon/Supabase.)

## 2. Environment

Create `frontend/.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/caliber?schema=public"
JWT_SECRET="dev-only-change-me"          # required — the app refuses to boot in prod without it
# INTERNAL_BROADCAST_SECRET="dev-secret" # only needed for real-time DMs/pins
# REDIS_URL="redis://localhost:6379"     # optional — distributed rate limiting (falls back to in-memory)
```

## 3. Install, migrate, seed

```bash
cd frontend
npm install
npm run db:setup     # runs prisma migrate + seeds the demo dataset
npm run dev
```

Open the dev URL (http://localhost:3000). `/` redirects to `/caliber`.

## 4. Demo logins

All three users share the password **`caliber1234`**:

| Email | Username |
|---|---|
| `demo@caliber.dev` | demo |
| `arjun@caliber.dev` | arjun |
| `sara@caliber.dev` | sara |

## 5. What to try (a 2-minute tour as `demo`)

- **`/caliber`** — practice tracks (Guesstimates, Finance, Aptitude). Open a guesstimate, submit a number → instant score + feedback + a rating delta.
- **`/caliber/me`** — your credential: per-track ratings, rating history, and a scored peer-reviewed case.
- **`/caliber/competitions/weekly-guesstimate-league`** — a **live** competition with a ranked leaderboard (includes a tie broken by earliest submission).
- **`/caliber/reviews`** — the peer-review inbox (log in as `arjun`/`sara` to review `demo`'s open submission).
- **`/messages`** — a seeded DM conversation. **`/notifications`** — a seeded notification.

## Reset the data

```bash
cd frontend && npm run db:reset   # drops, re-migrates, and re-seeds
```

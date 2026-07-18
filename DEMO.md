# Caliber — run the demo (one command, zero setup)

No Postgres install, no Docker, no config. This launches the **entire platform** —
ArcNet's community shell, re-themed as Caliber, with the practice/rating engine
wired in — against an embedded database that lives only on your machine.

```bash
cd frontend
npm install
npm run demo
```

That's it. On first run it automatically:
1. Boots an embedded Postgres (in-process, file-backed, real wire protocol — no server to install)
2. Pushes the Prisma schema
3. Seeds a demo dataset
4. Starts the Next.js dev server

Open **http://localhost:3000**.

## Demo logins

All three share the password **`caliber1234`**:

| Email | Username |
|---|---|
| `demo@caliber.dev` | demo |
| `arjun@caliber.dev` | arjun |
| `sara@caliber.dev` | sara |

## What to try (as `demo`)

- **`/caliber`** — practice tracks (Guesstimates, Finance & Valuation, Consulting Cases, Aptitude & DI). Open a problem, submit an answer → instant score, feedback, and a live rating change.
- **`/caliber/me`** — your credential: per-track ratings + a scored peer-reviewed case.
- **`/caliber/competitions/weekly-guesstimate-league`** — a live competition with a ranked leaderboard (includes a tie, broken by earliest submission).
- **`/caliber/reviews`** — the peer-review inbox (log in as `arjun` or `sara` to review `demo`'s open submission).
- **The rest of the ArcNet shell** — `/hub/consulting`, `/hub/finance`, etc. (re-themed community hubs), `/ecosystem/mentors`, `/ecosystem/jobs`, `/messages` (a seeded DM), `/notifications` (a seeded notification).

## Re-run / reset

`npm run demo` is idempotent — it detects existing data and skips reseeding. To start fresh:

```bash
rm -rf ../.pglite-data
npm run demo
```

## How this works (for the curious)

`npm run demo` runs `scripts/demo.mjs`, which:
- Spawns `scripts/pglite-server.mjs` — an [`@electric-sql/pglite`](https://pglite.dev) instance (Postgres compiled to WASM, running in-process) bridged to the real Postgres wire protocol via `@electric-sql/pglite-socket`, listening on `127.0.0.1:5433`. Its data directory (`../.pglite-data`) is deliberately kept **outside** `frontend/` so Next's dev file-watcher never sees its writes.
- Waits for it to accept connections, then runs `prisma db push` + the seed script against it.
- Starts `next dev` with `DATABASE_URL` pointed at the embedded instance and `DB_POOL_MAX=1` (PGlite serves one connection at a time, so the app's connection pool is capped to match).

This is a **local demo/dev convenience**, not a production database. For a real deployment, point `DATABASE_URL` at an actual Postgres instance (see `.env` in `frontend/`) and skip `npm run demo` in favor of `npm run build && npm start`.

## If you'd rather use a real Postgres

```bash
# frontend/.env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="something-random"

cd frontend
npm install
npm run db:setup   # migrate + seed
npm run dev
```

# Caliber — Design Doc

**Date:** 2026-07-18
**Status:** Approved for spec review
**Working repo:** `Orionkaze/Arcnet` (re-theme in place; see Open Items — repo ownership)
**Supersedes:** ArcNet ("India-First AVGC / gaming community")

---

## 1. Product definition

**Caliber is a skill-rating arena for early-career students.** You practice real analytical problems, get **instant, structured feedback**, and earn a **portable rating** that proves your ability to recruiters.

One-liner positioning: **Unstop lists opportunities; Caliber builds and certifies ability.**

- **Audience:** students / early-career (aspiring analysts, consultants, PMs, finance, data). Broad analytical-skill tracks, but go-to-market stays focused (launch behind one flagship track/league).
- **Brand:** standalone consumer brand. Conyso is an **implicit** link (shared deterministic-engine ethos, quiet tech provider, future cross-promotion with Arena/Almaprep), never front-and-center.

## 2. Why this wins (the wedge)

Unstop (the incumbent) is an **events marketplace**: list → register → compete → rank → forgotten. It does not help you *get better*, gives no feedback, and its profiles show *participation*, not *ability*.

Caliber attacks that gap with a **training + rating engine**:

- **Instant, objective evaluation at scale** — only possible with deterministic scoring engines, which is Conyso's DNA and a listings company structurally cannot copy.
- **A portable rating as a verified credential** — the flywheel Unstop's participation badges never earn: once recruiters trust the rating, students *must* be here.
- **Single-player value from minute one** — a rising rating and real feedback are useful with zero other users, which nullifies the community cold-start problem. Peers, competitions, and recruiters are network-effect layers on top, not prerequisites.

## 3. The core loop (the differentiator)

```
pick a track → solve an auto-evaluated problem → instant structured feedback
   → per-track rating updates (Elo) → credential profile reflects it → repeat
```

- **Auto-scored quant first:** guesstimates (structured rubric + numeric-range tolerance), finance/valuation (numeric answers), aptitude / data-interpretation, data problems.
- **Rating = per-track, difficulty-weighted** (specific algorithm — Elo vs Glicko-2 — resolved in the rating-service spec; see Open Items), plus a headline composite. Problems carry difficulty ratings; solving harder problems moves the rating more (Codeforces/LeetCode-style). Rating history is retained.
- **Open-ended tracks later:** case cracking, product teardown, pitches — evaluated via structured rubric + peer review and/or AI feedback once there is a user base to peer-review.

## 4. Architecture — reuse vs. new

A large share of the (already hardened) plumbing carries over. The net-new work is the engine, rating, and practice/competition surfaces.

| Reuse (built + security-hardened) | Build new |
|---|---|
| Auth, sessions, JWT + revocation, rate limiting, CSP/headers | **Problem bank**: authoring, difficulty, answer keys / rubrics, per-track taxonomy |
| Profile page → **credential page** (rating, history, verified work) | **Evaluation engine**: deterministic scorers per problem type (numeric-range, structured guesstimate rubric, MCQ/DI, data) |
| Feed, Hubs → **skill tracks** | **Rating system**: per-track Elo, difficulty-weighted updates, history |
| DMs, notifications, real-time (Socket.io) | **Practice UI**: solve → submit → feedback → rating delta |
| Teams | **Competitions / Leagues**: timed problem sets, live leaderboard |
| Jobs board shell | **Recruiter rating-search** (supply side) |

### Data model additions (Prisma, indicative)
- `Track` (replaces/renames Hub taxonomy): slug, name, kind (`quant` | `open`), description.
- `Problem`: trackId, type (`numeric` | `guesstimate` | `mcq` | `data` | `open`), prompt, difficulty (rating), answer key / rubric (JSON), authorId, status.
- `Submission`: problemId, userId, payload (answer), score, feedback (JSON), evaluatedAt, competitionId?.
- `Rating`: userId, trackId, value, deviation?, updatedAt; `RatingHistory` rows per change.
- `Competition`: trackId(s), window (start/end), problem set, visibility; `LeaderboardEntry` derived.
- Existing `User`, `Conversation`/`DirectMessage`, `Notification`, `Post`/feed carry forward.

### Module boundaries (each independently testable)
1. **Evaluation engine** — pure functions: `(problem, submission) → { score, feedback }`. No IO, deterministic, unit-testable in isolation. This is the crown jewel; it must be a clean library, not tangled into routes.
2. **Rating service** — pure rating update (Elo or Glicko-2, decided in its spec): `(rating, difficulty, outcome) → newRating`. Isolated + testable.
3. **Problem bank / authoring** — CRUD + validation of answer keys.
4. **Practice surface** — UI + API orchestrating engine + rating + persistence.
5. **Competitions** — scheduling, timed sets, leaderboard aggregation.
6. **Community/tracks, mentors, jobs** — re-themed existing surfaces + supply-side additions.

## 5. Build order (decomposition of "full app")

Each layer stands up and is testable before the next; the full app is the destination, built in strata rather than a big-bang.

1. **Foundation / re-theme** — rename Hub→Track, GameJam→League; strip gaming copy/art; Profile→Credential shell; Caliber brand/design pass.
2. **Practice engine (the moat)** — problem bank + deterministic scorers + rating + practice UI for the first quant track (Guesstimates), then Finance, Aptitude, Data.
3. **Competitions / Leagues** — timed sets + live leaderboards (viral peak + event-led seeding).
4. **Open-ended evaluation** — rubric + peer/AI review for case/pitch tracks.
5. **Supply side** — mentors (top-rated seniors) + recruiter rating-search / jobs.

Each module gets its own detailed spec + implementation plan at build time; this document is the master design and module map.

## 6. Success criteria

- A student can, solo, solve auto-evaluated problems across ≥1 quant track and watch a per-track rating move with difficulty-weighted, deterministic, instant feedback.
- The credential page renders a rating a third party could interpret.
- Competitions run end-to-end on-platform (register → timed set → leaderboard → result).
- The evaluation engine and rating service are isolated, deterministic, and unit-tested.
- Re-themed surfaces contain zero gaming-specific copy/art.

## 7. Out of scope (YAGNI, at least initially)

- Human live proctoring of practice.
- Paid coaching marketplace mechanics (mentor payments) — mentors as discovery first.
- Company-hosted branded competitions (Unstop's model) — we run our own first.
- Mobile apps (responsive web only).
- LLM-based scoring for quant tracks (deterministic is the point); AI feedback is reserved for open-ended tracks, later.

## 7a. Credential integrity (load-bearing — resolve in module specs)

The wedge is a rating recruiters *trust*, so integrity is not optional even though live proctoring is out of scope. Named here so the problem-bank and competitions specs address it explicitly rather than by omission:

- **Answer keys / rubrics are server-only** — never sent to the client; evaluation happens server-side.
- **Per-user / randomized problem selection** — draw from a large bank so a leaked problem doesn't compromise a rating; competitions issue per-user or shuffled sets.
- **Submission abuse** — reuse existing per-user rate limiting; cap rating gain velocity; retire over-exposed problems.
- **Multi-account / farming detection** — deferred (named, not built): rating only becomes a *recruiter-facing* credential once basic abuse signals exist. Until then, rating is a self-improvement signal.

This is a concern list for downstream specs, not a v1 build item.

## 8. Open items

**Resolved:**
1. **Repo** — ✅ stay in `Orionkaze/Arcnet`, re-theme in place (owner's decision to build Caliber here). Pushes still explicit/on-request.
4. **Flagship track** — ✅ **Guesstimate** is the launch anchor (assets exist; cleanest deterministic eval; viral league format). Full-app scope (all quant tracks + open-ended eval + competitions + mentors + jobs + community) is unchanged — the flagship is GTM focus, not a scope limit.

**Still open (deferred to module specs, non-blocking):**
2. **Depth of the Conyso link** — how (if at all) the deterministic engines are surfaced/credited.
3. **Rating model specifics** — Elo vs Glicko-2 (deviation/confidence); composite formula across tracks — decided in the rating-service spec.

## 9. Migration note

Re-theme happens **in place**: rename entities (Hub→Track, GameJam→League), replace copy/art, and *add* the engine. Auth, DMs, notifications, real-time, and all prior security hardening are retained unchanged. A Prisma migration introduces the new tables (`Problem`, `Submission`, `Rating`, `Competition`, …) alongside renamed ones.

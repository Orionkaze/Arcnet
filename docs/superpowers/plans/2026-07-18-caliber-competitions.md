# Caliber Competitions / Leagues — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Timed competitions — a set of problems open for a window; participants join, submit during the window, and appear on a live leaderboard ranked by score (ties broken by earliest last-scoring submission).

**Architecture:** Pure helpers (`competitionState`, `rankLeaderboard`) are TDD'd. Competition scoring **reuses the Module-1 `evaluate()`** but is kept SEPARATE from practice rating (competitions are events; they never move a user's practice rating — no double-dipping). Prisma models + window-gated routes + standalone `/caliber/competitions/*` UI are build-verified (no live DB here).

**Tech Stack:** TypeScript, Prisma, Next.js, Vitest. Reuses `evaluate()` (`@/lib/caliber/evaluation`), `toEngineProblem` (`@/lib/caliber/domain/mapProblem`), the `caliber.module.css` pattern.

**Module 5 of the Caliber roadmap** (spec: `docs/superpowers/specs/2026-07-18-caliber-pivot-design.md`).

**Time note:** route/UI code must NOT call `Date.now()`/`new Date()` at module scope; only inside handlers/effects (fine at runtime). Pure helpers receive `now` as a parameter so they stay deterministic and testable.

---

## File Structure

- `frontend/src/lib/caliber/domain/competition.ts` — pure: `competitionState(now, startsAt, endsAt)`, `rankLeaderboard(rows)`. (+ test)
- `frontend/prisma/schema.prisma` — add `CaliberCompetition`, `CaliberCompetitionProblem`, `CaliberCompetitionEntry`, `CaliberCompetitionSubmission` + User relation.
- `frontend/src/app/api/caliber/competitions/route.ts` — GET list.
- `frontend/src/app/api/caliber/competitions/[slug]/route.ts` — GET detail (+ problems, public shape).
- `frontend/src/app/api/caliber/competitions/[slug]/join/route.ts` — POST join.
- `frontend/src/app/api/caliber/competitions/[slug]/problems/[id]/submit/route.ts` — POST submit (window-gated).
- `frontend/src/app/api/caliber/competitions/[slug]/leaderboard/route.ts` — GET ranked.
- `frontend/src/app/caliber/competitions/page.tsx` — list UI.
- `frontend/src/app/caliber/competitions/[slug]/page.tsx` — detail UI (join, problems, leaderboard).

Paths relative to `/Users/vivek/Arcnet`; run from `cd /Users/vivek/Arcnet/frontend`.

---

## Chunk 1: Pure helpers (TDD)

### Task 1: `competitionState` + `rankLeaderboard`

**Files:**
- Create: `frontend/src/lib/caliber/domain/competition.ts`
- Test: `frontend/src/lib/caliber/domain/competition.test.ts`

`competitionState`: `now < start` → "upcoming"; `start <= now <= end` → "live"; else "ended". `rankLeaderboard`: sort by `score` desc, tie-break by `lastAt` asc (earlier wins), assign 1-based `rank` with equal (score,lastAt) sharing a rank via standard competition ranking (1,2,2,4).

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { competitionState, rankLeaderboard } from "./competition";

describe("competitionState", () => {
  const s = 1000, e = 2000;
  it("upcoming before start", () => expect(competitionState(500, s, e)).toBe("upcoming"));
  it("live within window (inclusive)", () => {
    expect(competitionState(1000, s, e)).toBe("live");
    expect(competitionState(1500, s, e)).toBe("live");
    expect(competitionState(2000, s, e)).toBe("live");
  });
  it("ended after end", () => expect(competitionState(2001, s, e)).toBe("ended"));
});

describe("rankLeaderboard", () => {
  it("orders by score desc then lastAt asc, with competition ranking", () => {
    const out = rankLeaderboard([
      { userId: "a", score: 50, lastAt: 10 },
      { userId: "b", score: 80, lastAt: 30 },
      { userId: "c", score: 80, lastAt: 20 },
      { userId: "d", score: 50, lastAt: 5 },
    ]);
    expect(out.map((r) => r.userId)).toEqual(["c", "b", "d", "a"]);
    expect(out.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });
  it("shares a rank on identical score+lastAt (1,2,2,4)", () => {
    const out = rankLeaderboard([
      { userId: "a", score: 100, lastAt: 5 },
      { userId: "b", score: 90, lastAt: 5 },
      { userId: "c", score: 90, lastAt: 5 },
      { userId: "d", score: 80, lastAt: 5 },
    ]);
    expect(out.map((r) => r.rank)).toEqual([1, 2, 2, 4]);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd frontend && npm run test:run -- src/lib/caliber/domain/competition.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
export type CompetitionState = "upcoming" | "live" | "ended";

export function competitionState(now: number, startsAt: number, endsAt: number): CompetitionState {
  if (now < startsAt) return "upcoming";
  if (now <= endsAt) return "live";
  return "ended";
}

export interface LeaderboardRow { userId: string; score: number; lastAt: number; }
export interface RankedRow extends LeaderboardRow { rank: number; }

export function rankLeaderboard(rows: LeaderboardRow[]): RankedRow[] {
  const sorted = [...rows].sort((a, b) => (b.score - a.score) || (a.lastAt - b.lastAt));
  const ranked: RankedRow[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const tied = prev && prev.score === cur.score && prev.lastAt === cur.lastAt;
    ranked.push({ ...cur, rank: tied ? ranked[i - 1].rank : i + 1 });
  }
  return ranked;
}
```

- [ ] **Step 4: Run — expect PASS + full suite**

Run: `cd frontend && npm run test:run`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/caliber/domain/competition.ts frontend/src/lib/caliber/domain/competition.test.ts
git commit -m "feat(caliber): competition state + leaderboard ranking (pure)"
```

---

## Chunk 2: Prisma models (build-verified)

### Task 2: Competition models

**Files:**
- Modify: `frontend/prisma/schema.prisma`

- [ ] **Step 1: Add models** (cuid ids, alongside the other Caliber models)

```prisma
model CaliberCompetition {
  id          String                       @id @default(cuid())
  slug        String                       @unique
  name        String
  description String
  startsAt    DateTime
  endsAt      DateTime
  problems    CaliberCompetitionProblem[]
  entries     CaliberCompetitionEntry[]
  submissions CaliberCompetitionSubmission[]
  createdAt   DateTime                     @default(now())
}

model CaliberCompetitionProblem {
  id            String             @id @default(cuid())
  competitionId String
  competition   CaliberCompetition @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  problemId     String
  order         Int                @default(0)
  @@unique([competitionId, problemId])
  @@index([competitionId])
}

model CaliberCompetitionEntry {
  id            String             @id @default(cuid())
  competitionId String
  competition   CaliberCompetition @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  userId        String
  user          User               @relation("CaliberCompEntries", fields: [userId], references: [id], onDelete: Cascade)
  totalScore    Int                @default(0)
  lastScoredAt  DateTime?
  joinedAt      DateTime           @default(now())
  @@unique([competitionId, userId])
  @@index([competitionId])
}

model CaliberCompetitionSubmission {
  id            String             @id @default(cuid())
  competitionId String
  competition   CaliberCompetition @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  problemId     String
  userId        String
  value         Float
  score         Int
  createdAt     DateTime           @default(now())
  @@unique([competitionId, problemId, userId])
  @@index([competitionId, userId])
}
```

- [ ] **Step 2: Add User relation** (inside `User`, near `caliberRatings`)

```prisma
  caliberCompEntries CaliberCompetitionEntry[] @relation("CaliberCompEntries")
```

- [ ] **Step 3: Generate**

Run: `cd frontend && npx prisma generate`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add frontend/prisma/schema.prisma
git commit -m "feat(caliber): competition prisma models"
```

> `CaliberCompetitionSubmission` has `@@unique([competitionId, problemId, userId])` — one scored submission per problem per user per competition (first-answer-counts within a competition). `totalScore`/`lastScoredAt` on the entry are the denormalized leaderboard inputs.

---

## Chunk 3: Routes (build-verified)

### Task 3: List + detail

**Files:**
- Create: `frontend/src/app/api/caliber/competitions/route.ts`
- Create: `frontend/src/app/api/caliber/competitions/[slug]/route.ts`

- [ ] **Step 1: Implement list** (`competitions/route.ts`)

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { competitionState } from "@/lib/caliber/domain/competition";

export async function GET() {
  try {
    const now = Date.now();
    const rows = await prisma.caliberCompetition.findMany({
      orderBy: { startsAt: "desc" },
      select: { id: true, slug: true, name: true, description: true, startsAt: true, endsAt: true },
    });
    const competitions = rows.map((c) => ({
      ...c,
      state: competitionState(now, c.startsAt.getTime(), c.endsAt.getTime()),
    }));
    return NextResponse.json({ competitions });
  } catch (error) {
    console.error("GET caliber competitions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement detail** (`competitions/[slug]/route.ts`) — includes problems in PUBLIC shape

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { competitionState } from "@/lib/caliber/domain/competition";
import { toPublicProblem, type ProblemRow } from "@/lib/caliber/domain/mapProblem";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const comp = await prisma.caliberCompetition.findUnique({
      where: { slug },
      include: {
        problems: {
          orderBy: { order: "asc" },
          select: {
            problemId: true,
            problem: { select: { id: true, trackId: true, type: true, prompt: true, difficulty: true, maxPoints: true, config: true } },
          },
        },
      },
    });
    if (!comp) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    const now = Date.now();
    const state = competitionState(now, comp.startsAt.getTime(), comp.endsAt.getTime());
    // Problems are only revealed once the competition is live or ended (never before start).
    const problems = state === "upcoming"
      ? []
      : comp.problems.map((cp) => toPublicProblem(cp.problem as unknown as ProblemRow));

    return NextResponse.json({
      competition: { slug: comp.slug, name: comp.name, description: comp.description, startsAt: comp.startsAt, endsAt: comp.endsAt, state },
      problems,
    });
  } catch (error) {
    console.error("GET caliber competition error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Build check + commit**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: success; both routes present.
```bash
git add "frontend/src/app/api/caliber/competitions/route.ts" "frontend/src/app/api/caliber/competitions/[slug]/route.ts"
git commit -m "feat(caliber): competitions list + detail (problems hidden pre-start)"
```

### Task 4: Join

**Files:**
- Create: `frontend/src/app/api/caliber/competitions/[slug]/join/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { competitionState } from "@/lib/caliber/domain/competition";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.userId as string;

    const rl = await checkRateLimit(`caliber_comp_join:${userId}`, 20, 60_000);
    if (!rl.success) return NextResponse.json({ error: "Slow down." }, { status: 429 });

    const comp = await prisma.caliberCompetition.findUnique({ where: { slug }, select: { id: true, startsAt: true, endsAt: true } });
    if (!comp) return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    if (competitionState(Date.now(), comp.startsAt.getTime(), comp.endsAt.getTime()) === "ended") {
      return NextResponse.json({ error: "This competition has ended." }, { status: 400 });
    }

    await prisma.caliberCompetitionEntry.upsert({
      where: { competitionId_userId: { competitionId: comp.id, userId } },
      create: { competitionId: comp.id, userId },
      update: {},
    });
    return NextResponse.json({ joined: true });
  } catch (error) {
    console.error("POST caliber competition join error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Build check + commit**

Run: `cd frontend && npm run build 2>&1 | tail -5`
```bash
git add "frontend/src/app/api/caliber/competitions/[slug]/join/route.ts"
git commit -m "feat(caliber): competition join"
```

### Task 5: Submit (window-gated, scores into the entry)

**Files:**
- Create: `frontend/src/app/api/caliber/competitions/[slug]/problems/[id]/submit/route.ts`

Flow: auth → rate limit → competition exists + state === "live" (else 400) → user has an entry (else 403 "join first") → problem is in this competition (else 404) → finite numeric `value` → load row → `toEngineProblem` → `evaluate` → in a transaction: create the unique competition submission (if one already exists for this (competition,problem,user), reject 409 "already answered"), recompute the entry's `totalScore` from its submissions and set `lastScoredAt`. Never returns the answer key.

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { competitionState } from "@/lib/caliber/domain/competition";
import { toEngineProblem, type ProblemRow } from "@/lib/caliber/domain/mapProblem";
import { evaluate } from "@/lib/caliber/evaluation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.userId as string;

    const rl = await checkRateLimit(`caliber_comp_submit:${userId}`, 60, 60_000);
    if (!rl.success) return NextResponse.json({ error: "Slow down." }, { status: 429 });

    const comp = await prisma.caliberCompetition.findUnique({ where: { slug }, select: { id: true, startsAt: true, endsAt: true } });
    if (!comp) return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    if (competitionState(Date.now(), comp.startsAt.getTime(), comp.endsAt.getTime()) !== "live") {
      return NextResponse.json({ error: "Competition is not live." }, { status: 400 });
    }

    const entry = await prisma.caliberCompetitionEntry.findUnique({
      where: { competitionId_userId: { competitionId: comp.id, userId } }, select: { id: true },
    });
    if (!entry) return NextResponse.json({ error: "Join the competition first." }, { status: 403 });

    const link = await prisma.caliberCompetitionProblem.findUnique({
      where: { competitionId_problemId: { competitionId: comp.id, problemId: id } }, select: { id: true },
    });
    if (!link) return NextResponse.json({ error: "Problem is not in this competition." }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const value = body?.value;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return NextResponse.json({ error: "A numeric 'value' is required" }, { status: 400 });
    }

    const row = await prisma.caliberProblem.findUnique({
      where: { id },
      select: { id: true, trackId: true, type: true, prompt: true, difficulty: true, maxPoints: true, config: true },
    });
    if (!row) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

    const result = evaluate(toEngineProblem(row as unknown as ProblemRow), { value });

    try {
      await prisma.$transaction(async (tx) => {
        await tx.caliberCompetitionSubmission.create({
          data: { competitionId: comp.id, problemId: id, userId, value, score: result.score },
        });
        const agg = await tx.caliberCompetitionSubmission.aggregate({
          where: { competitionId: comp.id, userId }, _sum: { score: true },
        });
        await tx.caliberCompetitionEntry.update({
          where: { competitionId_userId: { competitionId: comp.id, userId } },
          data: { totalScore: agg._sum.score ?? 0, lastScoredAt: new Date() },
        });
      });
    } catch {
      // Unique violation => already answered this problem in this competition.
      return NextResponse.json({ error: "You already answered this problem." }, { status: 409 });
    }

    return NextResponse.json({ result: { score: result.score, maxPoints: result.maxPoints, feedback: result.feedback } });
  } catch (error) {
    console.error("POST caliber competition submit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Build check + commit**

Run: `cd frontend && npm run build 2>&1 | tail -6`
```bash
git add "frontend/src/app/api/caliber/competitions/[slug]/problems/[id]/submit/route.ts"
git commit -m "feat(caliber): competition submit (window-gated, one answer per problem)"
```

### Task 6: Leaderboard

**Files:**
- Create: `frontend/src/app/api/caliber/competitions/[slug]/leaderboard/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rankLeaderboard } from "@/lib/caliber/domain/competition";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const comp = await prisma.caliberCompetition.findUnique({ where: { slug }, select: { id: true } });
    if (!comp) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    const entries = await prisma.caliberCompetitionEntry.findMany({
      where: { competitionId: comp.id, lastScoredAt: { not: null } },
      select: {
        userId: true, totalScore: true, lastScoredAt: true,
        user: { select: { username: true, firstName: true, lastName: true, avatar: true } },
      },
    });
    const ranked = rankLeaderboard(
      entries.map((e) => ({ userId: e.userId, score: e.totalScore, lastAt: e.lastScoredAt!.getTime() })),
    );
    const byId = new Map(entries.map((e) => [e.userId, e.user]));
    const leaderboard = ranked.map((r) => ({ rank: r.rank, score: r.score, user: byId.get(r.userId) }));
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("GET caliber leaderboard error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Build check + commit**

Run: `cd frontend && npm run build 2>&1 | tail -5`
```bash
git add "frontend/src/app/api/caliber/competitions/[slug]/leaderboard/route.ts"
git commit -m "feat(caliber): competition leaderboard (ranked)"
```

---

## Chunk 4: UI (build-verified)

### Task 7: Competitions list + detail pages

**Files:**
- Create: `frontend/src/app/caliber/competitions/page.tsx`
- Create: `frontend/src/app/caliber/competitions/[slug]/page.tsx`

- [ ] **Step 1: Implement list** (`competitions/page.tsx`)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import s from "../caliber.module.css";

interface Comp { id: string; slug: string; name: string; description: string; state: string; }

export default function CompetitionsPage() {
  const [comps, setComps] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let c = false;
    fetch("/api/caliber/competitions").then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!c) setComps(d.competitions || []); })
      .catch(() => { if (!c) setError(true); }).finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, []);
  return (
    <div className={s.wrap}>
      <Link href="/caliber" className={s.muted}>← Caliber</Link>
      <h1 className={s.h1} style={{ marginTop: ".5rem" }}>Competitions</h1>
      {loading ? <div className={s.state}>Loading…</div>
        : error ? <div className={s.state}>Could not load competitions.</div>
        : comps.length === 0 ? <div className={s.state}>No competitions yet.</div>
        : comps.map((c) => (
          <Link key={c.id} href={`/caliber/competitions/${c.slug}`} className={s.card}>
            <div className={s.rowBetween}><strong>{c.name}</strong><span className={s.pill}>{c.state}</span></div>
            <div className={s.muted}>{c.description}</div>
          </Link>
        ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement detail** (`competitions/[slug]/page.tsx`) — join, problems (link to a competition solve is out of scope; link problems to `/caliber/problems/[id]` for reading is misleading, so just LIST them with prompt+difficulty), and the leaderboard.

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import s from "../../caliber.module.css";

interface PublicProblem { id: string; type: string; prompt: string; difficulty: number; maxPoints: number; }
interface Detail { competition: { slug: string; name: string; description: string; state: string }; problems: PublicProblem[]; }
interface Row { rank: number; score: number; user?: { username: string | null; firstName: string; lastName: string } | null; }

export default function CompetitionDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [board, setBoard] = useState<Row[]>([]);
  const [joined, setJoined] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const [d, b] = await Promise.all([
        fetch(`/api/caliber/competitions/${slug}`).then((r) => (r.ok ? r.json() : Promise.reject())),
        fetch(`/api/caliber/competitions/${slug}/leaderboard`).then((r) => (r.ok ? r.json() : { leaderboard: [] })),
      ]);
      setDetail(d); setBoard(b.leaderboard || []);
    } catch { setDetail(null); } finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  async function join() {
    setMsg(null);
    const r = await fetch(`/api/caliber/competitions/${slug}/join`, { method: "POST" });
    if (r.status === 401) { setMsg("Log in to join."); return; }
    if (!r.ok) { const e = await r.json().catch(() => ({})); setMsg(e.error || "Could not join."); return; }
    setJoined(true); setMsg("You're in!");
  }

  if (loading) return <div className={s.wrap}><div className={s.state}>Loading…</div></div>;
  if (!detail) return <div className={s.wrap}><div className={s.state}>Competition not found.</div></div>;

  return (
    <div className={s.wrap}>
      <Link href="/caliber/competitions" className={s.muted}>← Competitions</Link>
      <div className={s.rowBetween} style={{ marginTop: ".5rem" }}>
        <h1 className={s.h1}>{detail.competition.name}</h1>
        <span className={s.pill}>{detail.competition.state}</span>
      </div>
      <p className={s.sub}>{detail.competition.description}</p>

      {detail.competition.state !== "ended" && (
        <button className={s.btn} onClick={join} disabled={joined}>{joined ? "Joined" : "Join"}</button>
      )}
      {msg && <p className={s.muted} style={{ marginTop: ".5rem" }}>{msg}</p>}

      <h2 className={s.h1} style={{ fontSize: "1.15rem", marginTop: "2rem" }}>Problems</h2>
      {detail.problems.length === 0 ? (
        <div className={s.muted}>{detail.competition.state === "upcoming" ? "Revealed when the competition starts." : "No problems."}</div>
      ) : detail.problems.map((p) => (
        <div key={p.id} className={s.card} style={{ cursor: "default" }}>
          <div className={s.rowBetween}><span>{p.prompt}</span><span className={s.pill}>{p.difficulty}</span></div>
        </div>
      ))}

      <h2 className={s.h1} style={{ fontSize: "1.15rem", marginTop: "2rem" }}>Leaderboard</h2>
      {board.length === 0 ? <div className={s.muted}>No entries yet.</div> : board.map((r) => (
        <div key={r.rank + (r.user?.username ?? "")} className={s.card} style={{ cursor: "default" }}>
          <div className={s.rowBetween}>
            <span>#{r.rank} &nbsp; {r.user ? `${r.user.firstName} ${r.user.lastName}` : "Unknown"}</span>
            <strong>{r.score}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Build check + full test suite + commit**

Run: `cd frontend && npm run build 2>&1 | tail -6 && npm run test:run 2>&1 | tail -4`
Expected: build success with both competition routes/pages; all Vitest tests pass.
```bash
git add "frontend/src/app/caliber/competitions/page.tsx" "frontend/src/app/caliber/competitions/[slug]/page.tsx"
git commit -m "feat(caliber-ui): competitions list + detail (join, problems, leaderboard)"
```

---

## Done criteria for Module 5

- `npm run test:run` green incl. the competition helper tests.
- `npx prisma generate` succeeds with the 4 competition models + User relation.
- `npm run build` succeeds; all five competition API routes + two pages present.
- **Window integrity:** problems are `[]` before start (detail route); submit rejects unless state === "live" and the user has an entry; one scored submission per (competition, problem, user).
- **Answer integrity:** no competition route returns an answer key (detail uses `toPublicProblem`; submit returns only score/maxPoints/feedback). Grep `grep -rn "correctIndex\|tolerance\|\.answer\| bands" frontend/src/app/api/caliber/competitions` is empty.
- Competition scoring never touches practice `CaliberRating` (grep the competition submit route for `caliberRating` — absent).

**Next module:** Open-ended evaluation (Module 6) — rubric + peer/AI review for case/pitch tracks. Its own plan.

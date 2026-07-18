# Caliber Problem Bank + Persistence — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist tracks, problems, submissions, and per-track ratings, and wire the Module-1 engine so a submission is scored, recorded, and moves the user's rating — with answer keys never exposed to the client.

**Architecture:** A **pure domain core** (`src/lib/caliber/domain/`) composes the Module-1 pure functions and DB↔engine mappers — unit-tested with Vitest, no IO. Thin Prisma models + API routes wrap that core; they are build/type-verified (no live DB in this environment, same approach used for the DMs/pins modules). Answer keys live only in a server-side `config` JSON and are stripped by a `toPublicProblem` mapper before any response.

**Tech Stack:** TypeScript, Prisma (Postgres), Next.js route handlers, Vitest. Consumes `evaluate()` (`@/lib/caliber/evaluation`) and `applyResult()` / `DEFAULT_RATING` (`@/lib/caliber/rating`).

**Module 2 of the Caliber roadmap** (spec: `docs/superpowers/specs/2026-07-18-caliber-pivot-design.md`). Models are `Caliber`-prefixed to avoid colliding with the still-gaming schema (the Hub→Track re-theme is Module 4).

**Integrity policy (v1):** Only a user's **first** submission to a given problem counts toward rating; later attempts return feedback with `ratingDelta = 0`. Answer keys/rubrics are server-only.

---

## File Structure

- `frontend/src/lib/caliber/domain/mapProblem.ts` — `toEngineProblem(row)` (DB row → engine `Problem`) and `toPublicProblem(row)` (DB row → client-safe, answer-stripped). Pure.
- `frontend/src/lib/caliber/domain/processSubmission.ts` — `processSubmission(problem, submission, currentRating, countsForRating)` → `{ result, newRating, ratingDelta }`. Pure.
- `frontend/prisma/schema.prisma` — add `CaliberTrack`, `CaliberProblem`, `CaliberSubmission`, `CaliberRating`, `CaliberRatingHistory` + User relations.
- `frontend/src/app/api/caliber/tracks/route.ts` — GET list tracks.
- `frontend/src/app/api/caliber/tracks/[slug]/problems/route.ts` — GET problems in a track (public shape).
- `frontend/src/app/api/caliber/problems/[id]/route.ts` — GET one problem (public shape, no answer).
- `frontend/src/app/api/caliber/problems/[id]/submit/route.ts` — POST a submission.
- `frontend/src/app/api/caliber/me/ratings/route.ts` — GET current user's ratings.
- Tests co-located as `*.test.ts` for the two pure domain files.

Paths are relative to repo root `/Users/vivek/Arcnet`. Run commands from `cd /Users/vivek/Arcnet/frontend`.

---

## Chunk 1: Pure domain core (TDD)

### Task 1: DB row shape + `toEngineProblem` / `toPublicProblem`

**Files:**
- Create: `frontend/src/lib/caliber/domain/mapProblem.ts`
- Test: `frontend/src/lib/caliber/domain/mapProblem.test.ts`

The DB stores type-specific fields in a `config` JSON. `toEngineProblem` merges row + config into the Module-1 `Problem` union; `toPublicProblem` returns only client-safe fields (NEVER answer/tolerance/bands/correctIndex; mcq keeps `optionCount`).

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { toEngineProblem, toPublicProblem, type ProblemRow } from "./mapProblem";

const numericRow: ProblemRow = {
  id: "p1", trackId: "t1", type: "numeric", prompt: "2+2?", difficulty: 1500, maxPoints: 100,
  config: { answer: 4, tolerance: 0 },
};
const guessRow: ProblemRow = {
  id: "p2", trackId: "t1", type: "guesstimate", prompt: "Piano tuners in Chicago?", difficulty: 1600, maxPoints: 100,
  config: { answer: 125, bands: [{ maxRatio: 2, points: 100 }, { maxRatio: 10, points: 50 }] },
};
const mcqRow: ProblemRow = {
  id: "p3", trackId: "t1", type: "mcq", prompt: "Pick", difficulty: 1400, maxPoints: 10,
  config: { correctIndex: 2, optionCount: 4 },
};

describe("toEngineProblem", () => {
  it("builds a numeric engine problem from row+config", () => {
    expect(toEngineProblem(numericRow)).toEqual({ id: "p1", type: "numeric", difficulty: 1500, maxPoints: 100, answer: 4, tolerance: 0 });
  });
  it("builds a guesstimate engine problem", () => {
    const p = toEngineProblem(guessRow);
    expect(p.type).toBe("guesstimate");
    if (p.type === "guesstimate") expect(p.bands.length).toBe(2);
  });
  it("throws on unknown type", () => {
    expect(() => toEngineProblem({ ...numericRow, type: "bogus" as ProblemRow["type"] })).toThrow();
  });
});

describe("toPublicProblem", () => {
  it("strips numeric answer + tolerance", () => {
    const pub = toPublicProblem(numericRow) as Record<string, unknown>;
    expect(pub).toEqual({ id: "p1", trackId: "t1", type: "numeric", prompt: "2+2?", difficulty: 1500, maxPoints: 100 });
    expect("answer" in pub).toBe(false);
    expect("tolerance" in pub).toBe(false);
  });
  it("strips guesstimate answer + bands", () => {
    const pub = toPublicProblem(guessRow) as Record<string, unknown>;
    expect("answer" in pub).toBe(false);
    expect("bands" in pub).toBe(false);
  });
  it("keeps mcq optionCount but not correctIndex", () => {
    const pub = toPublicProblem(mcqRow) as Record<string, unknown>;
    expect(pub.optionCount).toBe(4);
    expect("correctIndex" in pub).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd frontend && npm run test:run -- src/lib/caliber/domain/mapProblem.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
import type { Problem, ProblemType, GuesstimateBand } from "../evaluation/types";

export interface ProblemRow {
  id: string;
  trackId: string;
  type: ProblemType;
  prompt: string;
  difficulty: number;
  maxPoints: number;
  /** Server-only, type-specific answer key. */
  config: Record<string, unknown>;
}

export function toEngineProblem(row: ProblemRow): Problem {
  const base = { id: row.id, difficulty: row.difficulty, maxPoints: row.maxPoints };
  const c = row.config;
  switch (row.type) {
    case "numeric":
      return { ...base, type: "numeric", answer: Number(c.answer), tolerance: Number(c.tolerance) };
    case "guesstimate":
      return { ...base, type: "guesstimate", answer: Number(c.answer), bands: c.bands as GuesstimateBand[] };
    case "mcq":
      return { ...base, type: "mcq", correctIndex: Number(c.correctIndex), optionCount: Number(c.optionCount) };
    default: {
      const _exhaustive: never = row.type;
      throw new Error(`Unknown problem type: ${String(_exhaustive)}`);
    }
  }
}

export function toPublicProblem(row: ProblemRow) {
  const base = { id: row.id, trackId: row.trackId, type: row.type, prompt: row.prompt, difficulty: row.difficulty, maxPoints: row.maxPoints };
  // Only non-answer, client-safe extras are added back per type.
  if (row.type === "mcq") {
    return { ...base, optionCount: Number(row.config.optionCount) };
  }
  return base;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `cd frontend && npm run test:run -- src/lib/caliber/domain/mapProblem.test.ts`
Expected: all passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/caliber/domain/mapProblem.ts frontend/src/lib/caliber/domain/mapProblem.test.ts
git commit -m "feat(caliber): DB<->engine problem mappers (answer-stripping public shape)"
```

### Task 2: `processSubmission`

**Files:**
- Create: `frontend/src/lib/caliber/domain/processSubmission.ts`
- Test: `frontend/src/lib/caliber/domain/processSubmission.test.ts`

Composes `evaluate()` + `applyResult()`. When `countsForRating` is false, rating is unchanged and `ratingDelta === 0`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { processSubmission } from "./processSubmission";
import type { Problem } from "../evaluation/types";

const numeric: Problem = { id: "p1", type: "numeric", difficulty: 1500, maxPoints: 100, answer: 4, tolerance: 0 };

describe("processSubmission", () => {
  it("scores and moves rating on a first (counting) attempt", () => {
    const out = processSubmission(numeric, { value: 4 }, 1200, true);
    expect(out.result.score).toBe(100);
    expect(out.newRating).toBeGreaterThan(1200);
    expect(out.ratingDelta).toBe(out.newRating - 1200);
  });
  it("does not move rating when the attempt does not count", () => {
    const out = processSubmission(numeric, { value: 4 }, 1200, false);
    expect(out.result.score).toBe(100);
    expect(out.newRating).toBe(1200);
    expect(out.ratingDelta).toBe(0);
  });
  it("a wrong first attempt lowers rating vs an easier problem", () => {
    const easy: Problem = { ...numeric, difficulty: 1000 };
    const out = processSubmission(easy, { value: 999 }, 1400, true);
    expect(out.result.score).toBe(0);
    expect(out.newRating).toBeLessThan(1400);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd frontend && npm run test:run -- src/lib/caliber/domain/processSubmission.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import type { Problem, Submission, EvaluationResult } from "../evaluation/types";
import { evaluate } from "../evaluation";
import { applyResult } from "../rating";

export interface ProcessResult {
  result: EvaluationResult;
  newRating: number;
  ratingDelta: number;
}

export function processSubmission(
  problem: Problem,
  submission: Submission,
  currentRating: number,
  countsForRating: boolean,
): ProcessResult {
  const result = evaluate(problem, submission);
  const newRating = countsForRating
    ? applyResult(currentRating, problem.difficulty, { outcome: result.outcome })
    : currentRating;
  return { result, newRating, ratingDelta: newRating - currentRating };
}
```

- [ ] **Step 4: Run — expect PASS + full caliber suite green**

Run: `cd frontend && npm run test:run`
Expected: all passed (Module 1 + these).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/caliber/domain/processSubmission.ts frontend/src/lib/caliber/domain/processSubmission.test.ts
git commit -m "feat(caliber): processSubmission domain (score + rating, first-attempt policy)"
```

---

## Chunk 2: Prisma schema (build-verified — no live DB)

### Task 3: Add Caliber models + User relations

**Files:**
- Modify: `frontend/prisma/schema.prisma`

- [ ] **Step 1: Add the models** (append near the other models; all use `cuid()` like the existing non-User models)

```prisma
model CaliberTrack {
  id          String           @id @default(cuid())
  slug        String           @unique
  name        String
  kind        String           // "quant" | "open"
  description String
  problems    CaliberProblem[]
  createdAt   DateTime         @default(now())
}

model CaliberProblem {
  id          String              @id @default(cuid())
  trackId     String
  track       CaliberTrack        @relation(fields: [trackId], references: [id], onDelete: Cascade)
  type        String              // "numeric" | "guesstimate" | "mcq"
  prompt      String
  difficulty  Int
  maxPoints   Int
  config      Json                // server-only answer key / bands / options
  status      String              @default("published")
  submissions CaliberSubmission[]
  createdAt   DateTime            @default(now())
  @@index([trackId])
}

model CaliberSubmission {
  id             String         @id @default(cuid())
  problemId      String
  problem        CaliberProblem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  userId         String
  user           User           @relation("CaliberSubmissions", fields: [userId], references: [id], onDelete: Cascade)
  value          Float
  score          Int
  feedback       String
  countedForRating Boolean      @default(false)
  createdAt      DateTime       @default(now())
  @@index([problemId, userId])
}

model CaliberRating {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation("CaliberRatings", fields: [userId], references: [id], onDelete: Cascade)
  trackId   String
  value     Int
  updatedAt DateTime @updatedAt
  @@unique([userId, trackId])
}

model CaliberRatingHistory {
  id        String   @id @default(cuid())
  userId    String
  trackId   String
  value     Int
  delta     Int
  problemId String
  createdAt DateTime @default(now())
  @@index([userId, trackId])
}
```

- [ ] **Step 2: Add User relations** (inside the `User` model, alongside `sentDirectMessages`)

```prisma
  caliberSubmissions CaliberSubmission[] @relation("CaliberSubmissions")
  caliberRatings     CaliberRating[]     @relation("CaliberRatings")
```

- [ ] **Step 3: Generate client (validates schema without a DB)**

Run: `cd frontend && npx prisma generate`
Expected: "Generated Prisma Client" success (no DB needed).

- [ ] **Step 4: Commit**

```bash
git add frontend/prisma/schema.prisma
git commit -m "feat(caliber): prisma models — track, problem, submission, rating, history"
```

> Migration note: `npx prisma migrate dev --name caliber-problem-bank` must be run against a real DB to create these tables. Build only needs `prisma generate`.

---

## Chunk 3: API routes (build-verified)

Each route mirrors the existing pattern: `getSession()` (401 if required), `prisma`, `await checkRateLimit(...)`, `params` is a Promise. Answer keys are NEVER returned (use `toPublicProblem`).

### Task 4: GET tracks + GET track problems

**Files:**
- Create: `frontend/src/app/api/caliber/tracks/route.ts`
- Create: `frontend/src/app/api/caliber/tracks/[slug]/problems/route.ts`

- [ ] **Step 1: Implement `tracks/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tracks = await prisma.caliberTrack.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, kind: true, description: true },
    });
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("GET caliber tracks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement `tracks/[slug]/problems/route.ts`** (public shape — no answers)

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicProblem, type ProblemRow } from "@/lib/caliber/domain/mapProblem";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const track = await prisma.caliberTrack.findUnique({ where: { slug } });
    if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

    const rows = await prisma.caliberProblem.findMany({
      where: { trackId: track.id, status: "published" },
      orderBy: { difficulty: "asc" },
      select: { id: true, trackId: true, type: true, prompt: true, difficulty: true, maxPoints: true, config: true },
    });
    const problems = rows.map((r) => toPublicProblem(r as unknown as ProblemRow));
    return NextResponse.json({ track: { slug: track.slug, name: track.name }, problems });
  } catch (error) {
    console.error("GET caliber track problems error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Build check**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: "Compiled successfully", and both routes appear in the route list.

- [ ] **Step 4: Commit**

```bash
git add "frontend/src/app/api/caliber/tracks/route.ts" "frontend/src/app/api/caliber/tracks/[slug]/problems/route.ts"
git commit -m "feat(caliber): list tracks + track problems (answer-stripped)"
```

### Task 5: GET one problem (public shape)

**Files:**
- Create: `frontend/src/app/api/caliber/problems/[id]/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicProblem, type ProblemRow } from "@/lib/caliber/domain/mapProblem";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await prisma.caliberProblem.findUnique({
      where: { id },
      select: { id: true, trackId: true, type: true, prompt: true, difficulty: true, maxPoints: true, config: true, status: true },
    });
    if (!row || row.status !== "published") {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }
    return NextResponse.json({ problem: toPublicProblem(row as unknown as ProblemRow) });
  } catch (error) {
    console.error("GET caliber problem error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Build check**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: success; route present.

- [ ] **Step 3: Commit**

```bash
git add "frontend/src/app/api/caliber/problems/[id]/route.ts"
git commit -m "feat(caliber): get one problem (answer-stripped)"
```

### Task 6: POST submit (the heart)

**Files:**
- Create: `frontend/src/app/api/caliber/problems/[id]/submit/route.ts`

Flow: auth → rate limit → validate `value` is a finite number → load row → `toEngineProblem` → determine `countsForRating` (no prior submission by this user) → `processSubmission` → in a transaction: create submission, upsert rating, append history (only if it counted) → return `{ result, rating, ratingDelta }`. Answer key never returned.

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { toEngineProblem, type ProblemRow } from "@/lib/caliber/domain/mapProblem";
import { processSubmission } from "@/lib/caliber/domain/processSubmission";
import { DEFAULT_RATING } from "@/lib/caliber/rating";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId as string;

    const rl = await checkRateLimit(`caliber_submit:${userId}`, 60, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "Slow down — too many submissions." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const value = body?.value;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return NextResponse.json({ error: "A numeric 'value' is required" }, { status: 400 });
    }

    const row = await prisma.caliberProblem.findUnique({
      where: { id },
      select: { id: true, trackId: true, type: true, prompt: true, difficulty: true, maxPoints: true, config: true, status: true },
    });
    if (!row || row.status !== "published") {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const engineProblem = toEngineProblem(row as unknown as ProblemRow);

    const [prior, ratingRow] = await Promise.all([
      prisma.caliberSubmission.findFirst({ where: { problemId: id, userId }, select: { id: true } }),
      prisma.caliberRating.findUnique({ where: { userId_trackId: { userId, trackId: row.trackId } }, select: { value: true } }),
    ]);
    const countsForRating = !prior;
    const currentRating = ratingRow?.value ?? DEFAULT_RATING;

    const { result, newRating, ratingDelta } = processSubmission(
      engineProblem, { value }, currentRating, countsForRating,
    );

    await prisma.$transaction(async (tx) => {
      await tx.caliberSubmission.create({
        data: { problemId: id, userId, value, score: result.score, feedback: result.feedback, countedForRating: countsForRating },
      });
      if (countsForRating) {
        await tx.caliberRating.upsert({
          where: { userId_trackId: { userId, trackId: row.trackId } },
          create: { userId, trackId: row.trackId, value: newRating },
          update: { value: newRating },
        });
        await tx.caliberRatingHistory.create({
          data: { userId, trackId: row.trackId, value: newRating, delta: ratingDelta, problemId: id },
        });
      }
    });

    return NextResponse.json({
      result: { score: result.score, maxPoints: result.maxPoints, feedback: result.feedback },
      rating: newRating,
      ratingDelta,
      countedForRating: countsForRating,
    });
  } catch (error) {
    console.error("POST caliber submit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Build check**

Run: `cd frontend && npm run build 2>&1 | tail -8`
Expected: "Compiled successfully"; `/api/caliber/problems/[id]/submit` present.

- [ ] **Step 3: Commit**

```bash
git add "frontend/src/app/api/caliber/problems/[id]/submit/route.ts"
git commit -m "feat(caliber): submit endpoint (score, persist, first-attempt rating update)"
```

### Task 7: GET my ratings

**Files:**
- Create: `frontend/src/app/api/caliber/me/ratings/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ratings = await prisma.caliberRating.findMany({
      where: { userId: session.userId as string },
      select: { trackId: true, value: true, updatedAt: true },
      orderBy: { value: "desc" },
    });
    return NextResponse.json({ ratings });
  } catch (error) {
    console.error("GET caliber ratings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Build check + full test suite**

Run: `cd frontend && npm run build 2>&1 | tail -5 && npm run test:run 2>&1 | tail -4`
Expected: build "Compiled successfully"; all Vitest tests pass.

- [ ] **Step 3: Commit**

```bash
git add "frontend/src/app/api/caliber/me/ratings/route.ts"
git commit -m "feat(caliber): my-ratings endpoint"
```

---

## Done criteria for Module 2

- Pure domain (`mapProblem`, `processSubmission`) is unit-tested and green in `npm run test:run`.
- `npx prisma generate` succeeds with the 5 new models + 2 User relations.
- `npm run build` succeeds with all five `/api/caliber/*` routes present.
- **Integrity check:** no route returns answer-key fields. Grep proof: `grep -rn "correctIndex\|tolerance\|bands\|\.answer" frontend/src/app/api/caliber` returns **nothing** — answer-key handling lives in `src/lib/caliber/domain/` (`toEngineProblem`), never in the route layer's response payloads.
- No pure engine/domain file imports Prisma/Next/React (`grep -rn "next/\|@prisma\|react" frontend/src/lib/caliber` is empty).

## Deferred (tracked, not built here)
- **Problem authoring/seeding** — creating problems and enforcing the guesstimate band invariant (tightest band `points === maxPoints`) has no home yet; it belongs to a future authoring/seed module. Do not silently drop it.
- **First-attempt race** — the prior-submission check sits just before the transaction, so two truly-concurrent first submissions could both count for rating. Negligible under the per-user rate limit + single-player v1; revisit under abuse-hardening (e.g. a unique guard on the first counted submission).

**Next module:** Practice UI/API (Module 3) — a page to fetch a problem, submit, and show feedback + rating delta, consuming these routes. Its own plan.

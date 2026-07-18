# Caliber Open-Ended Evaluation (Peer Review) — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Support open-ended problems (cases, pitches, essays) that can't be auto-scored — a student submits text, peers score it against a public rubric, and a deterministic aggregation produces a final score once enough reviews land.

**Architecture:** Open-ended problems are a SEPARATE flow from the deterministic engine (they are never passed to `evaluate()`). A pure `aggregateReviews` function (TDD) turns reviewer totals into a final score/status. Prisma models + routes + a minimal `/caliber/open/*` UI are build-verified. AI review and reviewer-reputation weighting are explicitly deferred (YAGNI).

**Tech Stack:** TypeScript, Prisma, Next.js, Vitest. Reuses `getSession`, `prisma`, async `checkRateLimit`, and `caliber.module.css`.

**Module 6 of the Caliber roadmap** (spec: `docs/superpowers/specs/2026-07-18-caliber-pivot-design.md`).

**v1 policy:** a submission is "scored" once it has `MIN_REVIEWS = 2` reviews; final score = round(mean of reviewer totals). A user cannot review their own submission, and cannot review the same submission twice. Rubric criteria are public (shown to solver and reviewers) — there is no hidden answer key for open problems.

---

## File Structure

- `frontend/src/lib/caliber/domain/aggregateReviews.ts` — pure aggregation. (+ test)
- `frontend/prisma/schema.prisma` — add `CaliberOpenProblem`, `CaliberOpenSubmission`, `CaliberReview` + User relations.
- `frontend/src/app/api/caliber/open/[id]/route.ts` — GET open problem (prompt + rubric).
- `frontend/src/app/api/caliber/open/[id]/submit/route.ts` — POST a text answer.
- `frontend/src/app/api/caliber/reviews/queue/route.ts` — GET submissions to review.
- `frontend/src/app/api/caliber/reviews/[submissionId]/route.ts` — POST a review.
- `frontend/src/app/api/caliber/me/open-submissions/route.ts` — GET my submissions + status.
- `frontend/src/app/caliber/open/[id]/page.tsx` — solve (textarea) UI.
- `frontend/src/app/caliber/reviews/page.tsx` — review inbox UI.

Paths relative to `/Users/vivek/Arcnet`; run from `cd /Users/vivek/Arcnet/frontend`.

---

## Chunk 1: Pure aggregation (TDD)

### Task 1: `aggregateReviews`

**Files:**
- Create: `frontend/src/lib/caliber/domain/aggregateReviews.ts`
- Test: `frontend/src/lib/caliber/domain/aggregateReviews.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { aggregateReviews, MIN_REVIEWS } from "./aggregateReviews";

describe("aggregateReviews", () => {
  it("MIN_REVIEWS is 2", () => expect(MIN_REVIEWS).toBe(2));
  it("pending below the review threshold", () => {
    expect(aggregateReviews([80])).toEqual({ status: "pending", score: null, reviewCount: 1 });
    expect(aggregateReviews([])).toEqual({ status: "pending", score: null, reviewCount: 0 });
  });
  it("scored (rounded mean) at/above threshold", () => {
    expect(aggregateReviews([80, 90])).toEqual({ status: "scored", score: 85, reviewCount: 2 });
    expect(aggregateReviews([70, 80, 91])).toEqual({ status: "scored", score: 80, reviewCount: 3 }); // 80.33 -> 80
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd frontend && npm run test:run -- src/lib/caliber/domain/aggregateReviews.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
export const MIN_REVIEWS = 2;

export interface Aggregate {
  status: "pending" | "scored";
  score: number | null;
  reviewCount: number;
}

/** reviewerTotals: each reviewer's summed rubric score. */
export function aggregateReviews(reviewerTotals: number[]): Aggregate {
  const reviewCount = reviewerTotals.length;
  if (reviewCount < MIN_REVIEWS) return { status: "pending", score: null, reviewCount };
  const mean = reviewerTotals.reduce((a, b) => a + b, 0) / reviewCount;
  return { status: "scored", score: Math.round(mean), reviewCount };
}
```

- [ ] **Step 4: Run — expect PASS + full suite**

Run: `cd frontend && npm run test:run`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/caliber/domain/aggregateReviews.ts frontend/src/lib/caliber/domain/aggregateReviews.test.ts
git commit -m "feat(caliber): peer-review aggregation (pure)"
```

---

## Chunk 2: Prisma models (build-verified)

### Task 2: Open-eval models

**Files:**
- Modify: `frontend/prisma/schema.prisma`

- [ ] **Step 1: Add models**

```prisma
model CaliberOpenProblem {
  id          String                  @id @default(cuid())
  trackId     String
  prompt      String
  rubric      Json                    // [{ key, label, maxPoints }]
  maxPoints   Int                     // sum of criteria maxPoints (denormalized)
  status      String                  @default("published")
  submissions CaliberOpenSubmission[]
  createdAt   DateTime                @default(now())
  @@index([trackId])
}

model CaliberOpenSubmission {
  id         String              @id @default(cuid())
  problemId  String
  problem    CaliberOpenProblem  @relation(fields: [problemId], references: [id], onDelete: Cascade)
  userId     String
  user       User                @relation("CaliberOpenSubmissions", fields: [userId], references: [id], onDelete: Cascade)
  answer     String
  status     String              @default("pending") // pending | scored
  score      Int?
  reviews    CaliberReview[]
  createdAt  DateTime            @default(now())
  @@index([problemId])
  @@index([userId])
}

model CaliberReview {
  id           String                @id @default(cuid())
  submissionId String
  submission   CaliberOpenSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  reviewerId   String
  reviewer     User                  @relation("CaliberReviews", fields: [reviewerId], references: [id], onDelete: Cascade)
  scores       Json                  // { [criterionKey]: number }
  total        Int
  createdAt    DateTime              @default(now())
  @@unique([submissionId, reviewerId])
  @@index([submissionId])
}
```

- [ ] **Step 2: Add User relations** (inside `User`)

```prisma
  caliberOpenSubmissions CaliberOpenSubmission[] @relation("CaliberOpenSubmissions")
  caliberReviews         CaliberReview[]         @relation("CaliberReviews")
```

- [ ] **Step 3: Generate + commit**

Run: `cd frontend && npx prisma generate`
Expected: success.
```bash
git add frontend/prisma/schema.prisma
git commit -m "feat(caliber): open-eval prisma models (open problem, submission, review)"
```

---

## Chunk 3: Routes (build-verified)

### Task 3: Get open problem + submit answer

**Files:**
- Create: `frontend/src/app/api/caliber/open/[id]/route.ts`
- Create: `frontend/src/app/api/caliber/open/[id]/submit/route.ts`

- [ ] **Step 1: GET problem** (rubric is public for open problems — no hidden key)

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const p = await prisma.caliberOpenProblem.findUnique({
      where: { id },
      select: { id: true, trackId: true, prompt: true, rubric: true, maxPoints: true, status: true },
    });
    if (!p || p.status !== "published") return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    return NextResponse.json({ problem: { id: p.id, trackId: p.trackId, prompt: p.prompt, rubric: p.rubric, maxPoints: p.maxPoints } });
  } catch (error) {
    console.error("GET caliber open problem error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: POST submit** (one submission per user per problem)

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_ANSWER = 10_000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.userId as string;

    const rl = await checkRateLimit(`caliber_open_submit:${userId}`, 20, 60_000);
    if (!rl.success) return NextResponse.json({ error: "Slow down." }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
    if (!answer) return NextResponse.json({ error: "An answer is required" }, { status: 400 });
    if (answer.length > MAX_ANSWER) return NextResponse.json({ error: `Answer must be ${MAX_ANSWER} characters or fewer` }, { status: 400 });

    const problem = await prisma.caliberOpenProblem.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!problem || problem.status !== "published") return NextResponse.json({ error: "Problem not found" }, { status: 404 });

    const existing = await prisma.caliberOpenSubmission.findFirst({ where: { problemId: id, userId }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "You already submitted this problem." }, { status: 409 });

    const created = await prisma.caliberOpenSubmission.create({
      data: { problemId: id, userId, answer }, select: { id: true, status: true },
    });
    return NextResponse.json({ submission: created }, { status: 201 });
  } catch (error) {
    console.error("POST caliber open submit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Build + commit**

Run: `cd frontend && npm run build 2>&1 | tail -5`
```bash
git add "frontend/src/app/api/caliber/open/[id]/route.ts" "frontend/src/app/api/caliber/open/[id]/submit/route.ts"
git commit -m "feat(caliber): open problem get + submit"
```

### Task 4: Review queue + post review

**Files:**
- Create: `frontend/src/app/api/caliber/reviews/queue/route.ts`
- Create: `frontend/src/app/api/caliber/reviews/[submissionId]/route.ts`

- [ ] **Step 1: Review queue** — submissions not mine, still pending, that I haven't reviewed

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.userId as string;

    const subs = await prisma.caliberOpenSubmission.findMany({
      where: {
        status: "pending",
        userId: { not: userId },
        reviews: { none: { reviewerId: userId } },
      },
      take: 20,
      orderBy: { createdAt: "asc" },
      select: {
        id: true, answer: true,
        problem: { select: { id: true, prompt: true, rubric: true, maxPoints: true } },
      },
    });
    return NextResponse.json({ tasks: subs });
  } catch (error) {
    console.error("GET caliber review queue error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Post review** — validate scores against the rubric, persist, recompute aggregate

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { aggregateReviews } from "@/lib/caliber/domain/aggregateReviews";

interface Criterion { key: string; label: string; maxPoints: number; }

export async function POST(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const reviewerId = session.userId as string;

    const rl = await checkRateLimit(`caliber_review:${reviewerId}`, 40, 60_000);
    if (!rl.success) return NextResponse.json({ error: "Slow down." }, { status: 429 });

    const sub = await prisma.caliberOpenSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, userId: true, problem: { select: { rubric: true } } },
    });
    if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    if (sub.userId === reviewerId) return NextResponse.json({ error: "You cannot review your own submission." }, { status: 403 });

    const rubric = (sub.problem.rubric as unknown as Criterion[]) || [];
    const body = await request.json().catch(() => ({}));
    const scores = body?.scores;
    if (typeof scores !== "object" || scores === null) return NextResponse.json({ error: "scores object required" }, { status: 400 });

    // Validate: every criterion present, an integer within [0, maxPoints].
    let total = 0;
    for (const c of rubric) {
      const v = (scores as Record<string, unknown>)[c.key];
      if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > c.maxPoints) {
        return NextResponse.json({ error: `Invalid score for "${c.key}" (0..${c.maxPoints})` }, { status: 400 });
      }
      total += v;
    }

    try {
      await prisma.caliberReview.create({ data: { submissionId, reviewerId, scores, total } });
    } catch {
      return NextResponse.json({ error: "You already reviewed this submission." }, { status: 409 });
    }

    // Recompute aggregate from all reviews.
    const reviews = await prisma.caliberReview.findMany({ where: { submissionId }, select: { total: true } });
    const agg = aggregateReviews(reviews.map((r) => r.total));
    await prisma.caliberOpenSubmission.update({
      where: { id: submissionId },
      data: { status: agg.status, score: agg.score },
    });

    return NextResponse.json({ ok: true, aggregate: agg });
  } catch (error) {
    console.error("POST caliber review error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Build + commit**

Run: `cd frontend && npm run build 2>&1 | tail -6`
```bash
git add "frontend/src/app/api/caliber/reviews/queue/route.ts" "frontend/src/app/api/caliber/reviews/[submissionId]/route.ts"
git commit -m "feat(caliber): review queue + post review (rubric-validated, aggregate)"
```

### Task 5: My open submissions

**Files:**
- Create: `frontend/src/app/api/caliber/me/open-submissions/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const submissions = await prisma.caliberOpenSubmission.findMany({
      where: { userId: session.userId as string },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, score: true, createdAt: true, problem: { select: { id: true, prompt: true, maxPoints: true } } },
    });
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("GET caliber my open submissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Build + commit**

Run: `cd frontend && npm run build 2>&1 | tail -5`
```bash
git add "frontend/src/app/api/caliber/me/open-submissions/route.ts"
git commit -m "feat(caliber): my open submissions"
```

---

## Chunk 4: UI (build-verified)

### Task 6: Open solve page + review inbox

**Files:**
- Create: `frontend/src/app/caliber/open/[id]/page.tsx`
- Create: `frontend/src/app/caliber/reviews/page.tsx`

- [ ] **Step 1: Open solve page** (`open/[id]/page.tsx`)

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import s from "../../caliber.module.css";

interface Criterion { key: string; label: string; maxPoints: number; }
interface OpenProblem { id: string; prompt: string; rubric: Criterion[]; maxPoints: number; }

export default function OpenSolvePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [problem, setProblem] = useState<OpenProblem | null>(null);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let c = false;
    fetch(`/api/caliber/open/${id}`).then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!c) setProblem(d.problem); })
      .catch(() => { if (!c) setProblem(null); }).finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [id]);

  async function submit() {
    setMsg(null);
    const r = await fetch(`/api/caliber/open/${id}/submit`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer }),
    });
    if (r.status === 401) { setMsg("Log in to submit."); return; }
    if (!r.ok) { const e = await r.json().catch(() => ({})); setMsg(e.error || "Submission failed."); return; }
    setDone(true); setMsg("Submitted — it will be scored by peer review.");
  }

  if (loading) return <div className={s.wrap}><div className={s.state}>Loading…</div></div>;
  if (!problem) return <div className={s.wrap}><div className={s.state}>Problem not found.</div></div>;

  return (
    <div className={s.wrap}>
      <Link href="/caliber" className={s.muted}>← Caliber</Link>
      <h1 className={s.h1} style={{ marginTop: ".5rem" }}>Open Problem</h1>
      <p style={{ fontSize: "1.05rem" }}>{problem.prompt}</p>
      <div className={s.card} style={{ cursor: "default" }}>
        <strong className={s.muted}>Rubric ({problem.maxPoints} pts)</strong>
        {problem.rubric.map((c) => (
          <div key={c.key} className={s.rowBetween}><span>{c.label}</span><span className={s.muted}>{c.maxPoints}</span></div>
        ))}
      </div>
      <textarea className={s.input} style={{ minHeight: 200, marginTop: "1rem" }} value={answer}
        onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer" disabled={done} />
      {!done && <button className={s.btn} style={{ marginTop: "1rem" }} onClick={submit} disabled={!answer.trim()}>Submit</button>}
      {msg && <p className={s.muted} style={{ marginTop: ".75rem" }}>{msg}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Review inbox** (`reviews/page.tsx`)

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import s from "../caliber.module.css";

interface Criterion { key: string; label: string; maxPoints: number; }
interface Task { id: string; answer: string; problem: { id: string; prompt: string; rubric: Criterion[]; maxPoints: number }; }

export default function ReviewInbox() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/caliber/reviews/queue");
    if (r.status === 401) { setAuthed(false); setLoading(false); return; }
    const d = await r.json().catch(() => ({ tasks: [] }));
    setTasks(d.tasks || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function setScore(taskId: string, key: string, v: number) {
    setScores((prev) => ({ ...prev, [taskId]: { ...prev[taskId], [key]: v } }));
  }

  async function submitReview(t: Task) {
    setMsg(null);
    const r = await fetch(`/api/caliber/reviews/${t.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scores: scores[t.id] || {} }),
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); setMsg(e.error || "Review failed."); return; }
    setTasks((prev) => prev.filter((x) => x.id !== t.id)); setMsg("Review submitted.");
  }

  if (loading) return <div className={s.wrap}><div className={s.state}>Loading…</div></div>;
  if (!authed) return <div className={s.wrap}><div className={s.state}>Log in to review peers.</div></div>;

  return (
    <div className={s.wrap}>
      <Link href="/caliber" className={s.muted}>← Caliber</Link>
      <h1 className={s.h1} style={{ marginTop: ".5rem" }}>Review Inbox</h1>
      {msg && <p className={s.muted}>{msg}</p>}
      {tasks.length === 0 ? <div className={s.state}>Nothing to review right now.</div> : tasks.map((t) => (
        <div key={t.id} className={s.card} style={{ cursor: "default" }}>
          <div className={s.muted}>{t.problem.prompt}</div>
          <p style={{ whiteSpace: "pre-wrap", margin: ".5rem 0" }}>{t.answer}</p>
          {t.problem.rubric.map((c) => (
            <div key={c.key} className={s.rowBetween}>
              <span>{c.label} (0–{c.maxPoints})</span>
              <input className={s.input} style={{ width: 90 }} type="number" min={0} max={c.maxPoints}
                onChange={(e) => setScore(t.id, c.key, Number(e.target.value))} />
            </div>
          ))}
          <button className={s.btn} style={{ marginTop: ".75rem" }} onClick={() => submitReview(t)}>Submit review</button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Build + full test suite + commit**

Run: `cd frontend && npm run build 2>&1 | tail -6 && npm run test:run 2>&1 | tail -4`
Expected: build success (open + reviews routes/pages present); all Vitest tests pass.
```bash
git add "frontend/src/app/caliber/open/[id]/page.tsx" "frontend/src/app/caliber/reviews/page.tsx"
git commit -m "feat(caliber-ui): open solve page + peer review inbox"
```

---

## Done criteria for Module 6

- `npm run test:run` green incl. the aggregation tests.
- `npx prisma generate` succeeds with the 3 open-eval models + 2 User relations.
- `npm run build` succeeds; all open/review routes + the two pages present.
- **Review integrity:** a user cannot review their own submission (403) or the same submission twice (`@@unique` + 409); scores are validated per-criterion against the rubric's `maxPoints`; a submission flips to "scored" with a rounded-mean score only at `MIN_REVIEWS`.
- Open problems intentionally have NO hidden answer key (rubric is public) — this flow never calls the deterministic `evaluate()` (grep the open/review routes for `evaluate` — absent).

**Next module:** Foundation re-theme (Module 4) — rename the legacy gaming surfaces (Hub→Track, GameJam→League), strip gaming copy/art, apply the Caliber brand. Its own plan.

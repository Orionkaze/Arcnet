# Caliber Practice UI — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The student-facing practice surface — browse tracks, open a problem, submit an answer, and see instant feedback + the rating delta — consuming the Module-2 `/api/caliber/*` routes.

**Architecture:** Standalone Next.js App-Router pages under `frontend/src/app/caliber/*`, deliberately independent of the legacy gaming shell (the re-theme is a later module). One small **pure UI helper** (`inputKindForProblem`) is unit-tested; the pages themselves are build-verified and browser-checked for their logged-out/empty states (no live DB here, same approach as the DMs module). Minimal, neutral dark styling via a local CSS module — no dependency on `home.css`.

**Tech Stack:** Next.js (client components), TypeScript, Vitest for the pure helper. Consumes GET `/api/caliber/tracks`, `/api/caliber/tracks/[slug]/problems`, `/api/caliber/problems/[id]`, POST `/api/caliber/problems/[id]/submit`, GET `/api/caliber/me/ratings`.

**Module 3 of the Caliber roadmap** (spec: `docs/superpowers/specs/2026-07-18-caliber-pivot-design.md`).

---

## File Structure

- `frontend/src/app/caliber/lib/inputKind.ts` — pure: map a problem `type` → input widget kind. (+ test)
- `frontend/src/app/caliber/caliber.module.css` — local, self-contained styles.
- `frontend/src/app/caliber/page.tsx` — tracks index (server-safe shell + client fetch).
- `frontend/src/app/caliber/tracks/[slug]/page.tsx` — problem list for a track.
- `frontend/src/app/caliber/problems/[id]/page.tsx` — the solve screen (fetch problem, submit, show feedback + rating delta).
- `frontend/src/app/caliber/components/SolveCard.tsx` — client component: renders the right input for the problem type, submits, shows result.

All paths relative to `/Users/vivek/Arcnet`; run commands from `cd /Users/vivek/Arcnet/frontend`.

---

## Chunk 1: Pure helper (TDD)

### Task 1: `inputKindForProblem`

**Files:**
- Create: `frontend/src/app/caliber/lib/inputKind.ts`
- Test: `frontend/src/app/caliber/lib/inputKind.test.ts`

Numeric + guesstimate → a single number input; mcq → option buttons.

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { inputKindForProblem } from "./inputKind";

describe("inputKindForProblem", () => {
  it("numeric -> number", () => { expect(inputKindForProblem("numeric")).toBe("number"); });
  it("guesstimate -> number", () => { expect(inputKindForProblem("guesstimate")).toBe("number"); });
  it("mcq -> choice", () => { expect(inputKindForProblem("mcq")).toBe("choice"); });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd frontend && npm run test:run -- src/app/caliber/lib/inputKind.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import type { ProblemType } from "@/lib/caliber/evaluation/types";

export type InputKind = "number" | "choice";

export function inputKindForProblem(type: ProblemType): InputKind {
  return type === "mcq" ? "choice" : "number";
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `cd frontend && npm run test:run -- src/app/caliber/lib/inputKind.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/caliber/lib/inputKind.ts frontend/src/app/caliber/lib/inputKind.test.ts
git commit -m "feat(caliber-ui): pure input-kind helper"
```

---

## Chunk 2: Styles + tracks index

### Task 2: Local styles

**Files:**
- Create: `frontend/src/app/caliber/caliber.module.css`

- [ ] **Step 1: Write the stylesheet** (self-contained, dark neutral)

```css
.wrap { max-width: 860px; margin: 0 auto; padding: 2rem 1.25rem; color: #E8EAED; }
.h1 { font-size: 1.6rem; font-weight: 700; letter-spacing: -0.01em; margin: 0 0 .25rem; }
.sub { color: #9AA0A6; margin: 0 0 1.5rem; font-size: .95rem; }
.card { display: block; background: #12151A; border: 1px solid #262B33; border-radius: 12px; padding: 1rem 1.15rem; margin-bottom: .75rem; text-decoration: none; color: inherit; transition: border-color .15s; }
.card:hover { border-color: #3B82F6; }
.rowBetween { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.pill { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #3B82F6; background: rgba(59,130,246,.12); padding: .15rem .5rem; border-radius: 999px; }
.muted { color: #9AA0A6; font-size: .85rem; }
.input { width: 100%; background: #0C0E12; border: 1px solid #262B33; border-radius: 10px; color: #fff; padding: .7rem .9rem; font-size: 1rem; }
.input:focus { outline: none; border-color: #3B82F6; }
.btn { background: #3B82F6; color: #fff; border: none; border-radius: 10px; padding: .7rem 1.2rem; font-weight: 600; cursor: pointer; }
.btn:disabled { opacity: .5; cursor: default; }
.choice { display: block; width: 100%; text-align: left; background: #0C0E12; border: 1px solid #262B33; border-radius: 10px; color: #E8EAED; padding: .7rem .9rem; margin-bottom: .5rem; cursor: pointer; }
.choice:hover { border-color: #3B82F6; }
.choiceSel { border-color: #3B82F6; background: rgba(59,130,246,.1); }
.result { margin-top: 1rem; border-radius: 12px; padding: 1rem; border: 1px solid #262B33; background: #12151A; }
.delta { font-weight: 700; }
.deltaUp { color: #22C55E; }
.deltaDown { color: #F87171; }
.state { text-align: center; color: #9AA0A6; padding: 3rem 1rem; }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/caliber/caliber.module.css
git commit -m "feat(caliber-ui): local styles"
```

### Task 3: Tracks index page

**Files:**
- Create: `frontend/src/app/caliber/page.tsx`

Client component: fetch `/api/caliber/tracks`, render cards linking to each track. Handle loading / empty / error.

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import s from "./caliber.module.css";

interface Track { id: string; slug: string; name: string; kind: string; description: string; }

export default function CaliberHome() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/caliber/tracks")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) setTracks(d.tracks || []); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={s.wrap}>
      <h1 className={s.h1}>Caliber</h1>
      <p className={s.sub}>Practice real problems. Get instant feedback. Build a rating that proves your ability.</p>
      {loading ? (
        <div className={s.state}>Loading tracks…</div>
      ) : error ? (
        <div className={s.state}>Could not load tracks.</div>
      ) : tracks.length === 0 ? (
        <div className={s.state}>No tracks yet.</div>
      ) : (
        tracks.map((t) => (
          <Link key={t.id} href={`/caliber/tracks/${t.slug}`} className={s.card}>
            <div className={s.rowBetween}>
              <strong>{t.name}</strong>
              <span className={s.pill}>{t.kind}</span>
            </div>
            <div className={s.muted}>{t.description}</div>
          </Link>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: "Compiled successfully"; `/caliber` route present.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/caliber/page.tsx
git commit -m "feat(caliber-ui): tracks index page"
```

---

## Chunk 3: Track problems + solve screen

### Task 4: Track problems page

**Files:**
- Create: `frontend/src/app/caliber/tracks/[slug]/page.tsx`

Fetch `/api/caliber/tracks/{slug}/problems`; list problems linking to the solve screen; show difficulty.

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import s from "../../caliber.module.css";

interface PublicProblem { id: string; type: string; prompt: string; difficulty: number; maxPoints: number; }

export default function TrackPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [name, setName] = useState("");
  const [problems, setProblems] = useState<PublicProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/caliber/tracks/${slug}/problems`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) { setName(d.track?.name || slug); setProblems(d.problems || []); } })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div className={s.wrap}>
      <Link href="/caliber" className={s.muted}>← Tracks</Link>
      <h1 className={s.h1} style={{ marginTop: ".5rem" }}>{name || "Track"}</h1>
      {loading ? (
        <div className={s.state}>Loading…</div>
      ) : error ? (
        <div className={s.state}>Could not load problems.</div>
      ) : problems.length === 0 ? (
        <div className={s.state}>No problems in this track yet.</div>
      ) : (
        problems.map((p) => (
          <Link key={p.id} href={`/caliber/problems/${p.id}`} className={s.card}>
            <div className={s.rowBetween}>
              <span>{p.prompt}</span>
              <span className={s.pill}>{p.difficulty}</span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: success; route present.

- [ ] **Step 3: Commit**

```bash
git add "frontend/src/app/caliber/tracks/[slug]/page.tsx"
git commit -m "feat(caliber-ui): track problems page"
```

### Task 5: SolveCard component

**Files:**
- Create: `frontend/src/app/caliber/components/SolveCard.tsx`

Given a public problem, render the right input (number for numeric/guesstimate; buttons for mcq), POST to submit, and render the result (score/feedback + rating delta). For mcq the submitted `value` is the chosen option index; for number it's `Number(input)`.

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useState } from "react";
import s from "../caliber.module.css";
import { inputKindForProblem, type InputKind } from "../lib/inputKind";
import type { ProblemType } from "@/lib/caliber/evaluation/types";

export interface PublicProblem {
  id: string; type: ProblemType; prompt: string; difficulty: number; maxPoints: number; optionCount?: number;
}
interface SubmitResponse {
  result: { score: number; maxPoints: number; feedback: string };
  rating: number; ratingDelta: number; countedForRating: boolean;
}

export default function SolveCard({ problem }: { problem: PublicProblem }) {
  const kind: InputKind = inputKindForProblem(problem.type);
  const [numberValue, setNumberValue] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resp, setResp] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = kind === "number" ? numberValue.trim() !== "" && Number.isFinite(Number(numberValue)) : choice !== null;

  async function submit() {
    setSubmitting(true); setError(null);
    const value = kind === "number" ? Number(numberValue) : choice;
    try {
      const r = await fetch(`/api/caliber/problems/${problem.id}/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }),
      });
      if (r.status === 401) { setError("Log in to submit and earn a rating."); return; }
      if (!r.ok) { setError("Submission failed."); return; }
      setResp(await r.json());
    } catch { setError("Submission failed."); }
    finally { setSubmitting(false); }
  }

  return (
    <div>
      <div className={s.card} style={{ cursor: "default" }}>
        <div className={s.rowBetween}>
          <span className={s.pill}>{problem.type}</span>
          <span className={s.muted}>Difficulty {problem.difficulty}</span>
        </div>
        <p style={{ margin: ".75rem 0 1rem", fontSize: "1.05rem" }}>{problem.prompt}</p>

        {kind === "number" ? (
          <input
            className={s.input}
            inputMode="decimal"
            placeholder="Your answer"
            value={numberValue}
            onChange={(e) => setNumberValue(e.target.value)}
            disabled={!!resp}
          />
        ) : (
          <div>
            {Array.from({ length: problem.optionCount ?? 0 }).map((_, i) => (
              <button
                key={i}
                className={`${s.choice} ${choice === i ? s.choiceSel : ""}`}
                onClick={() => setChoice(i)}
                disabled={!!resp}
              >
                Option {i + 1}
              </button>
            ))}
          </div>
        )}

        {!resp && (
          <button className={s.btn} style={{ marginTop: "1rem" }} onClick={submit} disabled={!canSubmit || submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        )}
        {error && <p className={s.muted} style={{ marginTop: ".75rem" }}>{error}</p>}
      </div>

      {resp && (
        <div className={s.result}>
          <div className={s.rowBetween}>
            <strong>{resp.result.score} / {resp.result.maxPoints}</strong>
            {resp.countedForRating ? (
              <span className={`${s.delta} ${resp.ratingDelta >= 0 ? s.deltaUp : s.deltaDown}`}>
                {resp.ratingDelta >= 0 ? "+" : ""}{resp.ratingDelta} → {resp.rating}
              </span>
            ) : (
              <span className={s.muted}>Practice (rating unchanged)</span>
            )}
          </div>
          <p style={{ margin: ".5rem 0 0" }}>{resp.result.feedback}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: success (component compiles; used by the next page).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/caliber/components/SolveCard.tsx
git commit -m "feat(caliber-ui): SolveCard (typed input + submit + result)"
```

### Task 6: Solve page

**Files:**
- Create: `frontend/src/app/caliber/problems/[id]/page.tsx`

Fetch the public problem and hand it to `SolveCard`.

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import s from "../../caliber.module.css";
import SolveCard, { type PublicProblem } from "../../components/SolveCard";

export default function ProblemPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [problem, setProblem] = useState<PublicProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/caliber/problems/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) setProblem(d.problem); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className={s.wrap}>
      <Link href="/caliber" className={s.muted}>← Tracks</Link>
      <div style={{ marginTop: ".75rem" }}>
        {loading ? (
          <div className={s.state}>Loading…</div>
        ) : error || !problem ? (
          <div className={s.state}>Problem not found.</div>
        ) : (
          <SolveCard problem={problem} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check + full test suite**

Run: `cd frontend && npm run build 2>&1 | tail -6 && npm run test:run 2>&1 | tail -4`
Expected: build "Compiled successfully" with `/caliber/problems/[id]` present; all Vitest tests pass.

- [ ] **Step 3: Commit**

```bash
git add "frontend/src/app/caliber/problems/[id]/page.tsx"
git commit -m "feat(caliber-ui): solve page"
```

---

## Done criteria for Module 3

- `npm run test:run` green (incl. the `inputKind` test).
- `npm run build` succeeds; routes `/caliber`, `/caliber/tracks/[slug]`, `/caliber/problems/[id]` present.
- The pages render their loading/empty/logged-out states without a DB (browser-verifiable): `/caliber` shows "Loading tracks…" then "Could not load tracks." (API 500 without DB) or "No tracks yet." — no crash, no console error from the page itself.
- The solve screen never displays an answer key (it only ever has the public problem shape).
- No import of the legacy `home.css` or gaming components (`grep -rn "home.css\|components/home" frontend/src/app/caliber` is empty) — the surface is re-theme-independent.

**Next module:** Competitions/Leagues (Module 5) — timed problem sets + live leaderboard, reusing the engine + problem bank. Its own plan.

# Caliber Core Engine — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the two pure, deterministic core units that make Caliber defensible — the **evaluation engine** (scores a submission against a problem, instantly) and the **rating service** (updates a difficulty-weighted rating) — starting with the Guesstimate scorer.

**Architecture:** Pure TypeScript libraries under `src/lib/caliber/`, zero IO / DB / React dependencies, so they are unit-testable in isolation and reused by every later module (problem bank, practice UI, competitions). `evaluate(problem, submission) → EvaluationResult` dispatches by `problem.type` to per-type scorers. `applyResult(rating, difficulty, outcome) → newRating` is a pure Elo update. Everything is data-in/data-out.

**Tech Stack:** TypeScript (ESM, `moduleResolution: bundler`), Vitest (new — this plan adds it). No Next runtime, no Prisma in these units.

**Module 1 of the Caliber roadmap** (spec: `docs/superpowers/specs/2026-07-18-caliber-pivot-design.md`). Later modules (problem bank/persistence, practice UI, re-theme, competitions, open-ended eval, mentors/jobs) get their own plans and consume these interfaces.

**Rating algorithm decision:** v1 uses **Elo** (simple, deterministic, well-understood, trivially testable). Glicko-2's rating-deviation is deferred (YAGNI until there's volume that needs confidence intervals). This resolves the spec's open item #3 for v1.

---

## File Structure

- `frontend/vitest.config.ts` — Vitest config (node environment; the units are pure).
- `frontend/package.json` — add `test` / `test:run` scripts + vitest devDep.
- `frontend/src/lib/caliber/evaluation/types.ts` — shared types: `Problem`, `Submission`, `EvaluationResult`, `Scorer`.
- `frontend/src/lib/caliber/evaluation/scorers/numeric.ts` — exact/tolerance numeric scorer.
- `frontend/src/lib/caliber/evaluation/scorers/guesstimate.ts` — log-ratio band scorer (the flagship).
- `frontend/src/lib/caliber/evaluation/scorers/mcq.ts` — single-choice scorer.
- `frontend/src/lib/caliber/evaluation/index.ts` — `evaluate()` dispatcher.
- `frontend/src/lib/caliber/rating/elo.ts` — pure Elo math.
- `frontend/src/lib/caliber/rating/index.ts` — rating service surface (`applyResult`).
- Tests co-located as `*.test.ts` next to each unit.

All paths below are relative to the repo root (`/Users/vivek/Arcnet`).

---

## Chunk 1: Test harness + shared types

### Task 1: Install and configure Vitest

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`

- [ ] **Step 1: Add Vitest**

Run: `cd frontend && npm install -D vitest@^2`
Expected: `vitest` appears in devDependencies, install exits 0.

- [ ] **Step 2: Add test scripts to `frontend/package.json`**

In the `"scripts"` block add:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 3: Create `frontend/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Sanity-check the runner with a trivial test**

Create `frontend/src/lib/caliber/__smoke__.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("smoke", () => { it("runs", () => { expect(1 + 1).toBe(2); }); });
```
Run: `cd frontend && npm run test:run -- src/lib/caliber/__smoke__.test.ts`
Expected: 1 passed.

- [ ] **Step 5: Delete the smoke test and commit**

```bash
rm frontend/src/lib/caliber/__smoke__.test.ts
git add frontend/package.json frontend/vitest.config.ts frontend/package-lock.json
git commit -m "test: add vitest for caliber core units"
```

### Task 2: Shared evaluation types

**Files:**
- Create: `frontend/src/lib/caliber/evaluation/types.ts`

- [ ] **Step 1: Write the types** (no test — type-only module; consumers' tests exercise them)

```ts
// Discriminated union of problem kinds the engine can score.
export type ProblemType = "numeric" | "guesstimate" | "mcq";

export interface BaseProblem {
  id: string;
  type: ProblemType;
  /** Difficulty as a rating number (same scale as user ratings), e.g. 1500. */
  difficulty: number;
  maxPoints: number;
}

export interface NumericProblem extends BaseProblem {
  type: "numeric";
  answer: number;
  /** Absolute tolerance; |submitted - answer| <= tolerance scores full. */
  tolerance: number;
}

export interface GuesstimateBand {
  /** Award `points` when the closeness ratio (>=1) is <= maxRatio. */
  maxRatio: number;
  points: number;
}

export interface GuesstimateProblem extends BaseProblem {
  type: "guesstimate";
  answer: number;
  /**
   * Bands ordered from tightest to loosest ratio. Authoring contract (enforced
   * by the later problem-bank module): the tightest band's `points` MUST equal
   * `maxPoints`, so a perfect estimate yields outcome 1 and a full rating win.
   */
  bands: GuesstimateBand[];
}

export interface McqProblem extends BaseProblem {
  type: "mcq";
  /** Index of the correct option. */
  correctIndex: number;
  optionCount: number;
}

export type Problem = NumericProblem | GuesstimateProblem | McqProblem;

export interface Submission {
  /** Numeric answer for numeric/guesstimate; chosen option index for mcq. */
  value: number;
}

export interface EvaluationResult {
  /** Points awarded, 0..maxPoints. */
  score: number;
  maxPoints: number;
  /** Normalized outcome 0..1 (score / maxPoints), fed to the rating service. */
  outcome: number;
  /** Human-readable, deterministic feedback. */
  feedback: string;
}

export type Scorer<P extends Problem> = (problem: P, submission: Submission) => EvaluationResult;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/caliber/evaluation/types.ts
git commit -m "feat(caliber): evaluation engine shared types"
```

---

## Chunk 2: Scorers (TDD, one per type)

### Task 3: Numeric scorer

**Files:**
- Create: `frontend/src/lib/caliber/evaluation/scorers/numeric.ts`
- Test: `frontend/src/lib/caliber/evaluation/scorers/numeric.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { scoreNumeric } from "./numeric";
import type { NumericProblem } from "../types";

const p: NumericProblem = { id: "n1", type: "numeric", difficulty: 1500, maxPoints: 100, answer: 42, tolerance: 1 };

describe("scoreNumeric", () => {
  it("full score within tolerance", () => {
    const r = scoreNumeric(p, { value: 42.5 });
    expect(r.score).toBe(100);
    expect(r.outcome).toBe(1);
  });
  it("zero outside tolerance", () => {
    const r = scoreNumeric(p, { value: 50 });
    expect(r.score).toBe(0);
    expect(r.outcome).toBe(0);
  });
  it("boundary is inclusive", () => {
    expect(scoreNumeric(p, { value: 43 }).score).toBe(100);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd frontend && npm run test:run -- src/lib/caliber/evaluation/scorers/numeric.test.ts`
Expected: FAIL (module not found / `scoreNumeric` undefined).

- [ ] **Step 3: Implement**

```ts
import type { NumericProblem, Submission, EvaluationResult } from "../types";

export function scoreNumeric(problem: NumericProblem, submission: Submission): EvaluationResult {
  const within = Math.abs(submission.value - problem.answer) <= problem.tolerance;
  const score = within ? problem.maxPoints : 0;
  return {
    score,
    maxPoints: problem.maxPoints,
    outcome: problem.maxPoints === 0 ? 0 : score / problem.maxPoints,
    feedback: within
      ? "Correct — within the accepted tolerance."
      : `Not within tolerance. Expected ${problem.answer} ± ${problem.tolerance}.`,
  };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `cd frontend && npm run test:run -- src/lib/caliber/evaluation/scorers/numeric.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/caliber/evaluation/scorers/numeric.ts frontend/src/lib/caliber/evaluation/scorers/numeric.test.ts
git commit -m "feat(caliber): numeric scorer"
```

### Task 4: Guesstimate scorer (flagship)

**Files:**
- Create: `frontend/src/lib/caliber/evaluation/scorers/guesstimate.ts`
- Test: `frontend/src/lib/caliber/evaluation/scorers/guesstimate.test.ts`

Design: closeness `ratio = max(value/answer, answer/value)` (always ≥ 1, order-of-magnitude aware). Walk `bands` (tightest→loosest); award the first band whose `maxRatio >= ratio`. No band matched ⇒ 0. Non-positive submission ⇒ 0 (guesstimates are positive magnitudes).

> **v1 scope note:** this scores the *final-answer magnitude* only. Assumption-by-assumption rubric scoring (spec §3 "structured rubric") needs problem-bank structure and is deferred to a later module — a conscious deferral, not an omission.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { scoreGuesstimate } from "./guesstimate";
import type { GuesstimateProblem } from "../types";

// answer 1,000,000; full within 2x, half within 10x, else 0
const p: GuesstimateProblem = {
  id: "g1", type: "guesstimate", difficulty: 1600, maxPoints: 100, answer: 1_000_000,
  bands: [ { maxRatio: 2, points: 100 }, { maxRatio: 10, points: 50 } ],
};

describe("scoreGuesstimate", () => {
  it("full score within 2x (either direction)", () => {
    expect(scoreGuesstimate(p, { value: 1_500_000 }).score).toBe(100);
    expect(scoreGuesstimate(p, { value: 700_000 }).score).toBe(100);
  });
  it("half score within 10x", () => {
    expect(scoreGuesstimate(p, { value: 8_000_000 }).score).toBe(50);
  });
  it("zero beyond loosest band", () => {
    expect(scoreGuesstimate(p, { value: 50 }).score).toBe(0);
  });
  it("zero for non-positive submission", () => {
    expect(scoreGuesstimate(p, { value: 0 }).score).toBe(0);
    expect(scoreGuesstimate(p, { value: -5 }).score).toBe(0);
  });
  it("outcome is normalized", () => {
    expect(scoreGuesstimate(p, { value: 8_000_000 }).outcome).toBeCloseTo(0.5);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd frontend && npm run test:run -- src/lib/caliber/evaluation/scorers/guesstimate.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import type { GuesstimateProblem, Submission, EvaluationResult } from "../types";

export function scoreGuesstimate(problem: GuesstimateProblem, submission: Submission): EvaluationResult {
  const { value } = submission;
  let score = 0;
  if (value > 0 && problem.answer > 0) {
    const ratio = Math.max(value / problem.answer, problem.answer / value);
    const band = [...problem.bands].sort((a, b) => a.maxRatio - b.maxRatio).find((b) => ratio <= b.maxRatio);
    score = band ? band.points : 0;
  }
  const orderOfMag = Math.round(Math.log10(problem.answer));
  return {
    score,
    maxPoints: problem.maxPoints,
    outcome: problem.maxPoints === 0 ? 0 : score / problem.maxPoints,
    feedback:
      score === problem.maxPoints
        ? "Great estimate — right order of magnitude."
        : score > 0
        ? "Close, but off by roughly an order of magnitude — tighten your assumptions."
        : `Off by several orders of magnitude. The answer is ~10^${orderOfMag}.`,
  };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `cd frontend && npm run test:run -- src/lib/caliber/evaluation/scorers/guesstimate.test.ts`
Expected: all passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/caliber/evaluation/scorers/guesstimate.ts frontend/src/lib/caliber/evaluation/scorers/guesstimate.test.ts
git commit -m "feat(caliber): guesstimate scorer (log-ratio bands)"
```

### Task 5: MCQ scorer

**Files:**
- Create: `frontend/src/lib/caliber/evaluation/scorers/mcq.ts`
- Test: `frontend/src/lib/caliber/evaluation/scorers/mcq.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { scoreMcq } from "./mcq";
import type { McqProblem } from "../types";

const p: McqProblem = { id: "m1", type: "mcq", difficulty: 1400, maxPoints: 10, correctIndex: 2, optionCount: 4 };

describe("scoreMcq", () => {
  it("full score for correct option", () => {
    expect(scoreMcq(p, { value: 2 }).score).toBe(10);
  });
  it("zero for wrong option", () => {
    expect(scoreMcq(p, { value: 1 }).score).toBe(0);
  });
  it("zero for out-of-range option", () => {
    expect(scoreMcq(p, { value: 9 }).score).toBe(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd frontend && npm run test:run -- src/lib/caliber/evaluation/scorers/mcq.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import type { McqProblem, Submission, EvaluationResult } from "../types";

export function scoreMcq(problem: McqProblem, submission: Submission): EvaluationResult {
  const inRange = Number.isInteger(submission.value) && submission.value >= 0 && submission.value < problem.optionCount;
  const correct = inRange && submission.value === problem.correctIndex;
  const score = correct ? problem.maxPoints : 0;
  return {
    score,
    maxPoints: problem.maxPoints,
    outcome: problem.maxPoints === 0 ? 0 : score / problem.maxPoints,
    feedback: correct ? "Correct." : "Incorrect.",
  };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `cd frontend && npm run test:run -- src/lib/caliber/evaluation/scorers/mcq.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/caliber/evaluation/scorers/mcq.ts frontend/src/lib/caliber/evaluation/scorers/mcq.test.ts
git commit -m "feat(caliber): mcq scorer"
```

---

## Chunk 3: `evaluate()` dispatcher

### Task 6: Dispatcher

**Files:**
- Create: `frontend/src/lib/caliber/evaluation/index.ts`
- Test: `frontend/src/lib/caliber/evaluation/index.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { evaluate } from "./index";
import type { Problem } from "./types";

describe("evaluate", () => {
  it("routes numeric", () => {
    const p: Problem = { id: "n", type: "numeric", difficulty: 1500, maxPoints: 100, answer: 10, tolerance: 0 };
    expect(evaluate(p, { value: 10 }).score).toBe(100);
  });
  it("routes guesstimate", () => {
    const p: Problem = { id: "g", type: "guesstimate", difficulty: 1500, maxPoints: 100, answer: 100, bands: [{ maxRatio: 2, points: 100 }] };
    expect(evaluate(p, { value: 150 }).score).toBe(100);
  });
  it("routes mcq", () => {
    const p: Problem = { id: "m", type: "mcq", difficulty: 1500, maxPoints: 10, correctIndex: 0, optionCount: 2 };
    expect(evaluate(p, { value: 0 }).score).toBe(10);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd frontend && npm run test:run -- src/lib/caliber/evaluation/index.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import type { Problem, Submission, EvaluationResult } from "./types";
import { scoreNumeric } from "./scorers/numeric";
import { scoreGuesstimate } from "./scorers/guesstimate";
import { scoreMcq } from "./scorers/mcq";

export * from "./types";

export function evaluate(problem: Problem, submission: Submission): EvaluationResult {
  switch (problem.type) {
    case "numeric": return scoreNumeric(problem, submission);
    case "guesstimate": return scoreGuesstimate(problem, submission);
    case "mcq": return scoreMcq(problem, submission);
    default: {
      // Exhaustiveness guard — a new ProblemType without a scorer is a compile error.
      const _exhaustive: never = problem;
      throw new Error(`No scorer for problem type: ${(_exhaustive as Problem).type}`);
    }
  }
}
```

- [ ] **Step 4: Run — expect PASS + full suite green**

Run: `cd frontend && npm run test:run`
Expected: all evaluation tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/caliber/evaluation/index.ts frontend/src/lib/caliber/evaluation/index.test.ts
git commit -m "feat(caliber): evaluate() dispatcher with exhaustiveness guard"
```

---

## Chunk 4: Rating service (Elo, pure)

### Task 7: Elo math

**Files:**
- Create: `frontend/src/lib/caliber/rating/elo.ts`
- Test: `frontend/src/lib/caliber/rating/elo.test.ts`

`expectedScore(r, d) = 1 / (1 + 10^((d - r)/400))`. `newRating = r + K * (outcome - expectedScore)`, `outcome ∈ [0,1]`, default `K = 32`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { expectedScore, updateRating } from "./elo";

describe("elo", () => {
  it("expectedScore is 0.5 for equal rating/difficulty", () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5);
  });
  it("expectedScore rises when rating exceeds difficulty", () => {
    expect(expectedScore(1700, 1500)).toBeGreaterThan(0.5);
  });
  it("winning an equal-difficulty problem gains ~K/2", () => {
    expect(updateRating(1500, 1500, 1, 32)).toBeCloseTo(1516);
  });
  it("failing an equal-difficulty problem loses ~K/2", () => {
    expect(updateRating(1500, 1500, 0, 32)).toBeCloseTo(1484);
  });
  it("partial outcome moves proportionally", () => {
    expect(updateRating(1500, 1500, 0.5, 32)).toBeCloseTo(1500);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd frontend && npm run test:run -- src/lib/caliber/rating/elo.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
export function expectedScore(rating: number, difficulty: number): number {
  return 1 / (1 + Math.pow(10, (difficulty - rating) / 400));
}

export function updateRating(rating: number, difficulty: number, outcome: number, k = 32): number {
  const clamped = Math.max(0, Math.min(1, outcome));
  return rating + k * (clamped - expectedScore(rating, difficulty));
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `cd frontend && npm run test:run -- src/lib/caliber/rating/elo.test.ts`
Expected: all passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/caliber/rating/elo.ts frontend/src/lib/caliber/rating/elo.test.ts
git commit -m "feat(caliber): pure Elo rating math"
```

### Task 8: Rating service surface

**Files:**
- Create: `frontend/src/lib/caliber/rating/index.ts`
- Test: `frontend/src/lib/caliber/rating/index.test.ts`

Thin surface that maps an `EvaluationResult` to a rating update, so callers pass domain objects, not raw numbers. Rounds to an integer rating (ratings are displayed as whole numbers).

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { applyResult, DEFAULT_RATING } from "./index";

describe("applyResult", () => {
  it("exposes a default starting rating", () => {
    expect(DEFAULT_RATING).toBe(1200);
  });
  it("increases rating on a strong outcome vs harder problem", () => {
    const next = applyResult(1200, 1400, { outcome: 1 });
    expect(next).toBeGreaterThan(1200);
    expect(Number.isInteger(next)).toBe(true);
  });
  it("decreases rating on failure vs easier problem", () => {
    expect(applyResult(1400, 1200, { outcome: 0 })).toBeLessThan(1400);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd frontend && npm run test:run -- src/lib/caliber/rating/index.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import { updateRating } from "./elo";

/** New players start here. */
export const DEFAULT_RATING = 1200;

/** Apply an evaluation outcome (0..1) against a problem's difficulty to a user's track rating. */
export function applyResult(
  currentRating: number,
  problemDifficulty: number,
  result: { outcome: number },
  k = 32,
): number {
  return Math.round(updateRating(currentRating, problemDifficulty, result.outcome, k));
}
```

- [ ] **Step 4: Run — expect PASS + full suite green**

Run: `cd frontend && npm run test:run`
Expected: every caliber test passes.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/caliber/rating/index.ts frontend/src/lib/caliber/rating/index.test.ts
git commit -m "feat(caliber): rating service surface (applyResult)"
```

---

## Done criteria for Module 1

- `cd frontend && npm run test:run` is green with coverage of every scorer, the dispatcher (incl. exhaustiveness guard), and the rating math + surface.
- `npm run build` still succeeds (these are additive pure modules; run it once at the end to confirm no breakage).
- No DB, React, or Next imports in `src/lib/caliber/**` (grep to confirm: `grep -rn "next/\|@prisma\|react" frontend/src/lib/caliber` returns nothing).

**Next module:** Problem bank + persistence (Prisma `Problem`/`Submission`/`Rating` tables) — its own plan, consuming `evaluate()` and `applyResult()` from this module.

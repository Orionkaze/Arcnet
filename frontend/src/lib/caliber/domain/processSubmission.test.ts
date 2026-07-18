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

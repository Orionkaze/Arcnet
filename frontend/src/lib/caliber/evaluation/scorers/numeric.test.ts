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

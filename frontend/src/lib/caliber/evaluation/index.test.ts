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

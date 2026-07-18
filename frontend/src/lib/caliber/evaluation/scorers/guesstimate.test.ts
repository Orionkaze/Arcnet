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
  it("selects the tightest qualifying band regardless of input order", () => {
    const rev: GuesstimateProblem = { id: "g2", type: "guesstimate", difficulty: 1600, maxPoints: 100, answer: 1_000_000,
      bands: [ { maxRatio: 10, points: 50 }, { maxRatio: 2, points: 100 } ] };
    expect(scoreGuesstimate(rev, { value: 1_500_000 }).score).toBe(100); // within 2x -> tightest band wins
  });
});

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

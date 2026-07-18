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

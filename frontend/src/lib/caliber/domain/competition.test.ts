import { describe, it, expect } from "vitest";
import { competitionState, rankLeaderboard } from "./competition";

describe("competitionState", () => {
  const s = 1000, e = 2000;
  it("upcoming before start", () => expect(competitionState(500, s, e)).toBe("upcoming"));
  it("live within window (inclusive)", () => {
    expect(competitionState(1000, s, e)).toBe("live");
    expect(competitionState(1500, s, e)).toBe("live");
    expect(competitionState(2000, s, e)).toBe("live");
  });
  it("ended after end", () => expect(competitionState(2001, s, e)).toBe("ended"));
});

describe("rankLeaderboard", () => {
  it("orders by score desc then lastAt asc, with competition ranking", () => {
    const out = rankLeaderboard([
      { userId: "a", score: 50, lastAt: 10 },
      { userId: "b", score: 80, lastAt: 30 },
      { userId: "c", score: 80, lastAt: 20 },
      { userId: "d", score: 50, lastAt: 5 },
    ]);
    expect(out.map((r) => r.userId)).toEqual(["c", "b", "d", "a"]);
    expect(out.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });
  it("shares a rank on identical score+lastAt (1,2,2,4)", () => {
    const out = rankLeaderboard([
      { userId: "a", score: 100, lastAt: 5 },
      { userId: "b", score: 90, lastAt: 5 },
      { userId: "c", score: 90, lastAt: 5 },
      { userId: "d", score: 80, lastAt: 5 },
    ]);
    expect(out.map((r) => r.rank)).toEqual([1, 2, 2, 4]);
  });
});

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

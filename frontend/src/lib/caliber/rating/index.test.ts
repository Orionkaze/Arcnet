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

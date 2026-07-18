import { describe, it, expect } from "vitest";
import { aggregateReviews, MIN_REVIEWS } from "./aggregateReviews";

describe("aggregateReviews", () => {
  it("MIN_REVIEWS is 2", () => expect(MIN_REVIEWS).toBe(2));
  it("pending below the review threshold", () => {
    expect(aggregateReviews([80])).toEqual({ status: "pending", score: null, reviewCount: 1 });
    expect(aggregateReviews([])).toEqual({ status: "pending", score: null, reviewCount: 0 });
  });
  it("scored (rounded mean) at/above threshold", () => {
    expect(aggregateReviews([80, 90])).toEqual({ status: "scored", score: 85, reviewCount: 2 });
    expect(aggregateReviews([70, 80, 91])).toEqual({ status: "scored", score: 80, reviewCount: 3 }); // 80.33 -> 80
  });
});

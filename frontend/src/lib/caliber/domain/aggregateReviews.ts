export const MIN_REVIEWS = 2;

export interface Aggregate {
  status: "pending" | "scored";
  score: number | null;
  reviewCount: number;
}

/** reviewerTotals: each reviewer's summed rubric score. */
export function aggregateReviews(reviewerTotals: number[]): Aggregate {
  const reviewCount = reviewerTotals.length;
  if (reviewCount < MIN_REVIEWS) return { status: "pending", score: null, reviewCount };
  const mean = reviewerTotals.reduce((a, b) => a + b, 0) / reviewCount;
  return { status: "scored", score: Math.round(mean), reviewCount };
}

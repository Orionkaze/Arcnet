import { updateRating } from "./elo";

/** New players start here. */
export const DEFAULT_RATING = 1200;

/** Apply an evaluation outcome (0..1) against a problem's difficulty to a user's track rating. */
export function applyResult(
  currentRating: number,
  problemDifficulty: number,
  result: { outcome: number },
  k = 32,
): number {
  return Math.round(updateRating(currentRating, problemDifficulty, result.outcome, k));
}

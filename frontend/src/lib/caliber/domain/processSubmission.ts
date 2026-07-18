import type { Problem, Submission, EvaluationResult } from "../evaluation/types";
import { evaluate } from "../evaluation";
import { applyResult } from "../rating";

export interface ProcessResult {
  result: EvaluationResult;
  newRating: number;
  ratingDelta: number;
}

export function processSubmission(
  problem: Problem,
  submission: Submission,
  currentRating: number,
  countsForRating: boolean,
): ProcessResult {
  const result = evaluate(problem, submission);
  const newRating = countsForRating
    ? applyResult(currentRating, problem.difficulty, { outcome: result.outcome })
    : currentRating;
  return { result, newRating, ratingDelta: newRating - currentRating };
}

import type { NumericProblem, Submission, EvaluationResult } from "../types";

export function scoreNumeric(problem: NumericProblem, submission: Submission): EvaluationResult {
  const within = Math.abs(submission.value - problem.answer) <= problem.tolerance;
  const score = within ? problem.maxPoints : 0;
  return {
    score,
    maxPoints: problem.maxPoints,
    outcome: problem.maxPoints === 0 ? 0 : score / problem.maxPoints,
    feedback: within
      ? "Correct — within the accepted tolerance."
      : "Not within the accepted tolerance — recheck your calculation.",
  };
}

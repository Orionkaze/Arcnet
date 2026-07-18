import type { McqProblem, Submission, EvaluationResult } from "../types";

export function scoreMcq(problem: McqProblem, submission: Submission): EvaluationResult {
  const inRange = Number.isInteger(submission.value) && submission.value >= 0 && submission.value < problem.optionCount;
  const correct = inRange && submission.value === problem.correctIndex;
  const score = correct ? problem.maxPoints : 0;
  return {
    score,
    maxPoints: problem.maxPoints,
    outcome: problem.maxPoints === 0 ? 0 : score / problem.maxPoints,
    feedback: correct ? "Correct." : "Incorrect.",
  };
}

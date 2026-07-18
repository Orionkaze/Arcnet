import type { GuesstimateProblem, Submission, EvaluationResult } from "../types";

export function scoreGuesstimate(problem: GuesstimateProblem, submission: Submission): EvaluationResult {
  const { value } = submission;
  let score = 0;
  if (value > 0 && problem.answer > 0) {
    const ratio = Math.max(value / problem.answer, problem.answer / value);
    const band = [...problem.bands].sort((a, b) => a.maxRatio - b.maxRatio).find((b) => ratio <= b.maxRatio);
    score = band ? band.points : 0;
  }
  const orderOfMag = Math.round(Math.log10(problem.answer));
  return {
    score,
    maxPoints: problem.maxPoints,
    outcome: problem.maxPoints === 0 ? 0 : score / problem.maxPoints,
    feedback:
      score === problem.maxPoints
        ? "Great estimate — right order of magnitude."
        : score > 0
        ? "Close, but off by roughly an order of magnitude — tighten your assumptions."
        : `Off by several orders of magnitude. The answer is ~10^${orderOfMag}.`,
  };
}

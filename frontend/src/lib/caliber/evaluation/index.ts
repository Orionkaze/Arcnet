import type { Problem, Submission, EvaluationResult } from "./types";
import { scoreNumeric } from "./scorers/numeric";
import { scoreGuesstimate } from "./scorers/guesstimate";
import { scoreMcq } from "./scorers/mcq";

export * from "./types";

export function evaluate(problem: Problem, submission: Submission): EvaluationResult {
  switch (problem.type) {
    case "numeric": return scoreNumeric(problem, submission);
    case "guesstimate": return scoreGuesstimate(problem, submission);
    case "mcq": return scoreMcq(problem, submission);
    default: {
      // Exhaustiveness guard — a new ProblemType without a scorer is a compile error.
      const _exhaustive: never = problem;
      throw new Error(`No scorer for problem type: ${(_exhaustive as Problem).type}`);
    }
  }
}

// Discriminated union of problem kinds the engine can score.
export type ProblemType = "numeric" | "guesstimate" | "mcq";

export interface BaseProblem {
  id: string;
  type: ProblemType;
  /** Difficulty as a rating number (same scale as user ratings), e.g. 1500. */
  difficulty: number;
  maxPoints: number;
}

export interface NumericProblem extends BaseProblem {
  type: "numeric";
  answer: number;
  /** Absolute tolerance; |submitted - answer| <= tolerance scores full. */
  tolerance: number;
}

export interface GuesstimateBand {
  /** Award `points` when the closeness ratio (>=1) is <= maxRatio. */
  maxRatio: number;
  points: number;
}

export interface GuesstimateProblem extends BaseProblem {
  type: "guesstimate";
  answer: number;
  /**
   * Bands ordered from tightest to loosest ratio. Authoring contract (enforced
   * by the later problem-bank module): the tightest band's `points` MUST equal
   * `maxPoints`, so a perfect estimate yields outcome 1 and a full rating win.
   */
  bands: GuesstimateBand[];
}

export interface McqProblem extends BaseProblem {
  type: "mcq";
  /** Index of the correct option. */
  correctIndex: number;
  optionCount: number;
}

export type Problem = NumericProblem | GuesstimateProblem | McqProblem;

export interface Submission {
  /** Numeric answer for numeric/guesstimate; chosen option index for mcq. */
  value: number;
}

export interface EvaluationResult {
  /** Points awarded, 0..maxPoints. */
  score: number;
  maxPoints: number;
  /** Normalized outcome 0..1 (score / maxPoints), fed to the rating service. */
  outcome: number;
  /** Human-readable, deterministic feedback. */
  feedback: string;
}

export type Scorer<P extends Problem> = (problem: P, submission: Submission) => EvaluationResult;

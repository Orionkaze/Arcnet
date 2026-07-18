import type { Problem, ProblemType, GuesstimateBand } from "../evaluation/types";

export interface ProblemRow {
  id: string;
  trackId: string;
  type: ProblemType;
  prompt: string;
  difficulty: number;
  maxPoints: number;
  /** Server-only, type-specific answer key. */
  config: Record<string, unknown>;
}

export function toEngineProblem(row: ProblemRow): Problem {
  const base = { id: row.id, difficulty: row.difficulty, maxPoints: row.maxPoints };
  const c = row.config;
  switch (row.type) {
    case "numeric":
      return { ...base, type: "numeric", answer: Number(c.answer), tolerance: Number(c.tolerance) };
    case "guesstimate":
      return { ...base, type: "guesstimate", answer: Number(c.answer), bands: (Array.isArray(c.bands) ? c.bands : []) as GuesstimateBand[] };
    case "mcq":
      return { ...base, type: "mcq", correctIndex: Number(c.correctIndex), optionCount: Number(c.optionCount) };
    default: {
      const _exhaustive: never = row.type;
      throw new Error(`Unknown problem type: ${String(_exhaustive)}`);
    }
  }
}

export function toPublicProblem(row: ProblemRow) {
  const base = { id: row.id, trackId: row.trackId, type: row.type, prompt: row.prompt, difficulty: row.difficulty, maxPoints: row.maxPoints };
  // Only non-answer, client-safe extras are added back per type.
  if (row.type === "mcq") {
    return { ...base, optionCount: Number(row.config.optionCount) };
  }
  return base;
}

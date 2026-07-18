import type { ProblemType } from "@/lib/caliber/evaluation/types";

export type InputKind = "number" | "choice";

export function inputKindForProblem(type: ProblemType): InputKind {
  return type === "mcq" ? "choice" : "number";
}

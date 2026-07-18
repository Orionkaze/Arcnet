import { describe, it, expect } from "vitest";
import { inputKindForProblem } from "./inputKind";

describe("inputKindForProblem", () => {
  it("numeric -> number", () => { expect(inputKindForProblem("numeric")).toBe("number"); });
  it("guesstimate -> number", () => { expect(inputKindForProblem("guesstimate")).toBe("number"); });
  it("mcq -> choice", () => { expect(inputKindForProblem("mcq")).toBe("choice"); });
});

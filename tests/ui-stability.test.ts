import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("layout stability safeguards", () => {
  it("positions the decision tooltip with a compositor transform", () => {
    const decisionMap = source("components/decision-map.tsx");

    expect(decisionMap).toContain("translate3d(");
    expect(decisionMap).not.toContain("-translate-x-1/2 border border-black bg-black p-3");
  });

  it("does not animate link spacing", () => {
    expect(source("components/catalog-explorer.tsx")).not.toContain("group-hover:gap-2");
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Cloudflare Pages hosting safeguards", () => {
  it("recovers duplicated-hostname paths", () => {
    const redirects = readFileSync(path.join(root, "public", "_redirects"), "utf8");

    expect(redirects).toContain("/cp.pingfan.me/ / 301");
    expect(redirects).toContain("/cp.pingfan.me/* /:splat 301");
  });
});

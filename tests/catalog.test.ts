import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import YAML from "yaml";
import { ApisFileSchema, BenchmarksFileSchema, DecisionEstimatesFileSchema, OffersFileSchema, ProductsFileSchema, SourcesFileSchema, VideoProductsFileSchema } from "../lib/schema";
import { hasCompatibleQuotaUnit, parsePlanIds } from "../lib/compare";
import { buildDecisionPoints, decisionPriceRatio, occupiedIntelligenceLevels, paretoFront } from "../lib/pareto";
import { offerPhase } from "../lib/offers";

const root = path.resolve(import.meta.dirname, "..");
const read = (name: string) => YAML.parse(readFileSync(path.join(root, "data", name), "utf8"));
const productsFile = ProductsFileSchema.parse(read("products.yml"));
const sourcesFile = SourcesFileSchema.parse(read("sources.yml"));
const apisFile = ApisFileSchema.parse(read("apis.yml"));
const benchmarksFile = BenchmarksFileSchema.parse(read("benchmarks.yml"));
const videoFile = VideoProductsFileSchema.parse(read("video-products.yml"));
const estimatesFile = DecisionEstimatesFileSchema.parse(read("decision-estimates.yml"));
const offersFile = OffersFileSchema.parse(read("offers.yml"));

describe("catalog integrity", () => {
  it("contains the expanded phase-one product families", () => {
    expect(productsFile.products).toHaveLength(19);
    expect(new Set(productsFile.products.map((p) => p.slug)).size).toBe(19);
    expect(productsFile.products.map((p) => p.slug)).toEqual(expect.arrayContaining(["openrouter", "opencode", "kiro", "amazon-q-developer", "jetbrains-ai", "replit-agent", "devin"]));
  });

  it("resolves every source reference", () => {
    const ids = new Set(sourcesFile.sources.map((source) => source.id));
    const refs = [
      ...productsFile.products.flatMap((p) => [...p.sourceIds, ...p.modelAccess.sourceIds, ...p.plans.flatMap((plan) => plan.sourceIds)]),
      ...apisFile.apiVendors.flatMap((vendor) => vendor.models.flatMap((model) => model.sourceIds)),
      ...estimatesFile.decisionEstimates.flatMap((estimate) => [
        ...estimate.intelligence.sourceIds,
        ...estimate.usage.flatMap((usage) => usage.sourceIds),
      ]),
      ...offersFile.offers.flatMap((offer) => offer.sourceIds),
    ];
    expect(refs.filter((id) => !ids.has(id))).toEqual([]);
  });

  it("publishes the current GLM point plans and keeps V2 as history", () => {
    const glm = productsFile.products.find((p) => p.slug === "glm-coding")!;
    expect(glm.models).toContain("GLM-5.3");
    expect(glm.plans.find((p) => p.id === "glm-lite")).toMatchObject({ status: "current", price: { monthly: 118 } });
    expect(glm.plans.find((p) => p.id === "glm-lite")?.quotas.map((q) => q.amount)).toEqual([2000, 10000]);
    expect(glm.plans.find((p) => p.id === "glm-team-standard")).toMatchObject({ status: "current", price: { monthly: 598 } });
    expect(glm.plans.find((p) => p.id === "glm-v2-lite")).toMatchObject({ status: "legacy", price: { monthly: 49 } });
  });

  it("does not mix legacy plans into the current sale set", () => {
    const alibaba = productsFile.products.find((p) => p.slug === "qwen-code")!;
    expect(alibaba.plans.find((p) => p.id === "alibaba-coding-lite")?.status).toBe("legacy");
    expect(alibaba.plans.find((p) => p.id === "alibaba-coding-pro")?.status).toBe("current");
  });

  it("keeps China and international TRAE records separate", () => {
    const trae = productsFile.products.find((p) => p.slug === "trae")!;
    expect(trae.plans.find((p) => p.id === "trae-cn-free")?.regions).toEqual(["china"]);
    expect(trae.plans.find((p) => p.id === "trae-free")?.regions).toEqual(["international"]);
  });

  it("distinguishes native agents, open shells, and model routers", () => {
    const product = (slug: string) => productsFile.products.find((item) => item.slug === slug)!;
    expect(product("claude-code").modelAccess).toMatchObject({ role: "native_agent", mode: "same_family" });
    expect(product("cursor").modelAccess).toMatchObject({ role: "native_agent", mode: "curated_multi" });
    expect(product("opencode").modelAccess).toMatchObject({ role: "agent_shell", mode: "open_byok" });
    expect(product("openrouter").modelAccess).toMatchObject({ role: "model_router", mode: "marketplace" });
    expect(new Set(productsFile.products.map((item) => item.modelAccess.mode))).toEqual(new Set(["fixed", "same_family", "curated_multi", "open_byok", "marketplace"]));
  });

  it("includes the current SuperGrok Heavy tier", () => {
    const grok = productsFile.products.find((p) => p.slug === "grok")!;
    expect(grok.plans.find((p) => p.id === "supergrok-heavy")?.price.monthly).toBe(300);
    expect(grok.plans.find((p) => p.id === "supergrok-lite")?.price.monthly).toBeNull();
  });

  it("does not embed third-party benchmark scores", () => {
    const serialized = JSON.stringify(benchmarksFile);
    expect(serialized).not.toMatch(/"score"|"rank"|"csv"\s*:/i);
  });

  it("keeps audited API cache fields explicit instead of ambiguous blanks", () => {
    const missingWriteMeaning = apisFile.apiVendors.flatMap((vendor) => vendor.models
      .filter((model) => model.cacheWrite == null && !model.cacheWriteLabel)
      .map((model) => `${vendor.slug}::${model.model}`));
    expect(missingWriteMeaning).toEqual([]);
  });

  it("matches the current official API pricing audit sentinels", () => {
    const api = (slug: string) => apisFile.apiVendors.find((vendor) => vendor.slug === slug)!;
    expect(api("openai").models.find((model) => model.model === "GPT-5.6 Sol")).toMatchObject({ input: 5, cachedInput: 0.5, cacheWrite: 6.25, output: 30 });
    expect(api("google").models.find((model) => model.model === "Gemini 3.5 Flash")).toMatchObject({ input: 1.5, cachedInput: 0.15, output: 9 });
    expect(api("alibaba").models.find((model) => model.model === "qwen3.7-max")).toMatchObject({ input: 2.5, cachedInput: 0.25, cacheWrite: 3.125, output: 7.5 });
    expect(api("zhipu").models.find((model) => model.model === "GLM-5.2")).toMatchObject({ input: 8, cachedInput: 2, output: 28 });
    expect(api("zhipu").models.find((model) => model.model === "GLM-5.3")).toMatchObject({ input: 8, cachedInput: 2, output: 28 });

    const deepseek = api("deepseek").models;
    expect(deepseek).toHaveLength(4);
    expect(deepseek.find((model) => model.model === "DeepSeek V4 Flash" && model.context?.includes("非峰值"))).toMatchObject({ input: 0.22, cachedInput: 0.007, output: 0.66 });
    expect(deepseek.find((model) => model.model === "DeepSeek V4 Pro" && model.context?.includes("峰值") && !model.context?.includes("非峰值"))).toMatchObject({ input: 1.32, cachedInput: 0.044, output: 3.96 });
  });

  it("has a traceable decision estimate for every explicitly priced plan", () => {
    const estimates = new Map(estimatesFile.decisionEstimates.map((estimate) => [estimate.productSlug, estimate]));
    const missing = productsFile.products.flatMap((product) => product.plans
      .filter((plan) => plan.status === "current" && plan.price.monthly !== null && plan.price.monthly > 0)
      .filter((plan) => !estimates.get(product.slug)?.usage.some((usage) => usage.planId === plan.id))
      .map((plan) => `${product.slug}::${plan.id}`));
    expect(missing).toEqual([]);
  });

  it("keeps video products in their own native billing systems", () => {
    expect(videoFile.videoProducts.length).toBeGreaterThanOrEqual(12);
    const units = new Set(videoFile.videoProducts.flatMap((product) => product.rates.map((rate) => rate.billingUnit)));
    expect(units).toContain("credits_per_second");
    expect(units).toContain("credits_per_clip");
    expect(units).toContain("usd_per_second");
    expect(units).toContain("cny_per_second");
  });

  it("resolves every video source reference", () => {
    const ids = new Set(sourcesFile.sources.map((source) => source.id));
    const refs = videoFile.videoProducts.flatMap((product) => [
      ...product.sourceIds,
      ...product.plans.flatMap((plan) => plan.sourceIds),
      ...product.rates.flatMap((rate) => [...rate.sourceIds, ...(rate.fiveSecondCost?.sourceIds ?? [])]),
    ]);
    expect(refs.filter((id) => !ids.has(id))).toEqual([]);
  });

  it("keeps published five-second costs traceable to native rates", () => {
    const kling = videoFile.videoProducts.find((product) => product.slug === "kling")!;
    const jimeng = videoFile.videoProducts.find((product) => product.slug === "jimeng-ai")!;
    expect(kling.rates.find((rate) => rate.id === "kling3-1080-audio")?.fiveSecondCost?.amount).toBe(0.91);
    expect(jimeng.rates.find((rate) => rate.id === "jimeng-seedance20-fast-vip-720")?.fiveSecondCost?.amount).toBe(1.2);
  });
});

describe("offer lifecycle", () => {
  it("automatically leaves expired promotions out of the current set", () => {
    const claude = offersFile.offers.find((offer) => offer.id === "claude-code-weekly-boost-2026")!;
    expect(offerPhase(claude, new Date("2026-08-22T12:00:00Z"))).toBe("current");
    expect(offerPhase(claude, new Date("2026-09-02T12:00:00Z"))).toBe("ended");
  });
});

describe("comparison rules", () => {
  it("restores at most four unique plan ids from a share URL", () => {
    expect(parsePlanIds("a,b,a,c,d,e")).toEqual(["a", "b", "c", "d"]);
  });

  it("rejects unit conversion across custom credit systems", () => {
    const github = productsFile.products.find((p) => p.slug === "github-copilot")!.plans.find((p) => p.id === "copilot-pro")!;
    const trae = productsFile.products.find((p) => p.slug === "trae")!.plans.find((p) => p.id === "trae-pro")!;
    expect(hasCompatibleQuotaUnit([github, trae])).toBe(false);
  });
});

describe("decision-map reference envelope", () => {
  it("compresses the sparse entry-price band and preserves price order", () => {
    expect(decisionPriceRatio(0, 300, 10)).toBe(0);
    expect(decisionPriceRatio(3, 300, 10)).toBeCloseTo(.03);
    expect(decisionPriceRatio(10, 300, 10)).toBeCloseTo(.1);
    expect(decisionPriceRatio(300, 300, 10)).toBe(1);
    expect(decisionPriceRatio(10, 300, 10)).toBeLessThan(decisionPriceRatio(20, 300, 10));

    const focusedMainBand = decisionPriceRatio(50, 300, 10) - decisionPriceRatio(10, 300, 10);
    const oldMainBand = Math.log1p(50) / Math.log1p(300) - Math.log1p(10) / Math.log1p(300);
    expect(focusedMainBand).toBeGreaterThan(oldMainBand);
  });

  it("keeps only points not dominated on price and benefit", () => {
    const points = [
      { id: "cheap", price: 10, benefit: 3 },
      { id: "balanced", price: 20, benefit: 5 },
      { id: "dominated", price: 30, benefit: 4 },
    ];
    expect(paretoFront(points).map((point) => point.id)).toEqual(["cheap", "balanced"]);
  });

  it("plots every priced paid plan in the selected display currency", () => {
    const points = buildDecisionPoints(productsFile.products, estimatesFile.decisionEstimates, { region: "international", audience: "individual", currency: "USD" });
    expect(points.every((point) => point.currency === "USD" && point.price > 0)).toBe(true);
    expect(points.filter((point) => point.productSlug === "github-copilot").length).toBeGreaterThan(1);
    expect(points.find((point) => point.productSlug === "github-copilot")?.planName).toBe("Pro");
  });

  it("shows only Agent ability bands occupied by the current result set", () => {
    expect(occupiedIntelligenceLevels([
      { intelligenceLevel: 5 },
      { intelligenceLevel: 3 },
      { intelligenceLevel: 5 },
      { intelligenceLevel: 4 },
    ])).toEqual([3, 4, 5]);
    expect(occupiedIntelligenceLevels([])).toEqual([]);
  });

  it("puts China and international plans together with marked FX conversion", () => {
    const points = buildDecisionPoints(productsFile.products, estimatesFile.decisionEstimates, { region: "all", audience: "individual", currency: "USD" });
    expect(points.some((point) => point.marketLabel === "中国" && point.converted)).toBe(true);
    expect(points.some((point) => point.marketLabel === "全球" && !point.converted)).toBe(true);
    expect(points.every((point) => point.logo?.startsWith("/logos/") ?? true)).toBe(true);
    expect(points.every((point) => point.intelligenceLevel >= 1 && point.intelligenceLevel <= 5)).toBe(true);
    expect(new Set(estimatesFile.decisionEstimates.map((estimate) => estimate.intelligence.rank)).size).toBe(estimatesFile.decisionEstimates.length);
    expect(points.every((point) => point.usageLevel >= 1 && point.usageLevel <= 5)).toBe(true);
  });
});

import { convertCurrency, roundCurrency } from "./exchange";
import { productLogo, shortProductName } from "./logos";
import type { DecisionEstimate, Plan, Product } from "./schema";

export type DecisionRegion = "all" | "china" | "international";
export type DecisionAudience = "individual" | "team";
export type DecisionConfidence = "high" | "medium" | "low";
export type DecisionBasis = "official" | "independent" | "community" | "mixed";

export const intelligenceLabels: Record<number, string> = { 1: "基础辅助", 2: "可用", 3: "强", 4: "很强", 5: "前沿" };
export const usageLabels: Record<number, string> = { 1: "轻量", 2: "低频", 3: "日常", 4: "高频", 5: "重度" };

export type DecisionPoint = {
  id: string;
  productSlug: string;
  productName: string;
  shortName: string;
  family: string;
  planId: string;
  planName: string;
  price: number;
  currency: string;
  originalPrice: number;
  originalCurrency: string;
  converted: boolean;
  marketLabel: string;
  benefit: number;
  benefitLabel: string;
  agentRank: number;
  intelligenceLevel: number;
  intelligenceLabel: string;
  intelligenceConfidence: DecisionConfidence;
  intelligenceBasis: DecisionBasis;
  intelligenceNote: string;
  usageLevel: number;
  usageLabel: string;
  usageConfidence: DecisionConfidence;
  usageBasis: DecisionBasis;
  usageNote: string;
  quota: string;
  accent: string;
  logo: string | null;
  verifiedAt: string;
};

export function paretoFront<T extends { price: number; benefit: number }>(points: T[]) {
  return points.filter((candidate) => !points.some((other) => (
    other.price <= candidate.price
    && other.benefit >= candidate.benefit
    && (other.price < candidate.price || other.benefit > candidate.benefit)
  )));
}

/**
 * Return only the Agent ability bands represented by the current result set.
 * Keeping this data-driven prevents an empty band from consuming chart space
 * after a region or audience filter changes.
 */
export function occupiedIntelligenceLevels<T extends { intelligenceLevel: number }>(points: T[]) {
  return Array.from(new Set(points.map((point) => point.intelligenceLevel))).sort((a, b) => a - b);
}

/**
 * Keep the nearly empty entry-price band compact, then give the rest of the
 * chart to the price range where most paid plans sit. Values inside the entry
 * band remain ordered instead of being collapsed onto one coordinate.
 */
export function decisionPriceRatio(price: number, maxPrice: number, entryPrice: number, entryShare = .1) {
  const safeEntry = Math.max(0.01, entryPrice);
  const safeMax = Math.max(safeEntry, maxPrice);
  const safePrice = Math.min(Math.max(0, price), safeMax);
  const safeShare = Math.min(Math.max(entryShare, 0), 1);

  if (safeMax === safeEntry) return safePrice / safeMax;
  if (safePrice <= safeEntry) return (safePrice / safeEntry) * safeShare;

  const focusedRatio = Math.log(safePrice / safeEntry) / Math.log(safeMax / safeEntry);
  return safeShare + focusedRatio * (1 - safeShare);
}

function isInRegion(plan: Plan, region: DecisionRegion) {
  if (region === "all") return true;
  if (region === "china") return plan.regions.includes("china");
  return plan.regions.includes("international") || plan.regions.includes("global");
}

function marketLabel(plan: Plan) {
  if (plan.regions.includes("china") && !plan.regions.includes("international")) return "中国";
  if (plan.regions.includes("international")) return "国际";
  return "全球";
}

function firstQuota(plan: Plan) {
  const quota = plan.quotas[0];
  if (!quota) return "官网未披露额度";
  const amount = quota.amount === null ? "官网未披露" : quota.amount;
  return `${amount} ${quota.unit} / ${quota.window}`;
}

/**
 * A point is published only when the plan has an explicit monthly price and
 * both broad estimates have traceable evidence. Custom credit systems remain
 * separate: the usage level is a five-band reading aid, not a conversion.
 */
export function buildDecisionPoints(
  products: Product[],
  estimates: DecisionEstimate[],
  options: { region: DecisionRegion; audience: DecisionAudience; currency: string },
): DecisionPoint[] {
  const estimateByProduct = new Map(estimates.map((estimate) => [estimate.productSlug, estimate]));

  return products.flatMap((product) => product.plans
    .filter((plan) => plan.status === "current")
    .filter((plan) => plan.audience === options.audience)
    .filter((plan) => isInRegion(plan, options.region))
    .filter((plan) => plan.price.monthly !== null && plan.price.monthly > 0)
    .map((plan): DecisionPoint | null => {
      const normalized = convertCurrency(plan.price.monthly as number, plan.price.currency, options.currency);
      const estimate = estimateByProduct.get(product.slug);
      const usage = estimate?.usage.find((item) => item.planId === plan.id);
      if (normalized === null || !estimate || !usage) return null;
      const intelligence = estimate.intelligence;
      return {
        id: `${product.slug}::${plan.id}`,
        productSlug: product.slug,
        productName: product.name,
        shortName: shortProductName(product.name),
        family: product.family,
        planId: plan.id,
        planName: plan.name,
        price: roundCurrency(normalized, options.currency),
        currency: options.currency,
        originalPrice: plan.price.monthly as number,
        originalCurrency: plan.price.currency,
        converted: plan.price.currency !== options.currency,
        marketLabel: marketLabel(plan),
        benefit: intelligence.level,
        benefitLabel: `Agent 能力估计：${intelligence.label}`,
        agentRank: intelligence.rank,
        intelligenceLevel: intelligence.level,
        intelligenceLabel: intelligence.label,
        intelligenceConfidence: intelligence.confidence,
        intelligenceBasis: intelligence.basis,
        intelligenceNote: intelligence.note,
        usageLevel: usage.level,
        usageLabel: usageLabels[usage.level],
        usageConfidence: usage.confidence,
        usageBasis: usage.basis,
        usageNote: usage.note,
        quota: firstQuota(plan),
        accent: product.accent,
        logo: productLogo(product.slug),
        verifiedAt: product.verifiedAt,
      };
    })
    .filter((point): point is DecisionPoint => point !== null)
    .sort((a, b) => a.price - b.price));
}

import type { Plan, Product } from "@/lib/schema";
import { convertCurrency, roundCurrency, usdCnyReference } from "@/lib/exchange";

export const currencySymbol: Record<string, string> = { USD: "$", CNY: "¥", EUR: "€", GBP: "£" };

export function formatPrice(plan: Plan, annual = false) {
  const value = annual ? plan.price.annualMonthly ?? plan.price.monthly : plan.price.monthly;
  if (value === null) {
    if (plan.status === "custom") return "定制报价";
    if (plan.audience === "api" && /按量|充值|余额|token|无月费/i.test(plan.price.billingNote)) return "按量付费";
    return "官网未披露";
  }
  if (value === 0) return "免费";
  return `${currencySymbol[plan.price.currency] ?? plan.price.currency} ${value}`;
}

export function formatMonthlyPrice(plan: Plan) {
  return `${formatPrice(plan)}${plan.price.monthly === null ? "" : " / 月"}`;
}

export function formatApproximatePrice(plan: Plan) {
  if (plan.price.monthly === null || plan.price.monthly <= 0) return null;
  const target = plan.price.currency === "CNY" ? "USD" : plan.price.currency === "USD" ? "CNY" : null;
  if (!target) return null;
  const converted = convertCurrency(plan.price.monthly, plan.price.currency, target);
  if (converted === null) return null;
  const amount = roundCurrency(converted, target);
  return `≈ ${currencySymbol[target]} ${amount} / 月 · 汇率 ${usdCnyReference.effectiveAt}`;
}

export function currentPlans(product: Product) {
  return product.plans.filter((plan) => plan.status === "current" || plan.status === "custom");
}

export function leadPlan(product: Product, region?: string) {
  const plans = currentPlans(product).filter((plan) => !region || region === "all" || plan.regions.includes(region as never) || plan.regions.includes("global"));
  return plans.find((plan) => (plan.price.monthly ?? 0) > 0 && plan.audience === "individual") ?? plans[0] ?? product.plans[0];
}

export function quotaLabel(plan: Plan) {
  const quota = plan.quotas[0];
  if (!quota) return "官网未披露额度";
  const amount = quota.amount === null ? "官网未披露" : String(quota.amount);
  return `${amount} ${quota.unit} / ${quota.window}`;
}

export function disclosureLabel(value: "exact" | "approximate" | "undisclosed") {
  return value === "exact" ? "官网明确" : value === "approximate" ? "官网约数" : "官网未披露";
}

export function allPlanId(productSlug: string, planId: string) {
  return `${productSlug}::${planId}`;
}

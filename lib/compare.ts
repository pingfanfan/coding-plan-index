import type { Plan } from "@/lib/schema";

export function parsePlanIds(value: string | null, limit = 4) {
  return Array.from(new Set((value ?? "").split(",").map((item) => item.trim()).filter(Boolean))).slice(0, limit);
}

export function exactQuotaUnits(plans: Plan[]) {
  return plans.flatMap((plan) => plan.quotas.filter((quota) => quota.disclosure === "exact").map((quota) => quota.unit));
}

export function hasCompatibleQuotaUnit(plans: Plan[]) {
  const units = exactQuotaUnits(plans);
  return units.length > 0 && new Set(units).size === 1;
}

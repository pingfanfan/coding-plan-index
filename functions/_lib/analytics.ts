export const ANALYTICS_EVENTS = [
  "subscribe_started",
  "confirmation_sent",
  "confirmation_failed",
  "confirmation_success",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/**
 * A deliberately tiny subset of the KV API. Keeping the interface local means
 * the Pages Function can build without pulling the whole Workers type package
 * into the Next application.
 */
export interface AnalyticsStore {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
}

export interface AnalyticsEnv {
  /** Optional Cloudflare KV binding. The site still logs events if it is not configured. */
  ANALYTICS_KV?: AnalyticsStore;
}

export interface AnalyticsDay {
  date: string;
  totals: Record<AnalyticsEvent, number>;
}

export interface AnalyticsSnapshot {
  version: 1;
  updatedAt: string;
  totals: Record<AnalyticsEvent, number>;
  days: AnalyticsDay[];
}

export const ANALYTICS_KEY = "cp-analytics-v1";
const RETAIN_DAYS = 90;

function emptyTotals(): Record<AnalyticsEvent, number> {
  return {
    subscribe_started: 0,
    confirmation_sent: 0,
    confirmation_failed: 0,
    confirmation_success: 0,
  };
}

export function emptyAnalyticsSnapshot(now = new Date()): AnalyticsSnapshot {
  return { version: 1, updatedAt: now.toISOString(), totals: emptyTotals(), days: [] };
}

function isEvent(value: unknown): value is AnalyticsEvent {
  return typeof value === "string" && (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

function normalizeSnapshot(value: unknown): AnalyticsSnapshot {
  if (!value || typeof value !== "object") return emptyAnalyticsSnapshot();
  const input = value as { version?: unknown; updatedAt?: unknown; totals?: unknown; days?: unknown };
  const totals = emptyTotals();
  if (input.totals && typeof input.totals === "object") {
    for (const event of ANALYTICS_EVENTS) {
      const count = (input.totals as Record<string, unknown>)[event];
      if (typeof count === "number" && Number.isFinite(count) && count >= 0) totals[event] = Math.floor(count);
    }
  }
  const days: AnalyticsDay[] = Array.isArray(input.days)
    ? input.days.flatMap((day) => {
      if (!day || typeof day !== "object") return [];
      const raw = day as { date?: unknown; totals?: unknown };
      if (typeof raw.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) return [];
      const dayTotals = emptyTotals();
      if (raw.totals && typeof raw.totals === "object") {
        for (const event of ANALYTICS_EVENTS) {
          const count = (raw.totals as Record<string, unknown>)[event];
          if (typeof count === "number" && Number.isFinite(count) && count >= 0) dayTotals[event] = Math.floor(count);
        }
      }
      return [{ date: raw.date, totals: dayTotals }];
    }).slice(-RETAIN_DAYS)
    : [];
  return {
    version: 1,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : new Date(0).toISOString(),
    totals,
    days,
  };
}

function dayKey(now: Date) {
  return now.toISOString().slice(0, 10);
}

/** Record only event totals and dates. No email, IP, user agent, or referrer is stored. */
export async function recordAnalyticsEvent(env: AnalyticsEnv, event: AnalyticsEvent, now = new Date()) {
  if (!env.ANALYTICS_KV) return false;

  const existing = normalizeSnapshot(await env.ANALYTICS_KV.get(ANALYTICS_KEY, "json"));
  existing.totals[event] += 1;
  const date = dayKey(now);
  const today = existing.days.find((item) => item.date === date);
  if (today) today.totals[event] += 1;
  else existing.days.push({ date, totals: { ...emptyTotals(), [event]: 1 } });
  existing.days = existing.days.sort((left, right) => left.date.localeCompare(right.date)).slice(-RETAIN_DAYS);
  existing.updatedAt = now.toISOString();
  await env.ANALYTICS_KV.put(ANALYTICS_KEY, JSON.stringify(existing));
  return true;
}

export async function readAnalyticsSnapshot(env: AnalyticsEnv) {
  if (!env.ANALYTICS_KV) return null;
  return normalizeSnapshot(await env.ANALYTICS_KV.get(ANALYTICS_KEY, "json"));
}

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  return isEvent(value);
}

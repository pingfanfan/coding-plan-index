import { describe, expect, it } from "vitest";
import { emptyAnalyticsSnapshot, readAnalyticsSnapshot, recordAnalyticsEvent, type AnalyticsStore } from "../functions/_lib/analytics";

class MemoryStore implements AnalyticsStore {
  private value: unknown = null;

  async get() {
    return this.value;
  }

  async put(_key: string, value: string) {
    this.value = JSON.parse(value);
  }
}

describe("aggregate subscription analytics", () => {
  it("stores event totals and date buckets without raw identity data", async () => {
    const store = new MemoryStore();
    const env = { ANALYTICS_KV: store };
    await recordAnalyticsEvent(env, "subscribe_started", new Date("2026-08-22T09:00:00.000Z"));
    await recordAnalyticsEvent(env, "confirmation_success", new Date("2026-08-22T09:01:00.000Z"));

    const snapshot = await readAnalyticsSnapshot(env);
    expect(snapshot?.totals.subscribe_started).toBe(1);
    expect(snapshot?.totals.confirmation_success).toBe(1);
    expect(snapshot?.days).toEqual([{ date: "2026-08-22", totals: { ...emptyAnalyticsSnapshot().totals, subscribe_started: 1, confirmation_success: 1 } }]);
    expect(JSON.stringify(snapshot)).not.toContain("email");
  });

  it("does not fail when the optional store is not configured", async () => {
    await expect(recordAnalyticsEvent({}, "subscribe_started")).resolves.toBe(false);
    await expect(readAnalyticsSnapshot({})).resolves.toBeNull();
  });
});

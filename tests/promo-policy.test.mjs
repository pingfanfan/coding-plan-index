import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import YAML from "yaml";
import { deadline, evaluateOffer, initialLedger, selectBatch } from "../scripts/promo-policy.mjs";
import { digestContent } from "../scripts/promo-alert-lib.mjs";
import { deliverPending } from "../scripts/promo-delivery.mjs";

const now = new Date("2026-09-05T02:00:00Z");
const notification = { eventId: "new-event", announcedAt: "2026-09-05T08:00:00+08:00", reviewedAt: "2026-09-05T09:00:00+08:00", status: "confirmed", sourceId: "official", evidenceNote: "已直接读取厂商原始公告，并核对适用账户与有效期。" };
const offer = { id: "new-offer", vendorId: "vendor", title: "测试活动", kind: "token_gift", verification: "verified", sourceIds: ["official"], subscriberNotice: "none", notification, summary: "测试摘要", benefit: "赠送额度", eligibility: "符合条件的账户", claimMethod: "前往官方活动页", endLabel: "官方未披露", verifiedAt: "2026-09-05", endsAt: null };
const context = {
  sources: [{ id: "official", vendorId: "vendor", status: "verified", url: "https://vendor.com/promo" }],
  vendors: [{ id: "vendor", name: "示例厂商", officialDomains: ["vendor.com"] }],
  social: [{ vendorId: "vendor", handle: "@leader", authority: "product_lead", identityEvidenceUrl: "https://vendor.com/team" }],
};
const ledger = () => initialLedger([], now);
const edit = (fields = {}, n = {}) => ({ ...offer, ...fields, notification: { ...notification, ...n } });
const sourceContext = (url, source = {}) => ({ ...context, sources: [{ ...context.sources[0], url, ...source }] });

describe("editorial source and event policy", () => {
  it("does not confuse a verified site fact with permission to email", () => {
    expect(evaluateOffer({ ...offer, notification: undefined }, context, now).reason).toBeTruthy();
    expect(evaluateOffer(edit({ kind: "price_change" }), context, now).reason).toBe("not-a-promotional-benefit");
    expect(evaluateOffer(edit({}, { status: "review" }), context, now).reason).toBe("awaiting-primary-evidence");
  });
  it("accepts original official evidence and specifically identified product leads", () => {
    expect(evaluateOffer(offer, context, now).eventId).toBe("new-event");
    expect(evaluateOffer(offer, sourceContext("https://x.com/leader/status/123?s=20"), now).sourceKey).toBe("x:123");
  });
  it.each(["https://x.com/random/status/123", "https://x.com/leader", "https://vendor.com.evil.com/promo", "http://vendor.com/promo", "https://vendor.com@evil.com/promo", "https://forum.vendor.com/topic/1", "https://github.com/vendor/issues/1"])("rejects spoofed or unqualified source %s", (url) => {
    expect(evaluateOffer(offer, sourceContext(url), now).reason).toBe("untrusted-source");
  });
  it("does not trust employee claims or an unverified identity as product-lead announcements", () => {
    const social = [{ ...context.social[0], authority: "employee" }];
    expect(evaluateOffer(offer, { ...sourceContext("https://x.com/leader/status/123"), social }, now).reason).toBe("untrusted-source");
    expect(evaluateOffer(offer, sourceContext("https://vendor.com/promo", { vendorId: "other" }), now).reason).toBe("untrusted-source");
  });
  it("requires an explicit pending label for a lead's advance announcement", () => {
    const early = edit({ verification: "conditional", subscriberNotice: "early" }, { status: "announced" });
    expect(evaluateOffer(early, sourceContext("https://x.com/leader/status/123", { status: "partial" }), now).eventId).toBe("new-event");
    expect(evaluateOffer({ ...early, subscriberNotice: "none" }, context, now).reason).toBe("missing-pending-arrival-label");
  });
  it("rejects stale reviews, future announcement times, and expired news", () => {
    expect(evaluateOffer(edit({}, { announcedAt: "2026-08-01T00:00:00Z" }), context, now).reason).toBe("stale-or-invalid-review-time");
    expect(evaluateOffer(edit({}, { announcedAt: "2026-09-06T00:00:00Z" }), context, now).reason).toBe("stale-or-invalid-review-time");
    expect(evaluateOffer(edit({ endsAt: "2026-09-04" }), context, now).reason).toBe("expired-or-invalid-deadline");
    expect(evaluateOffer(edit({ endsAt: "invalid" }), context, now).reason).toBe("expired-or-invalid-deadline");
  });
  it("interprets date-only expiry as the end of the China calendar day", () => {
    expect(new Date(deadline(edit({ endsAt: "2026-09-05" }))).toISOString()).toBe("2026-09-05T15:59:59.999Z");
  });
});

describe("queue, daily digest and frequency limits", () => {
  it("merges ordinary offers into the daily China 09:30 digest, never a push email", () => {
    expect(selectBatch([offer], context, ledger(), now).selected).toHaveLength(0);
    expect(selectBatch([offer], context, ledger(), new Date("2026-09-05T01:29:00Z"), "scheduled").selected).toHaveLength(0);
    const second = edit({ id: "second" }, { eventId: "second" });
    expect(selectBatch([offer, second], context, ledger(), new Date("2026-09-05T01:30:00Z"), "scheduled").selected).toHaveLength(2);
  });
  it("prioritizes reset, limited offers, and offers ending within 24h", () => {
    for (const urgent of [edit({ kind: "reset" }), edit({}, { limited: true }), edit({ endsAt: "2026-09-05" })]) {
      expect(selectBatch([urgent], context, ledger(), now).lane).toBe("urgent");
    }
  });
  it("coalesces waiting ordinary news into an urgent email", () => {
    const urgent = edit({ id: "urgent", kind: "reset" }, { eventId: "urgent" });
    expect(selectBatch([offer, urgent], context, ledger(), now).selected).toHaveLength(2);
  });
  it("caps each lane at one and total broadcasts at two per rolling 24h", () => {
    const state = ledger();
    state.batches = [{ lane: "urgent", at: "2026-09-04T03:00:00Z", broadcastId: "first" }];
    const urgent = edit({ kind: "reset" });
    expect(selectBatch([urgent], context, state, now).selected).toHaveLength(0);
    expect(selectBatch([urgent], context, state, now, "scheduled").lane).toBe("digest");
    state.batches.push({ lane: "digest", at: "2026-09-04T04:00:00Z", broadcastId: "second" });
    expect(selectBatch([urgent], context, state, now, "scheduled").selected).toHaveLength(0);
    expect(selectBatch([urgent], context, state, new Date("2026-09-05T03:00:00Z")).lane).toBe("urgent");
  });
  it("suppresses old records, renamed social posts, and already-notified events", () => {
    expect(selectBatch([edit({ kind: "reset" })], context, initialLedger([offer], now), now).selected).toHaveLength(0);
    const social = sourceContext("https://x.com/leader/status/123?s=1");
    const state = initialLedger([offer], now, social);
    expect(selectBatch([edit({ id: "renamed", kind: "reset" }, { eventId: "renamed" })], social, state, now).selected).toHaveLength(0);
    const sent = ledger();
    sent.completed.push({ eventId: "new-event", sourceKey: "event:new-event", at: now.toISOString(), broadcastId: "old" });
    expect(selectBatch([edit({ id: "arrival-followup", kind: "reset" })], context, sent, now).selected).toHaveLength(0);
    expect(selectBatch([edit({ id: "extra-reset", kind: "reset" }, { eventId: "extra-reset" })], context, sent, now).selected).toHaveLength(1);
  });
  it("deduplicates X/Twitter links with different query parameters", () => {
    const social = sourceContext("https://twitter.com/LEADER/status/123?s=2");
    const state = ledger();
    state.completed.push({ eventId: "old-id", sourceKey: "x:123", at: now.toISOString(), broadcastId: "old" });
    expect(selectBatch([edit({ kind: "reset" })], social, state, now).selected).toHaveLength(0);
  });
  it("never replays any current repository offers on migration", () => {
    const offers = YAML.parse(readFileSync("data/offers.yml", "utf8")).offers;
    expect(selectBatch(offers, context, initialLedger(offers, now), now, "scheduled").selected).toHaveLength(0);
  });
  it("does not leak HTML markup and labels pending items separately in digests", () => {
    const early = edit({ title: "<script>alert(1)</script>", subscriberNotice: "early" });
    const entries = [offer, early].map((o) => ({ offer: o, source: context.sources[0] }));
    const mail = digestContent(entries, context.vendors);
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("状态：待正式到账");
    expect(mail.html).toContain("RESEND_UNSUBSCRIBE_URL");
    expect(mail.subject).toContain("含待到账预告");
  });
});

function pendingLedger() {
  const state = ledger();
  state.pending = { id: "batch", lane: "urgent", createdAt: now.toISOString(), entries: [{ eventId: "new-event", sourceKey: "event:new-event" }], payload: { segment_id: "s", topic_id: "t", from: "CP <test@example.com>", name: "test", subject: "test", html: "test" } };
  return state;
}
describe("durable delivery without blindly retrying a send", () => {
  it("saves the draft ID and send intention before contacting the send endpoint", async () => {
    const state = pendingLedger(), snapshots = [];
    const resend = vi.fn(async (path, method, body) => {
      if (path === "/broadcasts") { expect(body.send).toBe(false); return { id: "draft-id" }; }
      if (method === "GET") return { status: "draft" };
      expect(snapshots.at(-1).pending.sendRequestedAt).toBeTruthy();
      return { id: "draft-id" };
    });
    await deliverPending(state, { resend, save: async (s) => { snapshots.push(structuredClone(s)); }, now: () => now });
    expect(state.pending).toBeNull();
    expect(state.completed).toHaveLength(1);
    expect(state.batches).toHaveLength(1);
    expect(resend).toHaveBeenCalledTimes(3);
  });
  it("does not send if the durable draft record failed to save", async () => {
    const resend = vi.fn(async () => ({ id: "draft-id" }));
    await expect(deliverPending(pendingLedger(), { resend, save: async () => { throw new Error("storage down"); } })).rejects.toThrow("storage down");
    expect(resend).toHaveBeenCalledTimes(1);
  });
  it("does not retry an ambiguous send even when Resend still says draft", async () => {
    const state = pendingLedger();
    state.pending.broadcastId = "draft-id";
    const resend = vi.fn(async (_path, method) => { if (method === "GET") return { status: "draft" }; throw new Error("network timeout"); });
    const save = async () => {};
    await expect(deliverPending(state, { resend, save, now: () => now })).rejects.toThrow("network timeout");
    resend.mockClear();
    await expect(deliverPending(state, { resend, save, now: () => now })).rejects.toThrow("No automatic resend");
    expect(resend).toHaveBeenCalledTimes(1);
  });
  it("reconciles sent state after a crash without posting another email", async () => {
    const state = pendingLedger();
    state.pending.broadcastId = "sent-id";
    state.pending.sendRequestedAt = now.toISOString();
    const resend = vi.fn(async () => ({ status: "sent" }));
    await expect(deliverPending(state, { resend, save: async () => {}, now: () => now })).resolves.toBe("accepted-reconciled");
    expect(resend).toHaveBeenCalledTimes(1);
    expect(state.completed[0].broadcastId).toBe("sent-id");
  });
});

describe("CLI dry-run safety", () => {
  function runCLI({ missing = false, initialize = false } = {}) {
    const offers = YAML.parse(readFileSync("data/offers.yml", "utf8")).offers;
    const state = initialLedger(offers, now);
    const mock = `globalThis.fetch = async (url, options) => {
      if (options.method !== 'GET' || !url.startsWith('https://api.github.com/')) throw new Error('Unexpected mutation or email request');
      return new Response(${missing ? "'{}'" : JSON.stringify(JSON.stringify({ sha: "sha", content: Buffer.from(JSON.stringify(state)).toString("base64") }))}, { status: ${missing ? 404 : 200} });
    };
    await import('./scripts/send-offer-alert.mjs');`;
    return execFileSync(process.execPath, ["--input-type=module", "-e", mock], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GITHUB_TOKEN: "test-only", GITHUB_REPOSITORY: "example/test", GITHUB_STEP_SUMMARY: "", DRY_RUN: "true", INITIALIZE_LEDGER: String(initialize), RUN_MODE: "scheduled", RESEND_API_KEY: "", RESEND_FROM: "", RESEND_SEGMENT_ID: "", RESEND_TOPIC_ID: "" },
    });
  }
  it("previews against the saved ledger with no Resend credentials or writes", () => {
    expect(runCLI()).toContain("selected 0; pending 0. DRY RUN");
  });
  it("refuses to run without history and does not silently recreate it", () => {
    expect(() => runCLI({ missing: true })).toThrow();
  });
  it("explicit bootstrap preview baselines old offers but performs no writes", () => {
    expect(runCLI({ missing: true, initialize: true })).toContain("No email sent");
  });
});

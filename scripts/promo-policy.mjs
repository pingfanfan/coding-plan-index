import { z } from "zod";

const DAY = 86_400_000;
const id = z.string().regex(/^[a-z0-9-]+$/);
export const NotificationSchema = z.object({
  eventId: id,
  announcedAt: z.string().datetime({ offset: true }),
  reviewedAt: z.string().datetime({ offset: true }),
  status: z.enum(["confirmed", "announced", "review"]),
  sourceId: z.string().min(1),
  evidenceNote: z.string().min(10),
  limited: z.boolean().optional(),
}).strict();

export const LedgerSchema = z.object({
  version: z.literal(1),
  initializedAt: z.string().datetime(),
  baselineIds: z.array(z.string()),
  baselineSourceKeys: z.array(z.string()),
  completed: z.array(z.object({ eventId: id, sourceKey: z.string(), at: z.string().datetime(), broadcastId: z.string() })),
  batches: z.array(z.object({ lane: z.enum(["urgent", "digest"]), at: z.string().datetime(), broadcastId: z.string() })),
  pending: z.object({
    id: z.string(), lane: z.enum(["urgent", "digest"]), createdAt: z.string().datetime(),
    entries: z.array(z.object({ eventId: id, sourceKey: z.string() })).min(1),
    payload: z.object({ segment_id: z.string(), topic_id: z.string(), from: z.string(), name: z.string(), subject: z.string(), html: z.string() }),
    broadcastId: z.string().optional(),
    sendRequestedAt: z.string().datetime().optional(),
  }).nullable(),
}).strict();

export function initialLedger(offers, now, context = { sources: [] }) {
  const sourceIds = new Set(offers.flatMap((o) => o.sourceIds || []));
  const baselineSourceKeys = context.sources.filter((s) => sourceIds.has(s.id)).flatMap((s) => {
    try {
      const url = new URL(s.url);
      const match = url.pathname.match(/^\/[a-zA-Z0-9_]+\/status\/(\d+)\/?$/);
      return ["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname) && match ? [`x:${match[1]}`] : [];
    } catch { return []; }
  });
  return LedgerSchema.parse({ version: 1, initializedAt: now.toISOString(), baselineIds: offers.map((o) => o.id), baselineSourceKeys, completed: [], batches: [], pending: null });
}

// Normalize social cross-links and tracking parameters without treating arbitrary
// community posts hosted on a vendor-owned platform as official announcements.
export function trustedSource(offer, notification, sources, vendors, social) {
  const source = sources.find((s) => s.id === notification.sourceId && s.vendorId === offer.vendorId);
  if (!source || !offer.sourceIds?.includes(source.id)) return null;
  if (!["verified", "partial"].includes(source.status)) return null;
  let url;
  try { url = new URL(source.url); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(host)) {
    const match = url.pathname.match(/^\/([a-zA-Z0-9_]+)\/status\/(\d+)\/?$/);
    if (!match) return null;
    const author = social.find((s) => s.vendorId === offer.vendorId && s.handle.toLowerCase() === `@${match[1].toLowerCase()}` && ["official_account", "product_lead"].includes(s.authority));
    if (!author || (author.authority === "product_lead" && !author.identityEvidenceUrl)) return null;
    return { source, key: `x:${match[2]}` };
  }
  if (source.status !== "verified" || /^(forum|community)\./.test(host) || ["github.com", "gist.github.com"].includes(host)) return null;
  const domains = vendors.find((v) => v.id === offer.vendorId)?.officialDomains || [];
  if (!domains.some((domain) => host === domain || host.endsWith(`.${domain}`))) return null;
  // A pricing page can host multiple genuinely distinct events over time.
  return { source, key: `event:${notification.eventId}` };
}

export function deadline(offer) {
  if (!offer.endsAt) return Infinity;
  // A date-only deadline means the end of that day in China, not UTC.
  const dateOnly = z.string().date().safeParse(offer.endsAt).success;
  if (!dateOnly && !z.string().datetime({ offset: true }).safeParse(offer.endsAt).success) return NaN;
  const value = dateOnly ? `${offer.endsAt}T23:59:59.999+08:00` : offer.endsAt;
  return Date.parse(value);
}

export function evaluateOffer(offer, context, now) {
  const parsed = NotificationSchema.safeParse(offer.notification);
  if (!parsed.success) return { reason: "missing-or-invalid-editorial-review" };
  const n = parsed.data;
  if (n.status === "review") return { reason: "awaiting-primary-evidence" };
  if (!["discount", "token_gift", "usage_boost", "reset", "trial"].includes(offer.kind)) return { reason: "not-a-promotional-benefit" };
  if (n.status === "confirmed" && offer.verification !== "verified") return { reason: "unconfirmed-rules" };
  if (n.status === "announced" && offer.subscriberNotice !== "early") return { reason: "missing-pending-arrival-label" };
  const announcement = Date.parse(n.announcedAt);
  const review = Date.parse(n.reviewedAt);
  if (announcement > +now || review > +now || review < announcement || +now - review > 14 * DAY || +now - announcement > 14 * DAY) return { reason: "stale-or-invalid-review-time" };
  const end = deadline(offer);
  if (Number.isNaN(end) || end <= +now) return { reason: "expired-or-invalid-deadline" };
  const evidence = trustedSource(offer, n, context.sources, context.vendors, context.social);
  if (!evidence) return { reason: "untrusted-source" };
  return { offer, eventId: n.eventId, source: evidence.source, sourceKey: evidence.key, urgent: offer.kind === "reset" || n.limited === true || end - +now <= DAY };
}

export function selectBatch(offers, context, ledger, now, mode = "auto") {
  LedgerSchema.parse(ledger);
  if (ledger.pending) return { reason: "resume-pending", selected: [], skipped: [] };
  const seenIds = new Set(ledger.completed.map((x) => x.eventId));
  const seenSources = new Set([...ledger.baselineSourceKeys, ...ledger.completed.map((x) => x.sourceKey)]);
  const baseline = new Set(ledger.baselineIds);
  const candidates = [], skipped = [];
  for (const offer of [...offers].sort((a, b) => Date.parse(b.notification?.announcedAt || 0) - Date.parse(a.notification?.announcedAt || 0))) {
    if (baseline.has(offer.id) || baseline.has(offer.notification?.eventId)) { skipped.push({ id: offer.id, reason: "migration-baseline" }); continue; }
    const result = evaluateOffer(offer, context, now);
    if (result.reason) { skipped.push({ id: offer.id, reason: result.reason }); continue; }
    if (seenIds.has(result.eventId) || seenSources.has(result.sourceKey)) { skipped.push({ id: offer.id, reason: "duplicate-event" }); continue; }
    seenIds.add(result.eventId); seenSources.add(result.sourceKey); candidates.push(result);
  }
  const recent = ledger.batches.filter((b) => +now - Date.parse(b.at) < DAY);
  const hasSlot = (lane) => recent.length < 2 && !recent.some((b) => b.lane === lane);
  if (candidates.some((c) => c.urgent) && hasSlot("urgent")) return { lane: "urgent", selected: candidates, skipped };
  // Daily digest at 09:30 Asia/Shanghai. Hourly retries can catch a delayed or
  // rate-limited run; once-per-rolling-24h is enforced regardless of push count.
  const china = new Date(+now + 8 * 3_600_000);
  const afterDigestTime = china.getUTCHours() * 60 + china.getUTCMinutes() >= 570;
  if (mode === "scheduled" && afterDigestTime && hasSlot("digest") && candidates.length) return { lane: "digest", selected: candidates, skipped };
  return { reason: candidates.length ? "queued-until-next-slot" : "no-new-eligible-events", selected: [], skipped };
}

export function completeBatch(ledger, at, broadcastId) {
  if (!ledger.pending) throw new Error("No pending batch to complete");
  ledger.completed.push(...ledger.pending.entries.map((entry) => ({ ...entry, at, broadcastId })));
  ledger.batches.push({ lane: ledger.pending.lane, at, broadcastId });
  ledger.pending = null;
  return LedgerSchema.parse(ledger);
}

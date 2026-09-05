import { completeBatch } from "./promo-policy.mjs";

// Broadcasts do not document support for email idempotency keys. Persist a draft
// ID before requesting delivery; an uncertain send is reconciled, never retried.
export async function deliverPending(ledger, { save, resend, now = () => new Date() }) {
  const pending = ledger.pending;
  if (!pending) throw new Error("No pending broadcast");
  if (!pending.broadcastId) {
    const draft = await resend("/broadcasts", "POST", { ...pending.payload, send: false });
    if (!draft.id) throw new Error("Resend draft response has no ID; no send attempted");
    pending.broadcastId = draft.id;
    await save(ledger);
  }
  const existing = await resend(`/broadcasts/${encodeURIComponent(pending.broadcastId)}`, "GET");
  if (["sent", "sending", "queued", "scheduled"].includes(existing.status)) {
    if (!pending.sendRequestedAt) throw new Error("Broadcast sent outside this workflow; reconcile manually");
    completeBatch(ledger, now().toISOString(), pending.broadcastId);
    await save(ledger);
    return "accepted-reconciled";
  }
  if (pending.sendRequestedAt) throw new Error(`Uncertain broadcast ${pending.broadcastId}; status ${existing.status}. No automatic resend. Inspect Resend and the notification ledger.`);
  if (existing.status !== "draft") throw new Error(`Unexpected broadcast status: ${existing.status}`);
  for (const key of ["segment_id", "topic_id", "from", "subject", "html"]) {
    if (existing[key] !== pending.payload[key]) throw new Error(`Draft ${key} differs from the reviewed payload; refusing to send`);
  }
  pending.sendRequestedAt = now().toISOString();
  await save(ledger);
  const sent = await resend(`/broadcasts/${encodeURIComponent(pending.broadcastId)}/send`, "POST", {});
  if (sent.id !== pending.broadcastId) throw new Error("Unexpected send receipt; reconcile manually");
  completeBatch(ledger, now().toISOString(), pending.broadcastId);
  await save(ledger);
  return "accepted";
}

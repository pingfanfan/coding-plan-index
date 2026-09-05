import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import YAML from "yaml";
import { digestContent } from "./promo-alert-lib.mjs";
import { LedgerSchema, evaluateOffer, initialLedger, selectBatch } from "./promo-policy.mjs";
import { deliverPending } from "./promo-delivery.mjs";

const dryRun = process.env.DRY_RUN !== "false";
const initialize = process.env.INITIALIZE_LEDGER === "true";
const repo = process.env.GITHUB_REPOSITORY;
const branch = "notification-state";
const filePath = "notification-ledger.json";
const now = new Date();
const yaml = (file) => YAML.parse(readFileSync(file, "utf8"));
const offers = yaml("data/offers.yml").offers;
const context = { sources: yaml("data/sources.yml").sources, vendors: yaml("data/products.yml").vendors, social: yaml("data/social-watch.yml").socialWatchSources };
const required = ["GITHUB_TOKEN", "GITHUB_REPOSITORY"];
if (!dryRun && !initialize) required.push("RESEND_API_KEY", "RESEND_SEGMENT_ID", "RESEND_TOPIC_ID", "RESEND_FROM");
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);

async function github(path, method = "GET", body, allow404 = false) {
  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    method, headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 404 && allow404) return null;
  if (!response.ok) throw new Error(`GitHub ${method} ${path}: HTTP ${response.status}`);
  return response.json();
}
let stored = await github(`/contents/${filePath}?ref=${branch}`, "GET", undefined, true);
let ledger = stored ? LedgerSchema.parse(JSON.parse(Buffer.from(stored.content, "base64").toString("utf8"))) : null;
async function save(value) {
  if (dryRun) throw new Error("Dry run cannot mutate state");
  LedgerSchema.parse(value);
  const result = await github(`/contents/${filePath}`, "PUT", { message: "Record CP notification state", branch, ...(stored?.sha ? { sha: stored.sha } : {}), content: Buffer.from(JSON.stringify(value, null, 2) + "\n").toString("base64") });
  stored = { sha: result.content.sha };
}
function report(message) {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n\n`);
}
if (initialize) {
  if (ledger) throw new Error("Ledger already exists; never overwrite history during bootstrap");
  const ref = await github(`/git/ref/heads/${branch}`, "GET", undefined, true);
  if (ref) throw new Error("State branch exists but ledger is missing; restore history instead of reinitializing");
  ledger = initialLedger(offers, now, context);
  if (!dryRun) {
    const main = await github("/git/ref/heads/main");
    await github("/git/refs", "POST", { ref: `refs/heads/${branch}`, sha: main.object.sha });
    await save(ledger);
  }
  report(`${dryRun ? "DRY RUN: would baseline" : "Initialized baseline for"} ${offers.length} existing offers. No email sent.`);
  process.exit(0);
}
if (!ledger) throw new Error("Notification ledger is missing. Explicit initialization is required; refusing to replay existing offers.");
if (!dryRun) {
  const main = await github("/git/ref/heads/main");
  const runs = await github(`/actions/workflows/deploy-cloudflare.yml/runs?branch=main&head_sha=${main.object.sha}&status=success&per_page=1`);
  if (!runs.workflow_runs?.length) throw new Error("Current main has not deployed successfully; refusing to email an unpublished change");
  const checkoutSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (checkoutSha !== main.object.sha) throw new Error("Checkout is stale; next run will use current main");
}
const batch = selectBatch(offers, context, ledger, now, process.env.RUN_MODE || "auto");
report(`Policy: ${batch.lane || batch.reason}; selected ${batch.selected.length}; pending ${ledger.pending ? 1 : 0}. ${dryRun ? "DRY RUN — no writes or email." : ""}`);
for (const skipped of batch.skipped) report(`- ${skipped.id}: ${skipped.reason}`);
if (dryRun) {
  if (batch.selected.length) report(`Preview subject: ${digestContent(batch.selected, context.vendors).subject}`);
  process.exit(0);
}
if (!ledger.pending && !batch.selected.length) process.exit(0);
if (!ledger.pending) {
  const entries = batch.selected.map(({ eventId, sourceKey }) => ({ eventId, sourceKey }));
  const id = createHash("sha256").update(JSON.stringify(entries)).digest("hex").slice(0, 24);
  const content = digestContent(batch.selected, context.vendors, process.env.PUBLIC_SITE_URL || "https://cp.pingfan.me");
  ledger.pending = { id, lane: batch.lane, createdAt: now.toISOString(), entries, payload: {
    segment_id: process.env.RESEND_SEGMENT_ID, topic_id: process.env.RESEND_TOPIC_ID, from: process.env.RESEND_FROM,
    name: `CP ${batch.lane} ${id}`, ...content,
  } };
  await save(ledger);
}
// If a crash left an unsent draft, do not send stale, expired or withdrawn facts.
if (!ledger.pending.sendRequestedAt) {
  const current = offers.map((offer) => evaluateOffer(offer, context, now)).filter((result) => !result.reason);
  const refreshed = ledger.pending.entries.map((entry) => current.find((c) => c.eventId === entry.eventId && c.sourceKey === entry.sourceKey));
  if (refreshed.some((entry) => !entry)) throw new Error("Pending draft contains expired or withdrawn facts; review/cancel the draft before proceeding");
  const content = digestContent(refreshed, context.vendors, process.env.PUBLIC_SITE_URL || "https://cp.pingfan.me");
  if (content.html !== ledger.pending.payload.html || content.subject !== ledger.pending.payload.subject) throw new Error("Pending draft facts changed; review/cancel instead of sending stale content");
}
async function resend(path, method, body) {
  const response = await fetch(`https://api.resend.com${path}`, {
    method, headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30_000),
  });
  // Do not print provider response bodies: they can contain private account data.
  if (!response.ok) throw new Error(`Resend ${method} ${path}: HTTP ${response.status}; inspect provider logs before retrying`);
  return response.json();
}
const outcome = await deliverPending(ledger, { save, resend });
report(`Broadcast ${outcome}. This is provider acceptance, not proof of delivery to every subscriber.`);

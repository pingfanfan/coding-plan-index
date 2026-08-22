import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import YAML from "yaml";
import { addedOffers, broadcastContent } from "./promo-alert-lib.mjs";

const required = ["RESEND_API_KEY", "RESEND_SEGMENT_ID", "RESEND_TOPIC_ID", "RESEND_FROM", "BEFORE_SHA"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);

const before = process.env.BEFORE_SHA;
if (!before || /^0+$/.test(before)) {
  console.log("No stable previous revision; skipping promotional broadcast.");
  process.exit(0);
}

const current = YAML.parse(readFileSync("data/offers.yml", "utf8"));
let previous;
try {
  previous = YAML.parse(execFileSync("git", ["show", `${before}:data/offers.yml`], { encoding: "utf8" }));
} catch {
  console.log("Previous offers file is unavailable; skipping to prevent an accidental bulk send.");
  process.exit(0);
}

const sources = YAML.parse(readFileSync("data/sources.yml", "utf8")).sources;
const products = YAML.parse(readFileSync("data/products.yml", "utf8"));
const sourceById = new Map(sources.map((source) => [source.id, source]));
const vendorById = new Map(products.vendors.map((vendor) => [vendor.id, vendor]));
const fresh = addedOffers(previous, current);

if (!fresh.length) {
  console.log("No newly added, verified high-value offers; nothing to send.");
  process.exit(0);
}

for (const offer of fresh) {
  const source = sourceById.get(offer.sourceIds[0]);
  if (!source?.url) throw new Error(`Offer ${offer.id} has no resolvable official source URL.`);
  const vendorName = vendorById.get(offer.vendorId)?.name || offer.vendorId;
  const content = broadcastContent(offer, vendorName, source.url, process.env.PUBLIC_SITE_URL || "https://cp.pingfan.me");
  const response = await fetch("https://api.resend.com/broadcasts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `cp-offer-${offer.id}`,
    },
    body: JSON.stringify({
      segment_id: process.env.RESEND_SEGMENT_ID,
      topic_id: process.env.RESEND_TOPIC_ID,
      from: process.env.RESEND_FROM,
      name: `CP offer ${offer.id}`,
      subject: content.subject,
      html: content.html,
      send: true,
    }),
  });
  if (!response.ok) throw new Error(`Resend broadcast failed for ${offer.id}: ${response.status} ${await response.text()}`);
  console.log(`Promotional broadcast accepted for ${offer.id}.`);
}

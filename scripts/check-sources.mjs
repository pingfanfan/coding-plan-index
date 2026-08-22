import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

const root = process.cwd();
const stateDir = process.env.SOURCE_MONITOR_DIR || path.join(root, ".source-monitor");
const statePath = path.join(stateDir, "state.json");
const reportPath = path.join(stateDir, "report.json");
const concurrency = 5;

function stableText(input, contentType) {
  if (!contentType.includes("html")) return input.replace(/\s+/g, " ").trim().slice(0, 300_000);
  return input
    .replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>[\s\S]*?<\/script>/gi, " SCRIPT_SRC $1 ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/\b\d{13}\b/g, "TIMESTAMP")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300_000);
}

function factSet(text) {
  const patterns = [
    /[$¥€£]\s?\d[\d,.]*/gi,
    /\d[\d,.]*\s?(?:ai credits?|credits?|requests?|prompts?|tokens?|completions?|calls?|seats?|hours?|days?|weeks?|months?|x\b|倍|次|个|小时|天|周|月)/giu,
    /\d+(?:\.\d+)?%|\d+\s?折/giu,
    /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?/giu,
    /\d{4}\s?年\s?\d{1,2}\s?月\s?\d{1,2}\s?日/giu,
    /(?:free|lite|pro\+?|max|ultra|business|enterprise|team|andante|moderato|allegretto|allegro)\s*(?:plan|seat|套餐)?/gi,
    /(?:one[- ]time|automatic|auto[- ]top[- ]up|banked|rate[- ]limit|reset(?:s|ting)?|credit(?:s)?|expire(?:s|d)?|roll(?:s)? over|fair[- ]use)/gi,
  ];
  return Array.from(new Set(patterns.flatMap((pattern) => Array.from(text.matchAll(pattern), (match) => match[0].toLowerCase().replace(/\s+/g, " ").trim())))).sort().slice(0, 2000);
}

async function inspectSource(source, previous) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(source.url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "CodingPlanIndexSourceMonitor/1.0 (+https://github.com/)",
        "accept-language": "en-US,en;q=0.9,zh-CN;q=0.7",
      },
    });
    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();
    const normalized = stableText(body, contentType);
    const fingerprint = createHash("sha256").update(normalized).digest("hex");
    const facts = response.ok && source.kind !== "benchmark" ? factSet(normalized) : [];
    const factFingerprint = createHash("sha256").update(facts.join("\n")).digest("hex");
    const current = {
      id: source.id,
      url: source.url,
      finalUrl: response.url,
      status: response.status,
      ok: response.ok,
      fingerprint,
      factFingerprint,
      facts,
      length: normalized.length,
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
      checkedAt: new Date().toISOString(),
      contentTracked: source.kind !== "benchmark",
    };
    let change = null;
    if (previous) {
      if (!response.ok && (previous.ok || previous.status !== response.status)) change = { type: "unreachable", before: previous.status, after: response.status };
      else if (response.ok && previous.ok === false) change = { type: "reachable_again", before: previous.status, after: response.status };
      else if (response.ok && previous.ok && source.kind === "promotion" && previous.fingerprint && previous.fingerprint !== fingerprint) change = { type: "promotion_content_changed", before: previous.fingerprint.slice(0, 12), after: fingerprint.slice(0, 12) };
      else if (response.ok && previous.ok && source.kind !== "benchmark" && previous.factFingerprint && previous.factFingerprint !== factFingerprint) change = { type: "pricing_or_quota_facts_changed", before: previous.factFingerprint.slice(0, 12), after: factFingerprint.slice(0, 12) };
      else if (previous.finalUrl && previous.finalUrl !== response.url) change = { type: "redirect_changed", before: previous.finalUrl, after: response.url };
    }
    return { current, change };
  } catch (error) {
    const current = { id: source.id, url: source.url, status: 0, ok: false, checkedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error), contentTracked: source.kind !== "benchmark" };
    const newlyFailed = previous && (previous.ok || previous.status !== 0 || previous.error !== current.error);
    return { current, change: newlyFailed ? { type: "request_failed", before: previous.status, after: current.error } : null };
  } finally { clearTimeout(timer); }
}

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) { const index = cursor++; results[index] = await worker(items[index]); }
  }));
  return results;
}

await mkdir(stateDir, { recursive: true });
const sourceFile = YAML.parse(await readFile(path.join(root, "data", "sources.yml"), "utf8"));
let previousState = { sources: {} };
try { previousState = JSON.parse(await readFile(statePath, "utf8")); } catch { /* first run bootstraps */ }

const results = await pool(sourceFile.sources, concurrency, (source) => inspectSource(source, previousState.sources?.[source.id]));
const nextState = { generatedAt: new Date().toISOString(), sources: Object.fromEntries(results.map(({ current }) => [current.id, current])) };
const changes = results.flatMap(({ current, change }) => change ? [{ id: current.id, url: current.url, ...change }] : []);
const failures = results.filter(({ current }) => !current.ok).map(({ current }) => ({ id: current.id, url: current.url, status: current.status, error: current.error }));
const firstRun = Object.keys(previousState.sources || {}).length === 0;
const report = { checkedAt: nextState.generatedAt, firstRun, checked: results.length, changes: firstRun ? [] : changes, failures };

await writeFile(statePath, JSON.stringify(nextState, null, 2) + "\n");
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!firstRun && changes.length) process.exitCode = 2;

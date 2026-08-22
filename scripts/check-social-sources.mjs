import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

const root = process.cwd();
const stateDir = process.env.SOCIAL_MONITOR_DIR || path.join(root, ".social-monitor");
const statePath = path.join(stateDir, "state.json");
const reportPath = path.join(stateDir, "report.json");
const bearerToken = process.env.X_BEARER_TOKEN?.trim();

await mkdir(stateDir, { recursive: true });
const watchFile = YAML.parse(await readFile(path.join(root, "data", "social-watch.yml"), "utf8"));
let previousState = { latestBySource: {} };
try { previousState = JSON.parse(await readFile(statePath, "utf8")); } catch { /* first run */ }

if (!bearerToken) {
  const state = { generatedAt: new Date().toISOString(), latestBySource: previousState.latestBySource || {} };
  const report = {
    checkedAt: state.generatedAt,
    checked: 0,
    skipped: true,
    reason: "X_BEARER_TOKEN is not configured; no unofficial scraping fallback is used.",
    findings: [],
    failures: [],
  };
  await writeFile(statePath, JSON.stringify(state, null, 2) + "\n");
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

function quoteKeyword(keyword) {
  return /[\s-]/.test(keyword) ? `"${keyword.replaceAll('"', '')}"` : keyword;
}

async function inspectSource(source) {
  const handle = source.handle.slice(1);
  const query = `from:${handle} (${source.keywords.map(quoteKeyword).join(" OR ")}) -is:retweet`;
  const params = new URLSearchParams({ query, max_results: "10", "tweet.fields": "created_at" });
  const sinceId = previousState.latestBySource?.[source.id];
  if (sinceId) params.set("since_id", sinceId);
  const response = await fetch(`https://api.x.com/2/tweets/search/recent?${params}`, {
    headers: { authorization: `Bearer ${bearerToken}`, "user-agent": "CodingPlanIndexSocialMonitor/1.0" },
  });
  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, " ").slice(0, 240);
    return { source, posts: [], failure: { id: source.id, status: response.status, detail } };
  }
  const payload = await response.json();
  return { source, posts: payload.data ?? [], failure: null };
}

const results = await Promise.all(watchFile.socialWatchSources.map(inspectSource));
const firstRun = Object.keys(previousState.latestBySource || {}).length === 0;
const latestBySource = { ...previousState.latestBySource };
for (const { source, posts } of results) {
  if (posts.length) latestBySource[source.id] = posts.reduce((latest, post) => BigInt(post.id) > BigInt(latest) ? post.id : latest, posts[0].id);
}

const findings = firstRun ? [] : results.flatMap(({ source, posts }) => posts.map((post) => ({
  sourceId: source.id,
  displayName: source.displayName,
  handle: source.handle,
  authority: source.authority,
  postId: post.id,
  url: `https://x.com/${source.handle.slice(1)}/status/${post.id}`,
  createdAt: post.created_at,
  snippet: post.text.replace(/\s+/g, " ").trim().slice(0, 240),
})));
const failures = results.flatMap(({ failure }) => failure ? [failure] : []);
const state = { generatedAt: new Date().toISOString(), latestBySource };
const report = { checkedAt: state.generatedAt, checked: results.length, firstRun, skipped: false, findings, failures };

await writeFile(statePath, JSON.stringify(state, null, 2) + "\n");
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (findings.length || failures.length) process.exitCode = 2;

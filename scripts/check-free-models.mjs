import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const stateDir = process.env.FREE_MODEL_MONITOR_DIR || path.join(root, ".free-model-monitor");
const statePath = path.join(stateDir, "state.json");
const reportPath = path.join(stateDir, "report.json");
const verifiedOpenCodeFreeIds = new Set([
  "big-pickle",
  "x-preview-f-free",
  "mimo-v2.5-free",
  "hy3-free",
  "nemotron-3-ultra-free",
  "nemotron-3.5-lightning-free",
  "muse-spark-1.2-contributor-free",
]);

async function officialJson(url) {
  const response = await fetch(url, { headers: { "user-agent": "CodingPlanIndexFreeModelMonitor/1.0 (+https://cp.pingfan.me/free-models)" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

function openRouterIds(payload) {
  return (Array.isArray(payload?.data) ? payload.data : [])
    .filter((model) => model?.pricing?.prompt === "0" && model?.pricing?.completion === "0" && model?.architecture?.output_modalities?.includes("text") && !model.id?.startsWith("google/lyria-"))
    .map((model) => model.id)
    .filter(Boolean)
    .sort();
}

function openCodeIds(payload) {
  return (Array.isArray(payload?.data) ? payload.data : [])
    .map((model) => model?.id)
    .filter((id) => typeof id === "string" && verifiedOpenCodeFreeIds.has(id))
    .sort();
}

function openCodeCandidates(payload) {
  return (Array.isArray(payload?.data) ? payload.data : [])
    .map((model) => model?.id)
    .filter((id) => typeof id === "string" && (id === "big-pickle" || id.endsWith("-free")))
    .sort();
}

function diff(previous = [], current = []) {
  return {
    added: current.filter((id) => !previous.includes(id)),
    removed: previous.filter((id) => !current.includes(id)),
  };
}

await mkdir(stateDir, { recursive: true });
let previous = null;
try { previous = JSON.parse(await readFile(statePath, "utf8")); } catch { /* first run */ }

const checkedAt = new Date().toISOString();
let current;
let failure = null;
try {
  const [openRouter, openCode] = await Promise.all([
    officialJson("https://openrouter.ai/api/v1/models"),
    officialJson("https://opencode.ai/zen/v1/models"),
  ]);
  current = {
    checkedAt,
    openRouter: openRouterIds(openRouter),
    openCode: openCodeIds(openCode),
    openCodeCandidates: openCodeCandidates(openCode),
  };
  await writeFile(statePath, JSON.stringify(current, null, 2) + "\n");
} catch (error) {
  failure = error instanceof Error ? error.message : String(error);
  current = previous ?? { checkedAt, openRouter: [], openCode: [], openCodeCandidates: [] };
}

const changes = previous && !failure ? {
  openRouter: diff(previous.openRouter, current.openRouter),
  openCode: diff(previous.openCode, current.openCode),
  openCodeCandidates: diff(previous.openCodeCandidates ?? previous.openCode, current.openCodeCandidates),
} : null;
const changed = Boolean(changes && [changes.openRouter, changes.openCode, changes.openCodeCandidates].some((entry) => entry.added.length || entry.removed.length));
const unverifiedOpenCodeCandidates = current.openCodeCandidates.filter((id) => !verifiedOpenCodeFreeIds.has(id));
const report = {
  checkedAt,
  firstRun: !previous,
  changed,
  failure,
  counts: { openRouter: current.openRouter.length, openCode: current.openCode.length, openCodeCandidates: current.openCodeCandidates.length },
  unverifiedOpenCodeCandidates,
  changes,
};
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (failure || changed) process.exitCode = 2;

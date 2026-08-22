import {
  ANALYTICS_EVENTS,
  type AnalyticsEnv,
  isAnalyticsEvent,
  readAnalyticsSnapshot,
  recordAnalyticsEvent,
} from "../_lib/analytics";

const ALLOWED_ORIGINS = new Set(["https://cp.pingfan.me", "https://coding-plan-index.pages.dev", "http://localhost:3000"]);

interface PagesContext {
  request: Request;
  env: AnalyticsEnv;
}

function allowedOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return ALLOWED_ORIGINS.has(parsed.origin) || parsed.hostname.endsWith(".coding-plan-index.pages.dev");
  } catch {
    return false;
  }
}

export async function onRequestPost({ request, env }: PagesContext) {
  if (!allowedOrigin(request)) return new Response(null, { status: 403 });

  let input: { event?: unknown; path?: unknown };
  try {
    input = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!isAnalyticsEvent(input.event)) return new Response(null, { status: 400 });
  const path = typeof input.path === "string" && input.path.startsWith("/") ? input.path.slice(0, 120) : "/";

  let persisted = false;
  try {
    persisted = await recordAnalyticsEvent(env, input.event);
  } catch (error) {
    // A KV outage must never block the subscription flow. The edge log still
    // leaves an auditable event trail for the owner.
    console.error("analytics_store_failed", error);
  }

  // Cloudflare Web Analytics has no custom-event API. This first-party request
  // keeps the funnel visible in edge logs even before the optional KV binding
  // is connected, without sending an email, cookie, IP, or referrer anywhere.
  console.log(JSON.stringify({ event: input.event, path, persisted, at: new Date().toISOString() }));
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestGet({ request, env }: PagesContext) {
  if (!allowedOrigin(request)) return new Response(null, { status: 403 });
  const snapshot = await readAnalyticsSnapshot(env);
  return Response.json(snapshot ?? {
    configured: false,
    message: "聚合统计存储尚未连接；事件仍会写入边缘日志。",
    supportedEvents: ANALYTICS_EVENTS,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}

const EVENTS = new Set(["subscribe_started", "confirmation_sent", "confirmation_failed", "confirmation_success"]);
const ALLOWED_ORIGINS = new Set(["https://cp.pingfan.me", "https://coding-plan-index.pages.dev", "http://localhost:3000"]);

interface PagesContext {
  request: Request;
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

export async function onRequestPost({ request }: PagesContext) {
  if (!allowedOrigin(request)) return new Response(null, { status: 403 });

  let input: { event?: unknown; path?: unknown };
  try {
    input = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  if (typeof input.event !== "string" || !EVENTS.has(input.event)) return new Response(null, { status: 400 });
  const path = typeof input.path === "string" && input.path.startsWith("/") ? input.path.slice(0, 120) : "/";

  // Cloudflare Web Analytics currently has no custom-event API. Keeping the
  // event as a first-party request makes the funnel visible in Pages/edge logs
  // without sending an email, cookie, IP, or referrer to a third party.
  console.log(JSON.stringify({ event: input.event, path, at: new Date().toISOString() }));
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

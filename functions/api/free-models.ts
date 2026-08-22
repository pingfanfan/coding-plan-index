import { parseOpenCodeFreeModels, parseOpenRouterFreeModels } from "../../lib/free-models";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=86400",
};

async function officialJson(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "CodingPlanIndexFreeModelRadar/1.0 (+https://cp.pingfan.me/free-models)" },
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json() as Promise<unknown>;
}

export async function onRequestGet() {
  const [openRouterResult, openCodeResult] = await Promise.allSettled([
    officialJson("https://openrouter.ai/api/v1/models"),
    officialJson("https://opencode.ai/zen/v1/models"),
  ]);

  const openRouter = openRouterResult.status === "fulfilled" ? parseOpenRouterFreeModels(openRouterResult.value) : [];
  const openCode = openCodeResult.status === "fulfilled" ? parseOpenCodeFreeModels(openCodeResult.value) : [];

  if (!openRouter.length && !openCode.length) {
    return new Response(JSON.stringify({ message: "官方免费模型目录暂时不可用" }), { status: 502, headers: jsonHeaders });
  }

  return new Response(JSON.stringify({
    checkedAt: new Date().toISOString(),
    openRouter,
    openCode,
    partial: openRouterResult.status === "rejected" || openCodeResult.status === "rejected",
  }), { headers: jsonHeaders });
}

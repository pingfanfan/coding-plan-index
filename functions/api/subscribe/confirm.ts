import { readConfirmationToken, resendRequest, resultPage, type SubscriptionEnv } from "../../_lib/subscription";

interface PagesContext {
  request: Request;
  env: SubscriptionEnv;
}

function html(body: string, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

async function restoreExistingContact(env: SubscriptionEnv, email: string) {
  const contact = encodeURIComponent(email);
  const updates = await Promise.all([
    resendRequest(env, `/contacts/${contact}`, { method: "PATCH", body: JSON.stringify({ unsubscribed: false }) }),
    resendRequest(env, `/contacts/${contact}/segments/${env.RESEND_SEGMENT_ID}`, { method: "POST" }),
    resendRequest(env, `/contacts/${contact}/topics`, {
      method: "PATCH",
      body: JSON.stringify({ topics: [{ id: env.RESEND_TOPIC_ID, subscription: "opt_in" }] }),
    }),
  ]);
  return updates.every((response) => response.ok || response.status === 409);
}

export async function onRequestGet({ request, env }: PagesContext) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const email = await readConfirmationToken(token, env.SUBSCRIBE_SECRET);
  if (!email) {
    return html(resultPage("确认链接已失效", "链接可能已过期或不完整。请返回活动页重新填写邮箱。", false), 400);
  }

  const created = await resendRequest(env, "/contacts", {
    method: "POST",
    body: JSON.stringify({
      email,
      unsubscribed: false,
      segments: [{ id: env.RESEND_SEGMENT_ID }],
      topics: [{ id: env.RESEND_TOPIC_ID, subscription: "opt_in" }],
    }),
  });

  const saved = created.ok || (created.status === 409 && await restoreExistingContact(env, email));
  if (!saved) {
    console.error("Resend contact confirmation failed", created.status, await created.text());
    return html(resultPage("暂时无法完成订阅", "服务刚才没有保存成功，请稍后再点一次确认链接。", false), 502);
  }

  return html(resultPage("订阅成功", "以后只有已核验的高价值促销才会发到你的邮箱，每封邮件都可以一键退订。", true));
}

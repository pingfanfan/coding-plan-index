import { confirmationEmail, createConfirmationToken, DEFAULT_RESEND_FROM, isEmail, requestComesFromSite, resendRequest, safeSiteOrigin, type SubscriptionEnv } from "../_lib/subscription";

interface PagesContext {
  request: Request;
  env: SubscriptionEnv;
}

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };

export async function onRequestPost({ request, env }: PagesContext) {
  if (!requestComesFromSite(request)) {
    return new Response(JSON.stringify({ message: "请求来源无效" }), { status: 403, headers: jsonHeaders });
  }

  let input: { email?: unknown; company?: unknown };
  try {
    input = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: "请求格式无效" }), { status: 400, headers: jsonHeaders });
  }

  if (typeof input.company === "string" && input.company.trim()) {
    return new Response(JSON.stringify({ message: "确认邮件已发送，请检查收件箱。" }), { headers: jsonHeaders });
  }
  if (!isEmail(input.email)) {
    return new Response(JSON.stringify({ message: "请输入有效的邮箱地址" }), { status: 400, headers: jsonHeaders });
  }

  const email = input.email.trim().toLowerCase();
  const token = await createConfirmationToken(email, env.SUBSCRIBE_SECRET);
  const confirmUrl = `${safeSiteOrigin(request, env.PUBLIC_SITE_URL)}/api/subscribe/confirm?token=${encodeURIComponent(token)}`;
  const sent = await resendRequest(env, "/emails", {
    method: "POST",
    headers: { "Idempotency-Key": `cp-subscribe-${token.split(".")[1]}` },
    body: JSON.stringify({
      from: env.RESEND_FROM || DEFAULT_RESEND_FROM,
      to: [email],
      subject: "确认订阅 CP 促销雷达",
      html: confirmationEmail(confirmUrl),
    }),
  });

  if (!sent.ok) {
    console.error("Resend confirmation failed", sent.status, await sent.text());
    return new Response(JSON.stringify({ message: "确认邮件暂时无法发送，请稍后重试" }), { status: 502, headers: jsonHeaders });
  }

  return new Response(JSON.stringify({ message: "确认邮件已发送，请在 24 小时内点击确认。" }), { headers: jsonHeaders });
}

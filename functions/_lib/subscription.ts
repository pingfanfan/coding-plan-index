export interface SubscriptionEnv {
  RESEND_API_KEY: string;
  RESEND_SEGMENT_ID?: string;
  RESEND_TOPIC_ID?: string;
  RESEND_FROM?: string;
  SUBSCRIBE_SECRET: string;
  PUBLIC_SITE_URL?: string;
}

export const DEFAULT_RESEND_FROM = "CP Alerts <alerts@notify.pingfan.me>";
export const DEFAULT_RESEND_SEGMENT_ID = "63149c73-3c86-43ab-a831-c0e10c6a7df0";
export const DEFAULT_RESEND_TOPIC_ID = "8c586d0f-c0ef-4472-b373-472fb23ada65";

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signed));
}

function equal(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export async function createConfirmationToken(email: string, secret: string, now = Date.now()) {
  const issued = Math.floor(now / (10 * 60 * 1000)) * 10 * 60 * 1000;
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({ email, expires: issued + 24 * 60 * 60 * 1000 })));
  return `${payload}.${await signature(payload, secret)}`;
}

export async function readConfirmationToken(token: string, secret: string, now = Date.now()) {
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return null;
  const expectedSignature = await signature(payload, secret);
  if (!equal(suppliedSignature, expectedSignature)) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as { email?: unknown; expires?: unknown };
    if (typeof parsed.email !== "string" || typeof parsed.expires !== "number" || parsed.expires < now) return null;
    return parsed.email;
  } catch {
    return null;
  }
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function safeSiteOrigin(request: Request, configured?: string) {
  if (configured) {
    try { return new URL(configured).origin; } catch { /* fall through */ }
  }
  return new URL(request.url).origin;
}

export function requestComesFromSite(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  try {
    const requestUrl = new URL(request.url);
    const supplied = new URL(origin);
    return supplied.origin === requestUrl.origin || supplied.hostname === "cp.pingfan.me" || supplied.hostname.endsWith(".coding-plan-index.pages.dev") || supplied.hostname === "localhost";
  } catch {
    return false;
  }
}

export async function resendRequest(env: SubscriptionEnv, path: string, init: RequestInit) {
  return fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

export function confirmationEmail(confirmUrl: string) {
  return `<!doctype html><html lang="zh-CN"><body style="margin:0;background:#f3f1eb;color:#121212;font-family:Arial,'PingFang SC',sans-serif"><div style="max-width:600px;margin:0 auto;padding:48px 24px"><div style="font-size:12px;font-weight:800;letter-spacing:.12em">CP / PROMO ALERT</div><h1 style="font-size:34px;line-height:1.1;margin:20px 0 12px">确认订阅促销雷达</h1><p style="font-size:15px;line-height:1.7;color:#5f5b54">确认后，只在出现已核验的 Token 赠送、限时折扣、临时加量或 Reset 时通知你。普通套餐更新不会发送。</p><a href="${confirmUrl}" style="display:inline-block;margin-top:24px;background:#121212;color:#fff;padding:14px 22px;text-decoration:none;font-weight:800">确认订阅 →</a><p style="margin-top:24px;font-size:12px;line-height:1.6;color:#77736b">链接 24 小时内有效。如果不是你本人操作，可以忽略这封邮件。</p></div></body></html>`;
}

export function resultPage(title: string, body: string, success: boolean) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#f3f1eb;color:#121212;font-family:Arial,'PingFang SC',sans-serif"><main style="max-width:640px;margin:10vh auto;padding:32px"><div style="display:inline-block;border:1px solid #121212;background:${success ? "#dfff00" : "#fff"};padding:6px 10px;font-size:11px;font-weight:800">CP 促销雷达</div><h1 style="font-size:42px;line-height:1.05;margin:24px 0 12px">${title}</h1><p style="font-size:15px;line-height:1.7;color:#5f5b54">${body}</p><a href="/offers" style="display:inline-block;margin-top:24px;background:#121212;color:#fff;padding:13px 20px;text-decoration:none;font-weight:800">查看最新活动 →</a></main></body></html>`;
}

"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";

type SubmitState = "idle" | "sending" | "sent" | "error";

type SubscriptionEvent = "subscribe_started" | "confirmation_sent" | "confirmation_failed";

function trackSubscriptionEvent(event: SubscriptionEvent) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ event, path: window.location.pathname });
  const blob = new Blob([body], { type: "application/json" });
  if (navigator.sendBeacon?.("/api/analytics", blob)) return;
  void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
}

export function PromoSubscribe({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("sending");
    setMessage("");
    trackSubscriptionEvent("subscribe_started");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          company: data.get("company"),
        }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "暂时无法发送确认邮件");
      setState("sent");
      setMessage(result.message || "确认邮件已发送，请在 24 小时内点击确认。");
      trackSubscriptionEvent("confirmation_sent");
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "暂时无法发送确认邮件");
      trackSubscriptionEvent("confirmation_failed");
    }
  }

  if (compact) {
    return (
      <section id="subscribe" className="scroll-mt-24 border-y hairline py-2.5" aria-label="订阅促销提醒">
        <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-3">
          <div className="flex shrink-0 items-center gap-1.5 text-[10px]">
            <Mail size={12} />
            <strong>促销提醒</strong>
            <span className="hidden text-[#625e57] xl:inline">赠送、折扣、临时加量</span>
          </div>
          <form onSubmit={submit} className="min-w-0 flex-1" noValidate>
            <div className="flex min-w-0 gap-1.5">
              <label htmlFor="promo-email-compact" className="sr-only">邮箱地址</label>
              <input
                id="promo-email-compact"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={254}
                placeholder="name@gmail.com"
                disabled={state === "sending"}
                className="h-8 min-w-0 flex-1 border hairline bg-transparent px-2.5 text-[11px] placeholder:text-[#77736b] disabled:opacity-60"
              />
              <input name="company" type="text" tabIndex={-1} autoComplete="off" className="absolute left-[-9999px]" aria-hidden="true" />
              <button type="submit" disabled={state === "sending"} className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 bg-black px-3 text-[10px] font-black !text-white disabled:cursor-wait disabled:opacity-65">
                {state === "sending" ? "发送中" : "订阅"}
                {state === "sent" ? <CheckCircle2 size={13} /> : <ArrowRight size={13} />}
              </button>
            </div>
            <p className={`${message ? "mt-1" : "sr-only"} text-[10px] font-bold ${state === "error" ? "text-[#b42318]" : "text-[#12663d]"}`} role="status" aria-live="polite">{message}</p>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section id="subscribe" className="mx-auto mt-8 max-w-xl scroll-mt-24 border border-black bg-white/45 p-4 md:p-5" aria-labelledby="promo-subscribe-title">
      <div>
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-[.14em]"><Mail size={14} /> PROMO ALERT</div>
          <h2 id="promo-subscribe-title" className="mt-2 text-xl font-black tracking-[-.04em] md:text-2xl">只订阅真正省钱的消息</h2>
          <p className="mt-1.5 text-xs leading-5 text-[#625e57]">只发赠送 Token、限时折扣、临时加量和 Reset。</p>
        </div>

        <form onSubmit={submit} className="relative mt-4 max-w-[420px]" noValidate>
          <label htmlFor="promo-email" className="sr-only">邮箱地址</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="promo-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              placeholder="name@gmail.com"
              disabled={state === "sending"}
              className="h-10 min-w-0 flex-1 border border-black bg-[var(--paper)] px-3 text-xs placeholder:text-[#77736b] disabled:opacity-60"
            />
            <input name="company" type="text" tabIndex={-1} autoComplete="off" className="absolute left-[-9999px]" aria-hidden="true" />
            <button
              type="submit"
              disabled={state === "sending"}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 border border-black bg-black px-4 text-[11px] font-black !text-white disabled:cursor-wait disabled:opacity-65"
            >
              {state === "sending" ? "发送中" : "订阅促销"}
              {state === "sent" ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#625e57]">邮件确认后生效，可随时退订。</p>
          <p className={`${message ? "mt-2" : "sr-only"} text-[11px] font-bold ${state === "error" ? "text-[#b42318]" : "text-[#12663d]"}`} role="status" aria-live="polite">{message}</p>
        </form>
      </div>
    </section>
  );
}

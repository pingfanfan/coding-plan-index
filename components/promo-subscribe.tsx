"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";

type SubmitState = "idle" | "sending" | "sent" | "error";

export function PromoSubscribe({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("sending");
    setMessage("");

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
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "暂时无法发送确认邮件");
    }
  }

  if (compact) {
    return (
      <section id="subscribe" className="scroll-mt-24 border-y border-black py-3" aria-label="订阅促销提醒">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-5">
          <div className="flex shrink-0 items-center gap-2 text-[11px]">
            <Mail size={13} />
            <strong>促销提醒</strong>
            <span className="text-[#625e57]">只发赠送、折扣与临时加量</span>
          </div>
          <form onSubmit={submit} className="min-w-0 flex-1" noValidate>
            <div className="flex min-w-0 gap-2">
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
                className="h-9 min-w-0 flex-1 border border-black bg-transparent px-3 text-xs placeholder:text-[#77736b] disabled:opacity-60"
              />
              <input name="company" type="text" tabIndex={-1} autoComplete="off" className="absolute left-[-9999px]" aria-hidden="true" />
              <button type="submit" disabled={state === "sending"} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 bg-black px-4 text-[11px] font-black !text-white disabled:cursor-wait disabled:opacity-65">
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

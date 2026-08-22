"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, RefreshCw } from "lucide-react";
import { fallbackOpenCodeFreeModels, type LiveFreeModel } from "@/lib/free-models";
import type { FreePlatform } from "@/lib/schema";

interface RadarPayload {
  checkedAt: string;
  openRouter: LiveFreeModel[];
  openCode: LiveFreeModel[];
  partial: boolean;
}

const fallbackOpenRouter: LiveFreeModel[] = [
  { id: "stealth/ox-alpha", name: "Ox Alpha", contextLength: 1_048_576, stealth: true, codingRelevant: true },
  { id: "openrouter/free", name: "Free Models Router", contextLength: 200_000, stealth: false, codingRelevant: true },
];

const categoryMeta: Record<FreePlatform["category"], { title: string; description: string }> = {
  renewable: { title: "持续免费额度", description: "按日、月或限流窗口补充；不是无限调用。" },
  model_zero: { title: "模型零价", description: "指定模型价格为 0，但账户请求和数据规则仍然存在。" },
  one_time: { title: "一次性免费额度", description: "首次开通或活动赠送；用完或到期后不会自动恢复。" },
  trial: { title: "免费试用", description: "有明确的试用期限或金额，不能当作永久免费。" },
  dev_access: { title: "开发测试免费", description: "适合原型、评估和自部署测试，生产授权另算。" },
  micro_credit: { title: "微量免费额度", description: "可以验证接口和模型，但不适合长时间 Agent。" },
};

const categoryOrder: FreePlatform["category"][] = ["renewable", "model_zero", "one_time", "trial", "dev_access", "micro_credit"];

function regionLabel(regions: FreePlatform["regions"]) {
  if (regions.includes("china") && regions.includes("international")) return "中国 · 国际";
  if (regions.includes("china")) return "中国";
  return "国际";
}

function liveDirectoryLabel(id: string, counts: { openRouter: number; openCode: number }, live: boolean) {
  const count = id === "openrouter" ? counts.openRouter : id === "opencode-zen" ? counts.openCode : null;
  if (count === null) return null;
  return `${live ? "实时目录" : "最近快照"} · ${count} 个模型`;
}

function FreePlatformDirectory({ platforms, counts, live }: { platforms: FreePlatform[]; counts: { openRouter: number; openCode: number }; live: boolean }) {
  return <section className="mt-10 border-t hairline pt-8">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div><div className="eyebrow">FREE RULES / OFFICIAL</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">先看免费规则，再看模型。</h2></div>
      <p className="max-w-sm text-[10px] leading-4 text-[#625e57]">平台类型不同，免费不等于同一种权益。每张卡片都保留官方规则入口和人工核验日期。</p>
    </div>
    <div className="mt-7 space-y-9">
      {categoryOrder.map((category) => {
        const items = platforms.filter((platform) => platform.category === category);
        if (!items.length) return null;
        const meta = categoryMeta[category];
        return <section key={category}>
          <div className="flex items-baseline gap-3"><h3 className="text-lg font-black">{meta.title}</h3><span className="font-mono text-[10px] text-[#777269]">{items.length} 个平台</span></div>
          <p className="mt-1 text-[10px] leading-4 text-[#625e57]">{meta.description}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {items.map((platform) => <article key={platform.id} className="paper-card p-5">
              <div className="flex items-start justify-between gap-3"><div><div className="text-[9px] font-bold uppercase tracking-[.12em] text-[#777269]">{platform.vendor} · {regionLabel(platform.regions)}</div><h4 className="mt-1 text-lg font-black tracking-[-.03em]">{platform.name}</h4></div><span className="shrink-0 pt-1 text-right text-[9px] font-black uppercase tracking-[.08em] text-[var(--blue)]">{platform.categoryLabel}</span></div>
              <p className="mt-3 text-xs font-bold leading-5">{platform.mechanism}</p>
              {liveDirectoryLabel(platform.id, counts, live) ? <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-black text-[#168b4f]"><span className="status-dot" />{liveDirectoryLabel(platform.id, counts, live)}</div> : null}
              <dl className="mt-4 grid gap-2 border-t hairline pt-3 text-[10px] leading-4 text-[#625e57] sm:grid-cols-2">
                <div><dt className="font-black text-black">额度</dt><dd>{platform.allowance}</dd></div>
                <div><dt className="font-black text-black">刷新</dt><dd>{platform.refresh}</dd></div>
                <div><dt className="font-black text-black">接入</dt><dd>{platform.requirements}</dd></div>
                <div><dt className="font-black text-black">适合</dt><dd>{platform.codingFit}</dd></div>
              </dl>
              <p className="mt-3 border-l-2 border-[#b77a00] pl-2 text-[10px] leading-4 text-[#7a4d00]">数据提示：{platform.privacy}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t hairline pt-3"><span className="font-mono text-[9px] text-[#777269]">核验 {platform.verifiedAt}</span><div className="flex gap-3 text-[10px] font-black"><a className="underline decoration-1 underline-offset-4 hover:text-[var(--blue)]" href={platform.officialUrl} target="_blank" rel="noreferrer">官网 <ArrowUpRight size={11} className="inline" /></a><a className="underline decoration-1 underline-offset-4 hover:text-[var(--blue)]" href={platform.rulesUrl} target="_blank" rel="noreferrer">免费规则 <ArrowUpRight size={11} className="inline" /></a></div></div>
            </article>)}
          </div>
        </section>;
      })}
    </div>
  </section>;
}

export function FreeModelRadar({ platforms }: { platforms: FreePlatform[] }) {
  const [data, setData] = useState<RadarPayload>({ checkedAt: "2026-08-22T00:00:00.000Z", openRouter: fallbackOpenRouter, openCode: fallbackOpenCodeFreeModels, partial: true });
  const [live, setLive] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/free-models", { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("free-model radar unavailable");
        return response.json() as Promise<RadarPayload>;
      })
      .then((payload) => { setData(payload); setLive(true); })
      .catch(() => { /* retain verified fallback */ });
    return () => controller.abort();
  }, []);

  return <>
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 bg-white/45 px-3 py-3 text-[10px] font-bold">
      <div className="flex items-center gap-2">{live ? <CheckCircle2 size={13} className="text-[#168b4f]" /> : <RefreshCw size={13} />} {live ? "已读取官方实时目录" : "显示最近核验快照"}</div>
      <div className="font-mono text-[#6f6b63]">{live ? new Date(data.checkedAt).toLocaleString("zh-CN", { hour12: false }) : "核验 2026-08-22"}</div>
    </div>

    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] leading-4 text-[#625e57]"><span>公开模型接口：实时读取；平台规则页：每 4 小时检测变化，人工确认后更新事实。</span><span className="font-mono">{platforms.length} 个官方平台</span></div>

    <FreePlatformDirectory platforms={platforms} counts={{ openRouter: data.openRouter.length, openCode: data.openCode.length }} live={live} />

    <div className="mt-10 flex gap-3 border border-[#b77a00] bg-[#fff4ce] p-4 text-xs leading-5"><AlertTriangle className="mt-0.5 shrink-0" size={16} /><p><strong>“隐身”不等于“匿名使用”。</strong>它只表示真实模型或供应方暂未公开。OpenRouter API 与 OpenCode Zen 仍需要账户和 API Key；免费端点也可能记录数据或用于模型改进，请勿提交密钥、个人信息和未公开代码。</p></div>
  </>;
}

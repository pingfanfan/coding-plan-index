"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, RefreshCw } from "lucide-react";
import { fallbackOpenCodeFreeModels, type LiveFreeModel } from "@/lib/free-models";
import type { FreeModelAccess, FreeModelSpotlight, FreePlatform } from "@/lib/schema";

interface RadarPayload {
  checkedAt: string;
  openRouter: LiveFreeModel[];
  openCode: LiveFreeModel[];
  partial: boolean;
}

const fallbackOpenRouter: LiveFreeModel[] = [
  { id: "openrouter/free", name: "Free Models Router", contextLength: 200_000, stealth: false, codingRelevant: true },
];

type FreeGroup = "recurring" | "platform" | "limited";

const groupMeta: Record<FreeGroup, { title: string; description: string }> = {
  recurring: { title: "周期刷新", description: "额度会按日、月或限流窗口恢复，适合持续试用。" },
  platform: { title: "平台免费模型", description: "模型价格为 0，但通常需要注册、API Key 或遵守平台限速。" },
  limited: { title: "一次性与开发测试", description: "赠送、试用或小额 credits；适合验证，不当作长期额度。" },
};

function groupFor(platform: FreePlatform): FreeGroup {
  if (platform.category === "renewable") return "recurring";
  if (platform.category === "model_zero") return "platform";
  return "limited";
}

function regionLabel(regions: FreePlatform["regions"]) {
  if (regions.includes("china") && regions.includes("international")) return "中国 · 国际";
  if (regions.includes("china")) return "中国";
  return "国际";
}

function directoryLabel(id: string, counts: { openRouter: number; openCode: number }, live: boolean) {
  const count = id === "openrouter" ? counts.openRouter : id === "opencode-zen" ? counts.openCode : null;
  if (count === null) return null;
  return `${live ? "实时目录" : "最近快照"} · ${count} 个模型`;
}

function accessStatus(access: FreeModelAccess, live: boolean, data: RadarPayload) {
  if (access.status === "not_confirmed") return "暂未证实为该模型入口";
  if (!live) return "官方核验 · 最近快照";
  if (access.id === "opencode-zen") return data.openCode.some((model) => model.id === "x-preview-f-free") ? "实时目录可见" : "实时目录未返回";
  return "官方当前说明";
}

function FreeModelSpotlight({ models, live, data }: { models: FreeModelSpotlight[]; live: boolean; data: RadarPayload }) {
  if (!models.length) return null;
  return <section className="mt-9 border-t hairline pt-7">
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div><div className="eyebrow">FREE MODEL / SPOTLIGHT</div><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">先看模型，再看入口。</h2></div>
      <p className="max-w-sm text-[10px] leading-4 text-[#625e57]">同一个模型可能出现在多个平台；这里把模型身份与平台免费额度分开，避免重复计算。</p>
    </div>
    <div className="mt-5 space-y-4">
      {models.map((model) => <article key={model.id} className="border hairline bg-white/60 p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="text-2xl font-black tracking-[-.05em]">{model.name}</h3>
              <span className="border border-[var(--blue)] px-2 py-1 text-[10px] font-black text-[var(--blue)]">{model.label}</span>
            </div>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-[#625e57]">{model.summary}</p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-x-5 gap-y-2 text-[10px] text-[#625e57] md:min-w-48">
            <div><div className="font-black text-black">价格</div><div className="mt-0.5">{model.price}</div></div>
            <div><div className="font-black text-black">上下文</div><div className="mt-0.5">{model.context.split("；")[0]}</div></div>
            <div className="col-span-2"><div className="font-black text-black">状态</div><div className="mt-0.5">{model.statusLabel}</div></div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t hairline pt-3 text-[10px] text-[#625e57]">
          {model.capabilities.map((capability) => <span key={capability}>{capability}</span>)}
        </div>
        <div className="mt-4 grid gap-px bg-[#d5d1c7] md:grid-cols-5">
          {model.access.map((access) => <div key={access.id} className="bg-[var(--paper)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-black">{access.name}</div>
              <span className={`shrink-0 text-[9px] font-black ${access.status === "verified" ? "text-[var(--blue)]" : "text-[#777269]"}`}>{access.status === "verified" ? "已核验" : "未确认"}</span>
            </div>
            <div className="mt-2 text-[10px] font-black leading-4 text-[#625e57]">{accessStatus(access, live, data)}</div>
            <p className="mt-2 text-[10px] leading-4 text-[#625e57]">{access.allowance}</p>
            <a className="mt-3 inline-flex items-center gap-1 text-[10px] font-black underline decoration-1 underline-offset-4" href={access.officialUrl} target="_blank" rel="noreferrer">官方入口 <ArrowUpRight size={11} /></a>
          </div>)}
        </div>
        <div className="mt-4 border-t hairline pt-3 text-[10px] leading-4 text-[#625e57]"><strong className="text-black">使用提醒：</strong>{model.caution}</div>
      </article>)}
    </div>
  </section>;
}

function CompactPlatform({ platform, counts, live }: { platform: FreePlatform; counts: { openRouter: number; openCode: number }; live: boolean }) {
  const directory = directoryLabel(platform.id, counts, live);
  return <details className="group border-b hairline bg-white/35 px-3 py-3 first:border-t sm:px-4">
    <summary className="flex cursor-pointer list-none items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h4 className="text-base font-black tracking-[-.025em]">{platform.name}</h4>
          <span className="text-[10px] text-[#777269]">{platform.vendor} · {regionLabel(platform.regions)}</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-[#625e57]">{platform.mechanism}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#777269]">
          <span className="font-black text-black">{platform.allowance}</span>
          {directory ? <span className="text-[var(--blue)]">{directory}</span> : null}
        </div>
      </div>
      <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center text-lg font-normal leading-none text-[#777269] transition group-open:rotate-45">+</span>
    </summary>
    <div className="mt-3 border-t hairline pt-3">
      <dl className="grid gap-x-6 gap-y-2 text-[11px] leading-4 text-[#625e57] sm:grid-cols-2">
        <div><dt className="font-black text-black">刷新</dt><dd>{platform.refresh}</dd></div>
        <div><dt className="font-black text-black">接入</dt><dd>{platform.requirements}</dd></div>
        <div><dt className="font-black text-black">适合</dt><dd>{platform.codingFit}</dd></div>
        <div><dt className="font-black text-black">核验</dt><dd>{platform.verifiedAt}</dd></div>
      </dl>
      <p className="mt-3 text-[10px] leading-4 text-[#625e57]">数据提示：{platform.privacy}</p>
      <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-black">
        <a className="underline decoration-1 underline-offset-4 hover:text-[var(--blue)]" href={platform.officialUrl} target="_blank" rel="noreferrer">官网 <ArrowUpRight size={11} className="inline" /></a>
        <a className="underline decoration-1 underline-offset-4 hover:text-[var(--blue)]" href={platform.rulesUrl} target="_blank" rel="noreferrer">免费规则 <ArrowUpRight size={11} className="inline" /></a>
      </div>
    </div>
  </details>;
}

function FreePlatformDirectory({ platforms, counts, live }: { platforms: FreePlatform[]; counts: { openRouter: number; openCode: number }; live: boolean }) {
  return <section className="mt-9 border-t hairline pt-7">
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div><div className="eyebrow">FREE RULES / OFFICIAL</div><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">先看免费类型，再看具体模型。</h2></div>
      <p className="max-w-sm text-[10px] leading-4 text-[#625e57]">默认只显示最重要的一句话；点击一行，才展开额度、限制与官方来源。</p>
    </div>
    <div className="mt-6 space-y-8">
      {(["recurring", "platform", "limited"] as FreeGroup[]).map((group) => {
        const items = platforms.filter((platform) => groupFor(platform) === group);
        if (!items.length) return null;
        const meta = groupMeta[group];
        return <section key={group}>
          <div className="flex items-baseline gap-3"><h3 className="text-lg font-black">{meta.title}</h3><span className="text-[10px] text-[#777269]">{items.length} 个平台</span></div>
          <p className="mt-1 text-[10px] leading-4 text-[#625e57]">{meta.description}</p>
          <div className="mt-3">
            {items.map((platform) => <CompactPlatform key={platform.id} platform={platform} counts={counts} live={live} />)}
          </div>
        </section>;
      })}
    </div>
  </section>;
}

export function FreeModelRadar({ platforms, spotlightModels }: { platforms: FreePlatform[]; spotlightModels: FreeModelSpotlight[] }) {
  const [data, setData] = useState<RadarPayload>({ checkedAt: "2026-08-31T00:00:00.000Z", openRouter: fallbackOpenRouter, openCode: fallbackOpenCodeFreeModels, partial: true });
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
    <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-b hairline pb-3 text-[10px] font-bold">
      <div className="flex items-center gap-2">{live ? <CheckCircle2 size={13} className="text-[var(--blue)]" /> : <RefreshCw size={13} />} {live ? "已读取官方实时目录" : "显示最近核验快照"}</div>
      <div className="font-mono text-[#6f6b63]">{live ? new Date(data.checkedAt).toLocaleString("zh-CN", { hour12: false }) : "核验 2026-08-31"}</div>
    </div>

    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] leading-4 text-[#625e57]"><span>模型目录实时读取；免费规则每 4 小时检测，人工确认后更新事实。</span><span className="font-mono">{platforms.length} 个平台</span></div>

    <FreeModelSpotlight models={spotlightModels} live={live} data={data} />

    <FreePlatformDirectory platforms={platforms} counts={{ openRouter: data.openRouter.length, openCode: data.openCode.length }} live={live} />

    <div className="mt-8 flex gap-3 border-t hairline pt-4 text-[11px] leading-5 text-[#625e57]"><AlertTriangle className="mt-0.5 shrink-0 text-[#777269]" size={15} /><p><strong className="text-black">免费不等于匿名。</strong> OpenRouter 与 OpenCode Zen 仍需要账户或 API Key；免费端点也可能记录数据，请勿提交密钥、个人信息和未公开代码。</p></div>
  </>;
}

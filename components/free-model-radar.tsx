"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, RefreshCw } from "lucide-react";
import { fallbackOpenCodeFreeModels, type LiveFreeModel } from "@/lib/free-models";

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

function contextLabel(value: number | null) {
  if (!value) return "上下文见官方目录";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}M context`;
  return `${Math.round(value / 1_000)}K context`;
}

function ModelRows({ models, privacy = false }: { models: LiveFreeModel[]; privacy?: boolean }) {
  return <div className="border-t border-black">{models.map((model) => <div key={model.id} className="grid gap-2 border-b hairline py-3 sm:grid-cols-[1fr_auto] sm:items-center">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><strong className="text-sm">{model.name}</strong>{model.stealth ? <span className="bg-black px-2 py-0.5 text-[9px] font-black text-white">隐身模型</span> : null}</div>
      <div className="mt-1 break-all font-mono text-[9px] text-[#6f6b63]">{model.id}</div>
      {privacy && model.privacyNote ? <p className="mt-1 text-[10px] leading-4 text-[#7a4d00]">{model.privacyNote}</p> : null}
    </div>
    <div className="text-[10px] font-bold text-[#6f6b63]">{contextLabel(model.contextLength)}</div>
  </div>)}</div>;
}

export function FreeModelRadar() {
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
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-black py-3 text-[10px] font-bold">
      <div className="flex items-center gap-2">{live ? <CheckCircle2 size={13} className="text-[#168b4f]" /> : <RefreshCw size={13} />} {live ? "已读取官方实时目录" : "显示最近核验快照"}</div>
      <div className="font-mono text-[#6f6b63]">{live ? new Date(data.checkedAt).toLocaleString("zh-CN", { hour12: false }) : "核验 2026-08-22"}</div>
    </div>

    <div className="mt-8 grid gap-10 lg:grid-cols-2">
      <section>
        <div className="flex items-end justify-between gap-4"><div><div className="eyebrow">OPENROUTER</div><h2 className="mt-2 text-2xl font-black">零价官方目录</h2></div><strong className="text-3xl">{data.openRouter.length}</strong></div>
        <p className="mt-3 text-xs leading-5 text-[#625e57]">按官方 Models API 中 prompt 与 completion 均为 0、且输出包含文本的模型实时筛选。目录可能随时增减。</p>
        <div className="mt-5"><ModelRows models={data.openRouter} /></div>
        <a href="https://openrouter.ai/models?max_price=0" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-black">打开官方免费目录 <ArrowUpRight size={13} /></a>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4"><div><div className="eyebrow">OPENCODE ZEN</div><h2 className="mt-2 text-2xl font-black">限时免费与隐身模型</h2></div><strong className="text-3xl">{data.openCode.length}</strong></div>
        <p className="mt-3 text-xs leading-5 text-[#625e57]">实时读取 Zen Models API，并用官方 Zen 定价与隐私说明核对免费状态。隐身模型的真实身份可能在活动结束后才公开。</p>
        <div className="mt-5"><ModelRows models={data.openCode} privacy /></div>
        <a href="https://opencode.ai/docs/zen/" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-black">打开 Zen 官方说明 <ArrowUpRight size={13} /></a>
      </section>
    </div>

    <div className="mt-10 flex gap-3 border border-[#b77a00] bg-[#fff4ce] p-4 text-xs leading-5"><AlertTriangle className="mt-0.5 shrink-0" size={16} /><p><strong>“隐身”不等于“匿名使用”。</strong>它只表示真实模型或供应方暂未公开。OpenRouter API 与 OpenCode Zen 仍需要账户和 API Key；免费端点也可能记录数据或用于模型改进，请勿提交密钥、个人信息和未公开代码。</p></div>
  </>;
}

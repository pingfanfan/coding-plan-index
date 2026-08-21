"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Film, Search, Volume2 } from "lucide-react";
import type { VideoPlan, VideoProduct } from "@/lib/schema";

const kindName = { "first-party": "第一方模型", studio: "创作工作室", aggregator: "多模型聚合", api: "API" } as const;

function price(plan?: VideoPlan) {
  if (!plan) return "官网未披露";
  if (plan.price.monthly === null) return "官网未披露";
  if (plan.price.monthly === 0) return "免费";
  return `${plan.price.currency === "USD" ? "$" : `${plan.price.currency} `}${plan.price.monthly}/月`;
}

function entryPlan(product: VideoProduct) {
  return product.plans
    .filter((plan) => plan.status === "current" && plan.price.monthly !== null && plan.price.monthly > 0)
    .sort((a, b) => (a.price.monthly ?? Infinity) - (b.price.monthly ?? Infinity))[0]
    ?? product.plans.find((plan) => plan.status === "current");
}

export function VideoExplorer({ products }: { products: VideoProduct[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [onlyApi, setOnlyApi] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => products.filter((product) => {
    const haystack = [product.name, product.vendor, ...product.models, ...product.capabilities].join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase()) && (kind === "all" || product.kind === kind) && (!onlyApi || product.apiAvailable);
  }), [products, query, kind, onlyApi]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 4 ? [...current, id] : current);
  }

  const apiRates = products.flatMap((product) => product.rates
    .filter((rate) => rate.billingUnit === "usd_per_second" && rate.amount !== null)
    .map((rate) => ({ product: product.name, rate })))
    .sort((a, b) => (a.rate.amount ?? 0) - (b.rate.amount ?? 0));
  const maxFiveSecond = Math.max(...apiRates.map((item) => (item.rate.amount ?? 0) * 5), 1);

  return <>
    <section className="shell py-12 md:py-16">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div><div className="eyebrow">VIDEO CATALOG / OFFICIAL DATA</div><h1 className="mt-3 max-w-5xl text-5xl font-black leading-[.9] tracking-[-.065em] md:text-8xl">AI 视频很贵，<br /><span className="text-[var(--blue)]">所以更要算清。</span></h1></div>
        <p className="max-w-md text-sm leading-6 text-[#625e57]">独立于 Coding Plan 的计费体系。套餐、App credits、API units、美元/秒各自保留，不把同名“credit”硬换算成一个虚假的总分。</p>
      </div>
      <div className="mt-10 grid gap-px border hairline bg-[#d5d1c7] sm:grid-cols-2 lg:grid-cols-4">
        {[[products.filter((p) => p.status === "current").length, "当前平台"], [products.reduce((sum, p) => sum + p.plans.filter((x) => x.status === "current").length, 0), "当前套餐"], [products.reduce((sum, p) => sum + p.rates.length, 0), "原生费率样本"], [products.filter((p) => p.apiAvailable).length, "提供 API"]].map(([value, label]) => <div className="bg-[var(--paper)] p-5" key={label}><div className="text-4xl font-black">{value}</div><div className="mt-2 text-xs font-black text-[#6f6b63]">{label}</div></div>)}
      </div>
    </section>

    <section className="border-y border-black bg-black py-12 text-white">
      <div className="shell grid gap-10 lg:grid-cols-[340px_1fr]">
        <div><div className="eyebrow text-white/50">5-SECOND API RULER</div><h2 className="mt-3 text-3xl font-black tracking-[-.04em]">5 秒 API 参考成本</h2><p className="mt-4 text-xs leading-5 text-white/55">只收录官网明确给出 USD/秒的费率，按线性规则乘以 5。不同分辨率、音频与模式分别成行；这不是质量排名。</p></div>
        <div className="space-y-3">
          {apiRates.map(({ product, rate }) => { const cost = (rate.amount ?? 0) * 5; return <div key={`${product}-${rate.id}`} className="grid grid-cols-[120px_1fr_58px] items-center gap-3 text-[10px] sm:grid-cols-[190px_1fr_70px]"><div className="truncate"><strong>{product}</strong><span className="ml-2 text-white/45">{rate.model} · {rate.resolution}{rate.audio ? " · 音频" : ""}</span></div><div className="h-3 bg-white/10"><div className="h-full bg-[var(--acid)]" style={{ width: `${Math.max(2, cost / maxFiveSecond * 100)}%` }} /></div><div className="text-right font-black">${cost.toFixed(2)}</div></div>; })}
        </div>
      </div>
    </section>

    <section className="shell py-12 md:py-16" id="catalog">
      <div className="grid gap-px border hairline bg-[#d5d1c7] md:grid-cols-[1.5fr_1fr_1fr_auto]">
        <label className="relative bg-[var(--paper)] p-3"><Search className="absolute left-4 top-6" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索平台、模型、能力" className="h-10 w-full bg-white/60 pl-9 pr-3 text-xs font-bold outline-none" /></label>
        <label className="bg-[var(--paper)] p-3"><select value={kind} onChange={(event) => setKind(event.target.value)} className="h-10 w-full bg-white/60 px-3 text-xs font-black outline-none"><option value="all">全部类型</option><option value="first-party">第一方模型</option><option value="studio">创作工作室</option><option value="aggregator">多模型聚合</option><option value="api">API</option></select></label>
        <button onClick={() => setOnlyApi((value) => !value)} className={`bg-[var(--paper)] px-4 text-left text-xs font-black ${onlyApi ? "!bg-black text-white" : ""}`}>{onlyApi ? <Check className="mr-2 inline" size={14} /> : null}只看 API</button>
        <div className="grid place-items-center bg-[var(--paper)] px-5 text-[10px] font-black text-[#6f6b63]">{filtered.length} RESULTS</div>
      </div>

      <div className="mt-8 grid gap-px border hairline bg-[#d5d1c7] lg:grid-cols-2">
        {filtered.map((product) => { const plan = entryPlan(product); const planKey = plan ? `${product.slug}::${plan.id}` : null; const isSelected = planKey ? selected.includes(planKey) : false; return <article key={product.slug} className="flex min-h-[320px] flex-col bg-[var(--paper)] p-5 md:p-6">
          <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="h-4 w-4 rounded-full border border-black" style={{ background: product.accent }} /><div><div className="text-[9px] font-black text-[#6f6b63]">{kindName[product.kind]} · {product.status === "current" ? "当前" : "已停止"}</div><h2 className="mt-1 text-2xl font-black tracking-[-.04em]">{product.name}</h2></div></div><div className="text-right"><div className="text-xl font-black">{price(plan)}</div><div className="mt-1 text-[9px] text-[#6f6b63]">{plan?.name ?? "无当前套餐"}</div></div></div>
          <p className="mt-5 text-xs leading-5 text-[#625e57]">{product.summary}</p>
          <div className="mt-5 grid grid-cols-2 gap-px bg-[#d5d1c7] text-[10px]"><div className="bg-white/55 p-3"><span className="text-[#6f6b63]">最高分辨率</span><strong className="mt-1 block">{product.maxResolution}</strong></div><div className="bg-white/55 p-3"><span className="text-[#6f6b63]">原生音频</span><strong className="mt-1 block">{product.nativeAudio === null ? "因模型而异" : product.nativeAudio ? "支持" : "未支持"}</strong></div><div className="bg-white/55 p-3"><span className="text-[#6f6b63]">入口额度</span><strong className="mt-1 block">{plan?.credits.amount ?? "官网未披露"} {plan?.credits.unit ?? ""}</strong></div><div className="bg-white/55 p-3"><span className="text-[#6f6b63]">API</span><strong className="mt-1 block">{product.apiAvailable ? "有" : "未提供"}</strong></div></div>
          <div className="mt-auto flex items-center justify-between gap-3 pt-6"><Link href={`/video/${product.slug}`} className="flex items-center gap-1 text-xs font-black">完整费率与规则 <ArrowRight size={13} /></Link>{planKey && <button onClick={() => toggle(planKey)} className={`border border-black px-3 py-2 text-[10px] font-black ${isSelected ? "bg-black text-white" : ""}`}>{isSelected ? "已选比较" : "加入比较"}</button>}</div>
        </article>; })}
      </div>
    </section>

    <section className="shell pb-20">
      <div className="grid gap-px border hairline bg-[#d5d1c7] md:grid-cols-3">
        {[[Film, "先定片段规格", "同一模型的 5/10 秒、720p/1080p、音频开关可能让成本相差数倍。"], [Volume2, "音频不是赠品", "Veo、Kling、PixVerse 的原生音频常有独立费率，必须和纯视频分开。"], [Check, "按实际工作流选", "第一方模型适合可控性；聚合平台适合试模型；API 适合批量与产品集成。"]].map(([Icon, title, body]) => { const I = Icon as typeof Film; return <div key={String(title)} className="bg-[var(--paper)] p-6"><I size={20} /><h3 className="mt-8 text-sm font-black">{String(title)}</h3><p className="mt-2 text-xs leading-5 text-[#6f6b63]">{String(body)}</p></div>; })}
      </div>
    </section>

    {selected.length > 0 && <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 border border-white/20 bg-black px-5 py-3 text-white shadow-2xl"><span className="text-xs font-black">已选 {selected.length}/4</span><Link href={`/video/compare?plans=${encodeURIComponent(selected.join(","))}`} className="bg-[var(--acid)] px-4 py-2 text-xs font-black text-black">开始比较</Link></div>}
  </>;
}

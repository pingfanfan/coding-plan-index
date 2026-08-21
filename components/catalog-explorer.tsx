"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/lib/schema";
import { allPlanId, formatMonthlyPrice, leadPlan, quotaLabel } from "@/lib/format";
import { productLogo } from "@/lib/logos";
import { modelAccessBadge, modelAccessLabels } from "@/lib/model-access";

const regions = [["all", "全部地区"], ["china", "中国"], ["international", "国际"]];
const audiences = [["all", "全部类型"], ["individual", "个人"], ["team", "团队"], ["api", "API"]];
const modelModes: Array<["all" | Product["modelAccess"]["mode"], string]> = [
  ["all", "全部模型方式"],
  ["fixed", "固定模型"],
  ["same_family", "同族多模型"],
  ["curated_multi", "精选多模型"],
  ["open_byok", "开放模型 / BYOK"],
  ["marketplace", "模型市场 / Router"],
];

export function CatalogExplorer({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [audience, setAudience] = useState("all");
  const [modelMode, setModelMode] = useState<"all" | Product["modelAccess"]["mode"]>("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [byokOnly, setByokOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const activeFilterCount = [region !== "all", audience !== "all", modelMode !== "all", freeOnly, byokOnly].filter(Boolean).length;

  const filtered = useMemo(() => products.filter((product) => {
    const haystack = [product.name, product.family, product.summary, modelAccessLabels[product.modelAccess.mode], product.modelAccess.note, ...product.models, ...product.plans.map((p) => p.name)].join(" ").toLowerCase();
    const regionOk = region === "all" || product.regions.includes(region as "china" | "international") || product.regions.includes("global");
    const audienceOk = audience === "all" || product.plans.some((p) => p.audience === audience && p.status !== "legacy");
    const freeOk = !freeOnly || product.plans.some((p) => p.price.monthly === 0 && p.status === "current");
    const modelModeOk = modelMode === "all" || product.modelAccess.mode === modelMode;
    return haystack.includes(query.toLowerCase()) && regionOk && audienceOk && modelModeOk && freeOk && (!byokOnly || product.byok);
  }), [products, query, region, audience, modelMode, freeOnly, byokOnly]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 4 ? [...current, id] : current);
  }

  return (
    <section id="catalog" className="shell py-12">
      <div className="mb-5 flex items-end justify-between gap-6">
        <h2 className="text-2xl font-black tracking-[-.04em]">产品与套餐</h2>
        <div className="text-xs font-bold text-[#6f6b63]">显示 {filtered.length} / {products.length}</div>
      </div>

      <div className="mb-6 border-y hairline py-3">
        <div className="flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-3 bg-white/55 px-3">
            <Search size={16} aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="搜索厂商、产品、套餐或模型" aria-label="搜索" />
            {query && <button onClick={() => setQuery("")} aria-label="清除搜索"><X size={14} /></button>}
          </label>
          <button type="button" onClick={() => setFiltersOpen((value) => !value)} className="flex h-11 shrink-0 items-center gap-2 px-3 text-xs font-black text-[#5f5b54] hover:text-black" aria-expanded={filtersOpen}><SlidersHorizontal size={14} /> 筛选{activeFilterCount ? ` ${activeFilterCount}` : ""}<ChevronDown size={13} className={`transition ${filtersOpen ? "rotate-180" : ""}`} /></button>
        </div>
        {filtersOpen && <div className="mt-3 grid gap-3 border-t hairline pt-3 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1.3fr_auto]">
          <label className="text-[10px] font-bold text-[#6f6b63]">地区<select value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 block h-9 w-full bg-white/55 px-2 text-xs font-bold text-black outline-none" aria-label="地区">{regions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-[10px] font-bold text-[#6f6b63]">套餐<select value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-1 block h-9 w-full bg-white/55 px-2 text-xs font-bold text-black outline-none" aria-label="套餐类型">{audiences.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-[10px] font-bold text-[#6f6b63]">模型方式<select value={modelMode} onChange={(e) => setModelMode(e.target.value as typeof modelMode)} className="mt-1 block h-9 w-full bg-white/55 px-2 text-xs font-bold text-black outline-none" aria-label="模型接入方式">{modelModes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="flex items-end gap-4 pb-2 text-xs font-bold"><label className="flex items-center gap-2"><input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} /> 免费</label><label className="flex items-center gap-2"><input type="checkbox" checked={byokOnly} onChange={(e) => setByokOnly(e.target.checked)} /> BYOK</label></div>
        </div>}
      </div>

      <div className="grid gap-px border hairline bg-[#d5d1c7] md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((product) => {
          const plan = leadPlan(product, region);
          const id = allPlanId(product.slug, plan.id);
          const active = selected.includes(id);
          const logo = productLogo(product.slug);
          return (
            <article key={product.slug} className="group relative flex min-h-[292px] flex-col bg-[var(--paper)] p-5 transition hover:bg-white">
              <div className="mb-6 flex items-start justify-between">
                <div>{logo ? <span className="grid h-9 w-9 place-items-center bg-white"><Image src={logo} alt={`${product.name} Logo`} width={20} height={20} /></span> : <span className="block h-3 w-3 rounded-full" style={{ background: product.accent }} />}</div>
                <button onClick={() => toggle(id)} disabled={!active && selected.length >= 4} className={`grid h-8 w-8 place-items-center border text-xs transition ${active ? "border-black bg-[var(--acid)]" : "hairline bg-white/50 hover:border-black"}`} aria-label={`${active ? "移除" : "加入"}${plan.name}比较`}>
                  {active ? <Check size={14} /> : <span className="text-lg leading-none">+</span>}
                </button>
              </div>
              <div className="text-[10px] font-bold text-[#777269]">{product.family} · {modelAccessBadge(product.modelAccess)}</div>
              <h3 className="mt-1.5 text-xl font-black tracking-[-.04em]">{product.name}</h3>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#6f6b63]">{product.summary}</p>
              <div className="mt-auto pt-6">
                <div className="flex items-end justify-between gap-4 border-t hairline pt-4">
                  <div><div className="text-[10px] font-bold text-[#6f6b63]">{plan.name}</div><div className="mt-1 text-xl font-black">{formatMonthlyPrice(plan)}</div></div>
                  <div className="max-w-[56%] text-right text-[10px] leading-4 text-[#6f6b63]">{quotaLabel(plan)}</div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="mono text-[10px] text-[#6f6b63]">核验 {product.verifiedAt}</span>
                  <Link href={`/products/${product.slug}`} className="flex items-center gap-1 text-xs font-black group-hover:gap-2">详情 <ArrowRight size={13} /></Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="grid min-h-60 place-items-center border hairline text-sm text-[#6f6b63]"><div className="text-center"><SlidersHorizontal className="mx-auto mb-3" /><p>没有匹配项，试试减少筛选条件。</p></div></div>}

      {selected.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex w-[min(680px,calc(100%-24px))] -translate-x-1/2 items-center justify-between gap-4 border border-white/20 bg-black px-4 py-3 text-white shadow-2xl">
          <div><div className="text-xs font-black">已选 {selected.length} / 4</div><div className="mt-1 text-[10px] text-white/55">默认加入每个产品当前展示的套餐</div></div>
          <div className="flex items-center gap-2"><button onClick={() => setSelected([])} className="px-3 py-2 text-xs text-white/60">清空</button><Link href={`/compare?plans=${encodeURIComponent(selected.join(","))}&region=${region}`} className="bg-[var(--acid)] px-4 py-2 text-xs font-black text-black">开始比较 →</Link></div>
        </div>
      )}
    </section>
  );
}

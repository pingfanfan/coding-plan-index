"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BarChart3, ChevronDown, ChevronUp, Info, List, Sparkles } from "lucide-react";
import { usdCnyReference } from "@/lib/exchange";
import type { DecisionEstimate, Product } from "@/lib/schema";
import { modelAccessBadge } from "@/lib/model-access";
import {
  buildDecisionPoints,
  intelligenceLabels,
  occupiedIntelligenceLevels,
  type DecisionAudience,
  type DecisionBasis,
  type DecisionConfidence,
  type DecisionPoint,
  type DecisionRegion,
} from "@/lib/pareto";

const currencySymbol: Record<string, string> = { USD: "$", CNY: "¥", EUR: "€", GBP: "£" };
const confidenceLabel: Record<DecisionConfidence, string> = { high: "高", medium: "中", low: "低" };
const basisLabel: Record<DecisionBasis, string> = { official: "官网", independent: "独立评测", community: "社区反馈", mixed: "官网 + 独立评测" };

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(Math.max(620, Math.floor(element.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

function money(point: DecisionPoint) {
  return `${point.converted ? "≈ " : ""}${currencySymbol[point.currency] ?? point.currency} ${point.price}`;
}

function originalMoney(point: DecisionPoint) {
  return `${currencySymbol[point.originalCurrency] ?? point.originalCurrency} ${point.originalPrice}`;
}

type MobileSort = "intelligence" | "usage" | "price";
type MobileView = "table" | "chart";

function haloArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const point = (angle: number) => {
    const radians = angle * Math.PI / 180;
    return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
  };
  const start = point(startAngle);
  const end = point(endAngle);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}

function UsageHalo({ cx, cy, level, confidence, radius = 17, strokeWidth = 2, active = false, marketColor }: { cx: number; cy: number; level: number; confidence: DecisionConfidence; radius?: number; strokeWidth?: number; active?: boolean; marketColor?: string }) {
  const segmentGap = 7;
  const segmentSpan = (270 - segmentGap * 4) / 5;
  const confidenceOpacity = confidence === "high" ? 1 : confidence === "medium" ? .78 : .58;
  return <g aria-hidden="true">
    {[0, 1, 2, 3, 4].map((index) => {
      const start = -45 + index * (segmentSpan + segmentGap);
      const enabled = index < level;
      return <path key={index} d={haloArc(cx, cy, radius, start, start + segmentSpan)} fill="none" stroke={enabled ? "var(--blue)" : "#d7d2c8"} strokeWidth={enabled && active ? strokeWidth + .7 : strokeWidth} strokeLinecap="round" strokeDasharray={enabled && confidence === "low" ? "2 2" : undefined} opacity={enabled ? confidenceOpacity : .7} />;
    })}
    {marketColor && <circle cx={cx} cy={cy - radius} r={Math.max(1.6, strokeWidth)} fill={marketColor} stroke="white" strokeWidth=".7" />}
  </g>;
}

export function DecisionMap({ products, estimates, compact = false }: { products: Product[]; estimates: DecisionEstimate[]; compact?: boolean }) {
  const [region, setRegion] = useState<DecisionRegion>("all");
  const [audience, setAudience] = useState<DecisionAudience>("individual");
  const [currency, setCurrency] = useState("USD");
  const [sort, setSort] = useState<MobileSort>("intelligence");
  const [mobileView, setMobileView] = useState<MobileView>("table");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{ point: DecisionPoint; x: number; y: number } | null>(null);
  const { ref, width } = useContainerWidth();

  const points = useMemo(() => buildDecisionPoints(products, estimates, { region, audience, currency }), [products, estimates, region, audience, currency]);
  const mobileProductPoints = useMemo(() => {
    const cheapest = new Map<string, DecisionPoint>();
    for (const point of points) {
      const current = cheapest.get(point.productSlug);
      if (!current || point.price < current.price) cheapest.set(point.productSlug, point);
    }
    return [...cheapest.values()].sort((a, b) => {
      if (sort === "price") return a.price - b.price || a.agentRank - b.agentRank;
      if (sort === "usage") return b.usageLevel - a.usageLevel || a.agentRank - b.agentRank || a.price - b.price;
      return a.agentRank - b.agentRank || a.price - b.price;
    });
  }, [points, sort]);
  const mobilePoints = expanded ? mobileProductPoints : mobileProductPoints.slice(0, 10);
  const selected = points.find((point) => point.id === selectedId) ?? points.reduce<DecisionPoint | undefined>((best, point) => !best || point.agentRank < best.agentRank ? point : best, undefined);
  const selectedProduct = selected ? products.find((product) => product.slug === selected.productSlug) : null;

  const height = compact ? 470 : 520;
  const margin = { top: 45, right: 88, bottom: 66, left: 88 };
  const plotWidth = Math.max(1, width - margin.left - margin.right);
  const plotHeight = height - margin.top - margin.bottom;
  const maxPrice = Math.max(10, ...points.map((point) => point.price));
  const x = (value: number) => margin.left + (Math.log1p(value) / Math.log1p(maxPrice)) * plotWidth;
  const yTicks = occupiedIntelligenceLevels(points);
  const y = (value: number) => {
    if (yTicks.length <= 1) return margin.top + plotHeight / 2;
    const exactIndex = yTicks.indexOf(value);
    const levelIndex = exactIndex >= 0
      ? exactIndex
      : yTicks.reduce((nearest, level, index) => Math.abs(level - value) < Math.abs(yTicks[nearest] - value) ? index : nearest, 0);
    return margin.top + ((yTicks.length - 1 - levelIndex) / (yTicks.length - 1)) * plotHeight;
  };
  const pointOffsets = new Map<string, { dx: number; dy: number }>();
  const placed: Array<{ x: number; y: number }> = [];
  const candidates = [
    { dx: 0, dy: 0 }, { dx: -17, dy: -17 }, { dx: 17, dy: 17 }, { dx: -17, dy: 17 }, { dx: 17, dy: -17 },
    { dx: -34, dy: 0 }, { dx: 34, dy: 0 }, { dx: 0, dy: -34 }, { dx: 0, dy: 34 },
    { dx: -34, dy: -34 }, { dx: 34, dy: 34 }, { dx: -34, dy: 34 }, { dx: 34, dy: -34 },
    { dx: -51, dy: 0 }, { dx: 51, dy: 0 }, { dx: 0, dy: -51 }, { dx: 0, dy: 51 },
  ];
  for (const point of points) {
    const baseX = x(point.price); const baseY = y(point.intelligenceLevel);
    const chosen = candidates.find((candidate) => {
      const candidateX = baseX + candidate.dx; const candidateY = baseY + candidate.dy;
      if (candidateX < margin.left + 18 || candidateX > width - margin.right - 18 || candidateY < margin.top + 18 || candidateY > height - margin.bottom - 18) return false;
      return placed.every((item) => Math.hypot(item.x - candidateX, item.y - candidateY) >= 34);
    }) ?? { dx: 0, dy: 0 };
    pointOffsets.set(point.id, chosen);
    placed.push({ x: baseX + chosen.dx, y: baseY + chosen.dy });
  }
  const rawTicks = currency === "CNY" ? [10, 50, 100, 200, 500, 1000] : [3, 10, 20, 50, 100, 200, 300];
  const xTicks = Array.from(new Set([...rawTicks.filter((tick) => tick < maxPrice), maxPrice])).sort((a, b) => a - b);
  function changeRegion(value: DecisionRegion) {
    setRegion(value);
    setSelectedId(null);
    if (value === "china" && currency === "USD") setCurrency("CNY");
    if (value === "international" && currency === "CNY") setCurrency("USD");
  }

  return (
    <section className={compact ? "shell py-5 md:py-10" : "shell py-8 md:py-16"} aria-labelledby="decision-map-title">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="hidden eyebrow md:block">DECISION MAP / ESTIMATED</div>
          <h2 id="decision-map-title" className={`${compact ? "text-[26px] md:text-5xl" : "text-3xl md:text-7xl"} md:mt-2 max-w-4xl font-black leading-[.98] tracking-[-.055em]`}>{compact ? <>价格 × Agent × <span className="text-[var(--blue)]">用量</span></> : <>价格、Agent、用量，<br /><span className="text-[var(--blue)]">放在一起看。</span></>}</h2>
        </div>
        <p className="hidden max-w-lg text-xs leading-5 text-[#6f6b63] md:block">{compact ? "官网价格；Agent 能力与可用量采用带置信度的估计。" : "纵轴是 Coding Agent 能力估计，Logo 外五段光环是套餐可用量档位。它们是带证据和置信度的宽档判断，不是伪精确跑分；价格与原始额度仍全部来自官网。"}</p>
      </div>

      <div className={`${compact ? "mt-3 md:mt-5" : "mt-4 md:mt-7"} border border-black bg-[rgba(255,255,255,.42)]`}>
        <button type="button" onClick={() => setFiltersOpen((value) => !value)} className="flex w-full items-center justify-between border-b hairline px-3 py-2.5 text-[10px] font-black md:hidden" aria-expanded={filtersOpen}>
          <span>筛选 · {region === "all" ? "中外" : region === "china" ? "中国" : "国际"} · {currency} · {audience === "individual" ? "个人" : "团队"}</span>
          {filtersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <div className={`${filtersOpen ? "grid" : "hidden"} grid-cols-1 gap-px border-b border-black bg-[#d5d1c7] md:grid md:grid-cols-3`}>
          <label className="min-w-0 bg-[var(--paper)] p-2 text-[9px] font-black text-[#6f6b63] md:p-3 md:text-[10px]">市场
            <select value={region} onChange={(event) => changeRegion(event.target.value as DecisionRegion)} className="mt-1 block h-8 w-full min-w-0 border-0 bg-white/60 px-1 text-[9px] font-black text-black outline-none md:h-9 md:px-2 md:text-xs">
              <option value="all">全部 · 中国 + 国际</option><option value="china">中国市场</option><option value="international">国际市场</option>
            </select>
          </label>
          <label className="min-w-0 bg-[var(--paper)] p-2 text-[9px] font-black text-[#6f6b63] md:p-3 md:text-[10px]">币种
            <select value={currency} onChange={(event) => { setCurrency(event.target.value); setSelectedId(null); }} className="mt-1 block h-8 w-full min-w-0 border-0 bg-white/60 px-1 text-[9px] font-black text-black outline-none md:h-9 md:px-2 md:text-xs">
              <option value="USD">USD 美元</option><option value="CNY">CNY 人民币</option>
            </select>
          </label>
          <label className="min-w-0 bg-[var(--paper)] p-2 text-[9px] font-black text-[#6f6b63] md:p-3 md:text-[10px]">套餐对象
            <select value={audience} onChange={(event) => { setAudience(event.target.value as DecisionAudience); setSelectedId(null); }} className="mt-1 block h-8 w-full min-w-0 border-0 bg-white/60 px-1 text-[9px] font-black text-black outline-none md:h-9 md:px-2 md:text-xs">
              <option value="individual">个人套餐</option><option value="team">团队套餐</option>
            </select>
          </label>
        </div>

        <div className="hidden flex-wrap items-center justify-between gap-2 border-b hairline px-3 py-2 text-[9px] font-bold text-[#817c73] md:flex">
          <span>Logo 外五段光环表示用量档位；光环明暗反映估计置信度。悬停查看详情。</span>
          <a href={usdCnyReference.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-black">USD/CNY {usdCnyReference.rate} · {usdCnyReference.effectiveAt} · SAFE</a>
        </div>

        <div className="md:hidden">
          <div className="flex items-center justify-between gap-3 border-b hairline px-2 py-2">
            <div className="flex h-8 items-center border hairline bg-white/60 p-0.5" aria-label="手机展示方式">
              <button type="button" onClick={() => setMobileView("table")} className={`flex h-full items-center gap-1 px-2 text-[10px] font-black ${mobileView === "table" ? "bg-black text-white" : "text-[#6f6b63]"}`} aria-pressed={mobileView === "table"}><List size={12} /> 表</button>
              <button type="button" onClick={() => setMobileView("chart")} className={`flex h-full items-center gap-1 px-2 text-[10px] font-black ${mobileView === "chart" ? "bg-black text-white" : "text-[#6f6b63]"}`} aria-pressed={mobileView === "chart"}><BarChart3 size={12} /> 图</button>
            </div>
            {mobileView === "table" ? <label className="flex items-center gap-2 text-[10px] font-black">排序
              <select value={sort} onChange={(event) => { setSort(event.target.value as MobileSort); setExpanded(false); }} className="h-8 border hairline bg-white/70 px-2 text-[11px] outline-none">
                <option value="intelligence">Agent 能力</option><option value="usage">用量优先</option><option value="price">价格优先</option>
              </select>
            </label> : <div className="text-[9px] font-bold text-[#817c73]">同产品多套餐连线</div>}
          </div>
          {mobileView === "chart" ? <MobileDecisionChart points={points} currency={currency} /> : mobileProductPoints.length ? <>
          <div className="divide-y divide-[#d5d1c7]">
            {mobilePoints.map((point) => <Link key={point.id} href={`/products/${point.productSlug}`} className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-2 px-2.5 py-2.5 active:bg-white/70">
              <div className="min-w-0">
                <div className="flex items-center gap-2">{point.logo ? <span className="grid h-6 w-6 shrink-0 place-items-center rounded border hairline bg-white"><Image src={point.logo} alt="" width={14} height={14} /></span> : null}<div className="min-w-0"><div className="truncate text-[11px] font-black"><span className="mr-1 text-[var(--blue)]">#{point.agentRank}</span>{point.shortName} <span className="font-medium text-[#817c73]">· {point.planName}</span></div><div className="mt-1 flex gap-1.5 text-[8px] font-bold"><span className="bg-[rgba(43,89,255,.1)] px-1.5 py-0.5 text-[var(--blue)]">Agent {point.intelligenceLabel}</span><span className="bg-[rgba(183,207,0,.18)] px-1.5 py-0.5 text-[#667400]">量 {point.usageLabel}</span></div></div></div>
              </div>
              <div className="text-right"><div className="text-[13px] font-black">{money(point)}</div><div className="mt-0.5 text-[8px] text-[#817c73]">起步/月 · {point.marketLabel}</div></div>
            </Link>)}
          </div>
          {mobileProductPoints.length > 10 && <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-center justify-center gap-1 border-t hairline px-3 py-3 text-[10px] font-black">{expanded ? <><ChevronUp size={13} /> 收起到前 10 行</> : <><ChevronDown size={13} /> 展开其余 {mobileProductPoints.length - 10} 行</>}</button>}
          </> : <EmptyState />}
          <div className="border-t hairline px-3 py-2 text-[8px] leading-4 text-[#817c73]">{mobileView === "table" ? "每个产品只列一次 · 默认按 Agent 能力 · 价格为最低明码付费档" : "每行一个产品 · 同行光环是不同套餐 · 亮起段数表示用量"}</div>
        </div>

        <div ref={ref} className="relative hidden min-h-[470px] overflow-hidden md:block" onMouseLeave={() => setHovered(null)}>
          {points.length ? <>
            <svg width={width} height={height} role="img" aria-labelledby="map-svg-title map-svg-desc">
              <title id="map-svg-title">AI 编程套餐价格、Agent 能力估计与可用量参考图</title>
              <desc id="map-svg-desc">横轴为统一币种后的月价对数刻度；纵轴只显示当前筛选结果中有产品的 Agent 能力档位；Logo 外五段光环表示五档可用量。</desc>
              <defs><pattern id="map-grid" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#c8c3b8" /></pattern></defs>
              <rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} fill="url(#map-grid)" />
              {yTicks.map((tick) => <g key={`y-${tick}`}><line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke="#d5d1c7" /><text x={margin.left - 12} y={y(tick) + 4} textAnchor="end" fontSize="10" fontWeight="700" fill="#6f6b63">{intelligenceLabels[tick]}</text></g>)}
              {xTicks.map((tick) => <g key={`x-${tick}`}><line x1={x(tick)} x2={x(tick)} y1={margin.top} y2={height - margin.bottom} stroke="#dedad1" /><text x={x(tick)} y={height - margin.bottom + 24} textAnchor="middle" fontSize="11" fill="#6f6b63">{currencySymbol[currency]}{tick}</text></g>)}
              <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="#121212" />
              <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="#121212" />
              {points.map((point) => {
                const trueX = x(point.price); const trueY = y(point.intelligenceLevel); const offset = pointOffsets.get(point.id) ?? { dx: 0, dy: 0 };
                const px = trueX + offset.dx; const py = trueY + offset.dy; const active = selected?.id === point.id;
                return <a key={point.id} href="#decision-map-detail" aria-label={`${point.productName} ${point.planName}，每月 ${money(point)}，Agent ${point.intelligenceLabel}，用量 ${point.usageLabel}`} onClick={(event) => { event.preventDefault(); setSelectedId(point.id); }} onMouseEnter={() => setHovered({ point, x: px, y: py })} onFocus={() => setHovered({ point, x: px, y: py })} onBlur={() => setHovered(null)}>
                  {(offset.dx !== 0 || offset.dy !== 0) && <line x1={trueX} y1={trueY} x2={px} y2={py} stroke="#aaa49a" strokeWidth="1" />}
                  <UsageHalo cx={px} cy={py} level={point.usageLevel} confidence={point.usageConfidence} active={active} marketColor={point.marketLabel === "中国" ? "#e4552d" : point.marketLabel === "国际" ? "#2b59ff" : "#161616"} />
                  <rect x={px - 12} y={py - 12} width="24" height="24" rx="6" fill="#fff" stroke={active ? "#2b59ff" : "#b9b4aa"} strokeWidth={active ? 2 : 1} className="cursor-pointer" />
                  {point.logo ? <image href={point.logo} x={px - 8} y={py - 8} width="16" height="16" preserveAspectRatio="xMidYMid meet" pointerEvents="none" /> : <text x={px} y={py + 4} textAnchor="middle" fontSize="9" fontWeight="900" fill={point.accent}>{point.shortName.slice(0, 1)}</text>}
                  <circle cx={px} cy={py} r="20" fill="transparent" className="cursor-pointer" />
                </a>;
              })}
              <text x={margin.left + plotWidth / 2} y={height - 15} textAnchor="middle" fontSize="11" fontWeight="800" fill="#121212">月价 · 对数刻度（越左越低）</text>
              <text transform={`translate(17 ${margin.top + plotHeight / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fontWeight="800" fill="#121212">Agent 能力估计（越上越强）</text>
            </svg>
            {hovered && <div className="pointer-events-none absolute z-10 w-64 -translate-x-1/2 border border-black bg-black p-3 text-white shadow-xl" style={{ left: Math.min(Math.max(hovered.x, 140), width - 140), top: Math.max(8, hovered.y - 126) }}><div className="flex items-center gap-2">{hovered.point.logo && <span className="grid h-7 w-7 place-items-center rounded bg-white"><Image src={hovered.point.logo} alt="" width={16} height={16} /></span>}<div><div className="text-xs font-black">{hovered.point.productName}</div><div className="mt-0.5 text-[9px] text-white/50">{hovered.point.marketLabel} · {hovered.point.planName}</div></div></div><div className="mt-3 grid grid-cols-3 gap-2 text-[10px]"><div><span className="text-white/45">月费</span><br /><strong>{money(hovered.point)}</strong></div><div><span className="text-white/45">智能</span><br /><strong>{hovered.point.intelligenceLabel}</strong></div><div><span className="text-white/45">用量</span><br /><strong>{hovered.point.usageLabel}</strong></div></div></div>}
          </> : <EmptyState />}
        </div>

        <div className="hidden border-t border-black md:grid lg:grid-cols-[1.2fr_.8fr]" id="decision-map-detail">
          <div className="p-5 md:p-6">
            {selected ? <><div className="flex flex-wrap items-center gap-2">{selected.logo && <span className="grid h-7 w-7 place-items-center rounded border hairline bg-white"><Image src={selected.logo} alt="" width={16} height={16} /></span>}<span className="eyebrow">当前选择 · {selected.marketLabel}{selectedProduct ? ` · ${modelAccessBadge(selectedProduct.modelAccess)}` : ""}</span></div><div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h3 className="text-2xl font-black tracking-[-.04em]">{selected.productName}</h3><p className="mt-1 text-xs text-[#6f6b63]">{selected.planName} · {money(selected)} / 月{selected.converted ? `（原价 ${originalMoney(selected)}）` : ""} · 核验 {selected.verifiedAt}</p></div><div className="flex gap-2"><Link href={`/compare?plans=${encodeURIComponent(selected.id)}&region=${region}`} className="border border-black px-3 py-2 text-xs font-black hover:bg-black hover:text-white">加入比较</Link><Link href={`/products/${selected.productSlug}`} className="flex items-center gap-1 !bg-black px-3 py-2 text-xs font-black !text-white visited:!text-white hover:!bg-black hover:!text-white" style={{ backgroundColor: "#000", color: "#fff" }}>查看详情 <ArrowRight size={13} /></Link></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="bg-white/55 p-3"><div className="text-[9px] font-black text-[#817c73]">官方额度摘要</div><div className="mt-1 text-xs font-bold">{selected.quota}</div></div><div className="bg-white/55 p-3"><div className="text-[9px] font-black text-[#817c73]">Agent 能力估计 · 排名 #{selected.agentRank} · {basisLabel[selected.intelligenceBasis]} · 置信度{confidenceLabel[selected.intelligenceConfidence]}</div><div className="mt-1 text-xs font-bold">{selected.intelligenceLabel} · {selected.intelligenceNote}</div></div><div className="bg-white/55 p-3"><div className="text-[9px] font-black text-[#817c73]">可用量档位 · {basisLabel[selected.usageBasis]} · 置信度{confidenceLabel[selected.usageConfidence]}</div><div className="mt-1 text-xs font-bold">{selected.usageLabel} · {selected.usageNote}</div></div></div></> : <p className="text-sm text-[#6f6b63]">选择图中的一个 Logo 查看详情。</p>}
          </div>
          <aside className="border-t border-black bg-black p-5 text-white lg:border-l lg:border-t-0 md:p-6">
            <div className="flex items-center gap-2 text-xs font-black"><Info size={16} className="text-[var(--acid)]" /> 图怎么看？</div>
            <p className="mt-3 text-xs leading-5 text-white/65">越左月费越低，越上 Agent 能力估计越强；Logo 外亮起的光环段数越多，套餐可用量档位越高。三项分别阅读，不合并成本站自创总分。</p>
            {!compact && <div className="mt-5 flex items-center gap-2 text-[10px] text-white/50"><Sparkles size={13} /> <Link href="/methodology" className="underline underline-offset-2">查看估计口径与局限</Link></div>}
          </aside>
        </div>
      </div>
    </section>
  );
}

function MobileDecisionChart({ points, currency }: { points: DecisionPoint[]; currency: string }) {
  const plansByProduct = new Map<string, DecisionPoint[]>();
  for (const point of points) {
    plansByProduct.set(point.productSlug, [...(plansByProduct.get(point.productSlug) ?? []), point]);
  }
  const rows = [...plansByProduct.values()]
    .map((plans) => plans.sort((a, b) => a.price - b.price))
    .sort((a, b) => a[0].agentRank - b[0].agentRank);
  if (!rows.length) return <EmptyState />;

  const tiers = rows.reduce<Array<{ level: number; start: number; end: number }>>((groups, plans, index) => {
    const level = plans[0].intelligenceLevel;
    const last = groups.at(-1);
    if (last?.level === level) last.end = index;
    else groups.push({ level, start: index, end: index });
    return groups;
  }, []);
  const rowHeight = 34;
  const groupHeaderHeight = 22;
  const groupGap = 7;
  const chart = { width: 360, height: Math.max(520, rows.length * rowHeight + tiers.length * (groupHeaderHeight + groupGap) + 58), left: 112, right: 18, top: 10, bottom: 36 };
  const plotWidth = chart.width - chart.left - chart.right;
  const maxPrice = Math.max(10, ...points.map((point) => point.price));
  const x = (price: number) => chart.left + (Math.log1p(price) / Math.log1p(maxPrice)) * plotWidth;
  const xTicks = (currency === "CNY" ? [10, 50, 100, 300, 1000] : [5, 10, 20, 50, 100, 300]).filter((tick) => tick <= maxPrice);
  const marketColor = (market: string) => market === "中国" ? "#e4552d" : market === "国际" ? "#2b59ff" : "#161616";
  const tierAccent: Record<number, string> = { 5: "#91a400", 4: "#2b59ff", 3: "#77736b", 2: "#aaa49a", 1: "#c6c1b7" };
  const tierLayouts = tiers.map((tier, tierIndex) => {
    const headerTop = chart.top + tier.start * rowHeight + tierIndex * (groupHeaderHeight + groupGap);
    const bottom = headerTop + groupHeaderHeight + (tier.end - tier.start + 1) * rowHeight;
    return { ...tier, headerTop, bottom };
  });
  const rowY = (index: number) => {
    const tierIndex = tiers.findIndex((tier) => index >= tier.start && index <= tier.end);
    return chart.top + index * rowHeight + tierIndex * (groupHeaderHeight + groupGap) + groupHeaderHeight + rowHeight / 2;
  };

  const shortPrice = (point: DecisionPoint) => `${point.converted ? "≈" : ""}${currencySymbol[point.currency] ?? point.currency}${point.price}`;

  return <div className="px-1.5 py-2.5" role="img" aria-label="Coding Agent 能力分层与月费图">
    <div className="grid grid-cols-[106px_1fr] px-2 pb-2 text-[8px] font-black tracking-[.04em] text-[#817c73]"><span>产品</span><span className="text-center">套餐月费 →</span></div>
    <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="block h-auto w-full" aria-label="Agent 能力分层与价格泳道图">
      {tierLayouts.map((tier) => <g key={`tier-${tier.level}`}>
        <rect x={7} y={tier.headerTop + 3} width="38" height="14" rx="7" fill={tierAccent[tier.level]} opacity=".11" />
        <text x={26} y={tier.headerTop + 12.5} textAnchor="middle" fontSize="7" fontWeight="850" fill={tierAccent[tier.level]}>{intelligenceLabels[tier.level]}</text>
        <text x={51} y={tier.headerTop + 12.5} fontSize="6.5" fontWeight="650" fill="#9a958c">{tier.end - tier.start + 1} 个产品</text>
        <line x1={chart.left} x2={chart.width - chart.right} y1={tier.headerTop + 10} y2={tier.headerTop + 10} stroke={tierAccent[tier.level]} strokeWidth=".7" opacity=".22" />
      </g>)}
      {xTicks.map((tick) => <g key={`rank-x-${tick}`}><line x1={x(tick)} x2={x(tick)} y1={chart.top + groupHeaderHeight} y2={chart.height - chart.bottom} stroke="#d7d2c8" strokeDasharray="1 4" /><text x={x(tick)} y={chart.height - 14} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#9a958c">{currencySymbol[currency]}{tick}</text></g>)}
      {rows.map((plans, index) => {
        const point = plans[0]; const py = rowY(index);
        const startX = x(plans[0].price); const endX = x(plans.at(-1)?.price ?? plans[0].price);
        return <g key={point.productSlug}>
          <rect x={5} y={py - rowHeight / 2 + 1} width={chart.width - 10} height={rowHeight - 2} rx="4" fill={index % 2 ? "rgba(255,255,255,.34)" : "rgba(255,255,255,.62)"} />
          {point.logo ? <image href={point.logo} x={10} y={py - 8} width="16" height="16" preserveAspectRatio="xMidYMid meet" /> : null}
          <text x={32} y={py - 1} fontSize="6.8" fontWeight="750" fill="#9a958c">{String(point.agentRank).padStart(2, "0")}</text>
          <text x={47} y={py - 1} fontSize="8" fontWeight="800" fill="#2f2c28">{point.shortName}</text>
          <text x={47} y={py + 9} fontSize="6.4" fontWeight="650" fill="#9a958c">{plans.length} 个套餐</text>
          {plans.length > 1 && <line x1={startX} x2={endX} y1={py} y2={py} stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round" opacity=".45" />}
          {plans.map((plan, planIndex) => {
            const px = x(plan.price); const haloRadius = 8.5;
            return <a key={plan.id} href={`/products/${plan.productSlug}`} aria-label={`${plan.shortName} ${plan.planName}，${money(plan)} 每月，Agent ${plan.intelligenceLabel}，用量 ${plan.usageLabel}`}>
              <UsageHalo cx={px} cy={py} level={plan.usageLevel} confidence={plan.usageConfidence} radius={haloRadius} strokeWidth={1.35} marketColor={marketColor(plan.marketLabel)} />
              <circle cx={px} cy={py} r="5.4" fill="white" stroke="#b9b4aa" strokeWidth=".7" />
              {(planIndex === 0 || planIndex === plans.length - 1) && <text x={px} y={py + haloRadius + 7} textAnchor="middle" fontSize="6.2" fontWeight="750" fill="#6f6b63" stroke="var(--paper)" strokeWidth="2.5" paintOrder="stroke">{shortPrice(plan)}</text>}
            </a>;
          })}
        </g>;
      })}
      <line x1={chart.left} x2={chart.width - chart.right} y1={chart.height - chart.bottom} y2={chart.height - chart.bottom} stroke="#8e8980" strokeWidth=".8" />
      <text x={chart.left + plotWidth / 2} y={chart.height - 1} textAnchor="middle" fontSize="7" fontWeight="750" fill="#817c73">对数刻度</text>
    </svg>
    <div className="mx-2 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 border-t hairline pt-2 text-[8px] font-bold text-[#817c73]"><span><i className="mr-1 inline-block h-[2px] w-5 align-middle bg-[var(--blue)] opacity-50" />价格范围</span><span className="inline-flex items-center gap-1"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><UsageHalo cx={9} cy={9} level={4} confidence="high" radius={7} strokeWidth={1.2} /></svg>亮起段数＝用量</span><span className="ml-auto"><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#e4552d]" />中　<i className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--blue)]" />国际　<i className="mr-1 inline-block h-2 w-2 rounded-full bg-black" />全球</span></div>
  </div>;
}

function EmptyState() {
  return <div className="grid min-h-[320px] place-items-center p-8 text-center"><div><Info className="mx-auto" /><p className="mt-4 text-sm font-black">这个筛选组合没有可绘制的明码套餐</p><p className="mt-2 max-w-md text-xs leading-5 text-[#6f6b63]">自定义报价、纯按量 API 和缺少可追溯估计的数据不会进入坐标。请切换市场、币种或套餐对象。</p></div></div>;
}

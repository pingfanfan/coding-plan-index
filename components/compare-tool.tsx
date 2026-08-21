"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Copy, Plus, X } from "lucide-react";
import type { Plan, Product } from "@/lib/schema";
import { allPlanId, formatApproximatePrice, formatMonthlyPrice, formatPrice } from "@/lib/format";
import { hasCompatibleQuotaUnit, parsePlanIds } from "@/lib/compare";

type Selection = { id: string; product: Product; plan: Plan };

export function CompareTool({ products }: { products: Product[] }) {
  const search = useSearchParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const requested = parsePlanIds(search.get("plans"));
  const options = useMemo(() => products.flatMap((product) => product.plans.filter(p => p.status !== "legacy").map((plan) => ({ id: allPlanId(product.slug, plan.id), product, plan }))), [products]);
  const selected = requested.map((id) => options.find((option) => option.id === id)).filter(Boolean) as Selection[];

  function setIds(ids: string[]) {
    const params = new URLSearchParams(search.toString());
    if (ids.length) params.set("plans", ids.slice(0, 4).join(",")); else params.delete("plans");
    router.replace(`/compare?${params.toString()}`, { scroll: false });
  }
  function add(id: string) { if (!requested.includes(id) && requested.length < 4) setIds([...requested, id]); }
  function remove(id: string) { setIds(requested.filter((item) => item !== id)); }
  async function copyLink() { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1600); }

  const compatible = hasCompatibleQuotaUnit(selected.map(({ plan }) => plan));
  const rows = [
    ["价格", (s: Selection) => [formatMonthlyPrice(s.plan), formatApproximatePrice(s.plan)].filter(Boolean).join("\n")],
    ["计费说明", (s: Selection) => s.plan.price.billingNote],
    ["地区", (s: Selection) => s.plan.regions.join(" / ")],
    ["额度窗口", (s: Selection) => s.plan.quotas.map(q => `${q.label}: ${q.amount ?? "官网未披露"} ${q.unit} / ${q.window}\n${q.refresh}`).join("\n\n")],
    ["消耗规则", (s: Selection) => s.plan.consumption.map(r => `${r.label}: ${r.rule}`).join("\n") || "官网未披露"],
    ["耗尽之后", (s: Selection) => s.plan.overage.detail],
    ["使用界面", (s: Selection) => s.product.surfaces.join(" / ")],
    ["BYOK", (s: Selection) => s.product.byok ? "支持" : "不支持"],
    ["治理", (s: Selection) => s.plan.governance.join(" / ") || "—"],
    ["人工核验", (s: Selection) => s.product.verifiedAt],
  ] as const;

  return (
    <div className="shell py-12 md:py-16">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div><div className="eyebrow">COMPARE / MAX 04</div><h1 className="mt-2 text-5xl font-black tracking-[-.06em] md:text-7xl">套餐比较器</h1><p className="mt-4 text-sm text-[#6f6b63]">选择、地区与计费周期写入 URL，可直接分享。</p></div>
        <button onClick={copyLink} className="flex h-11 items-center justify-center gap-2 border border-black px-4 text-xs font-black hover:bg-black hover:text-white"><Copy size={14} /> {copied ? "链接已复制" : "复制当前比较"}</button>
      </div>

      <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => {
          const item = selected[index];
          return item ? <div key={item.id} className="relative min-h-36 border border-black bg-white/55 p-4"><button onClick={() => remove(item.id)} className="absolute right-3 top-3 grid h-7 w-7 place-items-center border hairline" aria-label="移除"><X size={13} /></button><div className="eyebrow">{item.product.family}</div><div className="mt-2 pr-7 text-lg font-black">{item.product.name}</div><div className="mt-1 text-sm">{item.plan.name}</div><div className="mt-5 text-xl font-black">{formatPrice(item.plan)}</div></div> : <label key={index} className="grid min-h-36 cursor-pointer place-items-center border border-dashed border-[#aaa49a] bg-white/20 text-center"><div><Plus className="mx-auto" size={18} /><span className="mt-2 block text-xs font-bold">添加第 {index + 1} 项</span><select defaultValue="" onChange={(e) => { add(e.target.value); e.currentTarget.value = ""; }} className="mt-3 max-w-[220px] bg-transparent text-[11px] outline-none" aria-label={`添加第 ${index + 1} 项`}><option value="" disabled>选择产品 / 套餐</option>{options.filter(o => !requested.includes(o.id)).map(o => <option key={o.id} value={o.id}>{o.product.name} — {o.plan.name}</option>)}</select></div></label>;
        })}
      </div>

      {selected.length > 0 && <div className={`mt-6 border p-4 text-xs leading-5 ${compatible ? "border-[#8bb94c] bg-[#eff8df]" : "border-[#e3b642] bg-[#fff5d6]"}`}><strong>{compatible ? "存在同单位字段：" : "不可直接换算："}</strong>{compatible ? "仅对完全相同单位、相同窗口的官网明确数值计算才有意义。" : "所选套餐使用不同的自定义 credit / request / token / 动态额度，不显示伪精确的单位成本。"}</div>}

      {selected.length > 0 ? <div className="scrollbar-none mt-8 overflow-x-auto border-t border-black"><div className="min-w-[760px]">{rows.map(([label, render]) => <div key={label} className="grid border-b hairline" style={{ gridTemplateColumns: `150px repeat(${selected.length}, minmax(0, 1fr))` }}><div className="bg-black p-4 text-xs font-black text-white">{label}</div>{selected.map((item) => <div key={item.id} className="whitespace-pre-line border-l hairline p-4 text-xs leading-5 text-[#514d47]">{render(item)}</div>)}</div>)}</div></div> : <div className="mt-10 grid min-h-64 place-items-center border hairline"><div className="text-center"><div className="mx-auto grid h-10 w-10 place-items-center bg-black text-white"><Check size={17} /></div><p className="mt-4 text-sm font-black">先添加 2–4 个套餐</p><p className="mt-2 text-xs text-[#817c73]">也可以从产品卡或详情页直接加入。</p><Link href="/#catalog" className="mt-5 inline-block border border-black px-4 py-2 text-xs font-black">浏览产品</Link></div></div>}
    </div>
  );
}

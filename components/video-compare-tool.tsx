"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import type { VideoPlan, VideoProduct } from "@/lib/schema";

type Item = { key: string; product: VideoProduct; plan: VideoPlan };
function money(plan: VideoPlan) { return plan.price.monthly === null ? "官网未披露" : plan.price.monthly === 0 ? "免费" : `${plan.price.currency === "USD" ? "$" : `${plan.price.currency} `}${plan.price.monthly}/月`; }

export function VideoCompareTool({ products }: { products: VideoProduct[] }) {
  const router = useRouter(); const params = useSearchParams();
  const items = useMemo(() => products.flatMap((product) => product.plans.filter((plan) => plan.status === "current").map((plan) => ({ key: `${product.slug}::${plan.id}`, product, plan }))), [products]);
  const initial = (params.get("plans") ?? "").split(",").filter(Boolean).filter((id) => items.some((item) => item.key === id)).slice(0, 4);
  const [selected, setSelected] = useState(initial);
  const chosen = selected.map((id) => items.find((item) => item.key === id)).filter(Boolean) as Item[];
  function update(next: string[]) { setSelected(next); router.replace(`/video/compare?plans=${encodeURIComponent(next.join(","))}`, { scroll: false }); }
  function add(key: string) { if (key && !selected.includes(key) && selected.length < 4) update([...selected, key]); }
  return <div className="shell py-12 md:py-16">
    <div className="eyebrow">VIDEO PLAN COMPARE / MAX 4</div><h1 className="mt-3 text-5xl font-black tracking-[-.06em] md:text-8xl">把昂贵的细节，<br />摆在一张表里。</h1>
    <div className="mt-10 grid gap-3 sm:grid-cols-[1fr_auto]"><select defaultValue="" onChange={(event) => { add(event.target.value); event.target.value = ""; }} className="h-12 border border-black bg-white/60 px-4 text-xs font-black"><option value="">添加视频套餐（最多 4 个）</option>{items.filter((item) => !selected.includes(item.key)).map((item) => <option value={item.key} key={item.key}>{item.product.name} · {item.plan.name} · {money(item.plan)}</option>)}</select><Link href="/video" className="grid h-12 place-items-center border border-black px-5 text-xs font-black">返回目录</Link></div>
    {chosen.length ? <div className="mt-8 overflow-x-auto border hairline"><table className="w-full min-w-[900px] border-collapse text-left text-xs"><thead><tr className="bg-black text-white"><th className="w-40 p-4">比较维度</th>{chosen.map(({ key, product, plan }) => <th className="min-w-48 p-4" key={key}><div className="flex items-start justify-between gap-2"><span>{product.name}<small className="mt-1 block text-white/55">{plan.name}</small></span><button onClick={() => update(selected.filter((id) => id !== key))} aria-label="移除"><X size={14} /></button></div></th>)}</tr></thead><tbody>{[
      ["月价", (x: Item) => money(x.plan)],
      ["包含额度", (x: Item) => `${x.plan.credits.amount ?? "官网未披露"} ${x.plan.credits.unit}`],
      ["刷新窗口", (x: Item) => x.plan.credits.window],
      ["是否结转", (x: Item) => x.plan.credits.rollover],
      ["视频权益", (x: Item) => x.plan.videoAllowance],
      ["额度用尽", (x: Item) => x.plan.overage],
      ["最高分辨率", (x: Item) => x.product.maxResolution],
      ["原生音频", (x: Item) => x.product.nativeAudio === null ? "因模型而异" : x.product.nativeAudio ? "支持" : "未支持"],
      ["API", (x: Item) => x.product.apiAvailable ? "有" : "未提供"],
      ["失败任务", (x: Item) => x.product.failedRefund],
      ["模型", (x: Item) => x.product.models.join(" / ")],
      ["官方核验", (x: Item) => x.product.verifiedAt],
    ].map(([label, render]) => <tr className="border-t border-[#d5d1c7] align-top" key={String(label)}><th className="p-4 font-black">{String(label)}</th>{chosen.map((item) => <td className="max-w-xs p-4 leading-5" key={`${String(label)}-${item.key}`}>{(render as (x: Item) => string)(item)}</td>)}</tr>)}</tbody></table></div> : <div className="mt-8 grid min-h-72 place-items-center border border-black text-center"><div><div className="text-4xl font-black">00</div><p className="mt-3 text-sm font-black">先添加一个套餐</p><p className="mt-2 text-xs text-[#6f6b63]">比较只保留原生单位，不会跨平台换算 credits。</p></div></div>}
  </div>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getCatalog, getVideoProduct } from "@/lib/data";
import type { VideoPlan, VideoRate } from "@/lib/schema";

function formatPrice(plan: VideoPlan) {
  if (plan.price.monthly === null) return "官网未披露";
  if (plan.price.monthly === 0) return "免费";
  return `${plan.price.currency === "USD" ? "$" : `${plan.price.currency} `}${plan.price.monthly}/月`;
}
function formatRate(rate: VideoRate) {
  if (rate.amount === null) return "官网未披露";
  const unit = { credits_per_second: "credits / 秒", credits_per_clip: "credits / 次", usd_per_second: "USD / 秒", units_per_clip: "units / 次", undisclosed: "" }[rate.billingUnit];
  return `${rate.billingUnit === "usd_per_second" ? "$" : ""}${rate.amount} ${unit}`;
}

export function generateStaticParams() { return getCatalog().videoProducts.map((product) => ({ slug: product.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const product = getVideoProduct((await params).slug); return { title: product ? `${product.name} 视频价格` : "视频产品" }; }

export default async function VideoProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getVideoProduct((await params).slug); if (!product) notFound();
  const allSources = new Map(getCatalog().sources.map((source) => [source.id, source]));
  const sources = product.sourceIds.map((id) => allSources.get(id)).filter(Boolean);
  return <div className="shell py-10 md:py-14">
    <Link href="/video" className="inline-flex items-center gap-2 text-xs font-black"><ArrowLeft size={14} /> 返回视频目录</Link>
    <header className="mt-10 grid gap-8 border-b border-black pb-10 lg:grid-cols-[1fr_320px]">
      <div><div className="eyebrow">VIDEO / {product.kind.toUpperCase()} / {product.status.toUpperCase()}</div><h1 className="mt-3 text-5xl font-black tracking-[-.06em] md:text-8xl">{product.name}</h1><p className="mt-6 max-w-2xl text-sm leading-6 text-[#625e57]">{product.summary}</p></div>
      <div className="grid grid-cols-2 gap-px bg-[#d5d1c7] text-xs"><div className="bg-white/50 p-4"><span className="text-[#817c73]">最高分辨率</span><strong className="mt-2 block">{product.maxResolution}</strong></div><div className="bg-white/50 p-4"><span className="text-[#817c73]">原生音频</span><strong className="mt-2 block">{product.nativeAudio === null ? "因模型而异" : product.nativeAudio ? "支持" : "未支持"}</strong></div><div className="bg-white/50 p-4"><span className="text-[#817c73]">API</span><strong className="mt-2 block">{product.apiAvailable ? "有" : "未提供"}</strong></div><div className="bg-white/50 p-4"><span className="text-[#817c73]">最后核验</span><strong className="mt-2 block">{product.verifiedAt}</strong></div></div>
    </header>

    <section className="py-12"><div className="eyebrow">SUBSCRIPTION PLANS</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">当前套餐</h2>{product.plans.length ? <div className="mt-7 overflow-x-auto border hairline"><table className="w-full min-w-[980px] border-collapse text-left text-xs"><thead className="bg-black text-white"><tr>{["套餐", "月价", "包含额度", "刷新/结转", "视频权益", "用尽后", "状态"].map((x) => <th className="p-4" key={x}>{x}</th>)}</tr></thead><tbody>{product.plans.map((plan) => <tr className="border-t border-[#d5d1c7] align-top" key={plan.id}><td className="p-4 font-black">{plan.name}</td><td className="p-4 font-black">{formatPrice(plan)}<span className="mt-1 block text-[9px] font-normal text-[#817c73]">{plan.price.billingNote}</span></td><td className="p-4">{plan.credits.amount ?? "官网未披露"} {plan.credits.unit}</td><td className="p-4">{plan.credits.window}<span className="mt-1 block text-[9px] text-[#817c73]">{plan.credits.rollover}</span></td><td className="max-w-xs p-4 leading-5">{plan.videoAllowance}</td><td className="max-w-xs p-4 leading-5">{plan.overage}</td><td className="p-4">{plan.status}</td></tr>)}</tbody></table></div> : <div className="mt-6 border border-black p-6 text-sm">没有当前 App 套餐；此条目仅保留 API/停止服务参考。</div>}</section>

    <section className="border-t border-black py-12"><div className="eyebrow">NATIVE RATES</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">模型原生消耗</h2><p className="mt-3 max-w-2xl text-xs leading-5 text-[#6f6b63]">同名 credits 只在本产品计费体系内理解。固定片段与每秒价格不混为一列；音频和分辨率分别记录。</p><div className="mt-7 overflow-x-auto border hairline"><table className="w-full min-w-[900px] border-collapse text-left text-xs"><thead className="bg-black text-white"><tr>{["模型", "模式", "分辨率", "时长", "音频", "原生费率", "说明"].map((x) => <th className="p-4" key={x}>{x}</th>)}</tr></thead><tbody>{product.rates.map((rate) => <tr className="border-t border-[#d5d1c7] align-top" key={rate.id}><td className="p-4 font-black">{rate.model}</td><td className="p-4">{rate.mode}</td><td className="p-4">{rate.resolution}</td><td className="p-4">{rate.durationSeconds ? `${rate.durationSeconds} 秒` : "按秒/可变"}</td><td className="p-4">{rate.audio === null ? "因模型而异" : rate.audio ? "有" : "无"}</td><td className="p-4 font-black">{formatRate(rate)}</td><td className="max-w-sm p-4 leading-5 text-[#625e57]">{rate.note}</td></tr>)}</tbody></table></div></section>

    <section className="grid gap-8 border-t border-black py-12 lg:grid-cols-[300px_1fr]"><div><div className="eyebrow">EVALUATION</div><h2 className="mt-2 text-2xl font-black">怎么判断适不适合</h2></div><div className="grid gap-px bg-[#d5d1c7] sm:grid-cols-2"><div className="bg-[var(--paper)] p-5"><div className="text-[9px] font-black text-[#817c73]">能力范围</div><p className="mt-3 text-xs font-bold leading-5">{product.capabilities.join(" / ")}</p></div><div className="bg-[var(--paper)] p-5"><div className="text-[9px] font-black text-[#817c73]">失败任务</div><p className="mt-3 text-xs font-bold leading-5">{product.failedRefund}</p></div><div className="bg-[var(--paper)] p-5 sm:col-span-2"><div className="text-[9px] font-black text-[#817c73]">模型范围</div><p className="mt-3 text-xs font-bold leading-5">{product.models.join(" / ")}</p></div></div></section>

    <section className="border-t border-black py-12"><div className="eyebrow">OFFICIAL SOURCES</div><div className="mt-5 grid gap-px bg-[#d5d1c7] md:grid-cols-2">{sources.map((source) => source && <a href={source.url} target="_blank" rel="noreferrer" key={source.id} className="flex min-h-28 items-end justify-between gap-4 bg-[var(--paper)] p-5 hover:bg-black hover:text-white"><div><div className="text-[9px] font-black opacity-50">{source.kind.toUpperCase()} · {source.status}</div><div className="mt-2 text-sm font-black">{source.title}</div></div><ExternalLink size={15} /></a>)}</div></section>
  </div>;
}

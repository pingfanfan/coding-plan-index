import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Database } from "lucide-react";
import { getApiVendor, getCatalog } from "@/lib/data";

export function generateStaticParams() { return getCatalog().apiVendors.map(({ slug }) => ({ vendor: slug })); }
export async function generateMetadata({ params }: { params: Promise<{ vendor: string }> }): Promise<Metadata> {
  const api = getApiVendor((await params).vendor); return { title: api?.name ?? "API 价格" };
}

function cell(value: number | null | undefined, currency: string, label?: string) {
  if (value == null) return <span className="max-w-28 text-[#777269]">{label ?? "官网未披露"}</span>;
  return <span className="font-black">{currency === "USD" ? "$" : currency === "CNY" ? "¥" : currency} {value}</span>;
}

export default async function ApiPage({ params }: { params: Promise<{ vendor: string }> }) {
  const api = getApiVendor((await params).vendor);
  if (!api) notFound();
  const { apiVendors, sources } = getCatalog();
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  return (
    <div className="shell py-12 md:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#6f6b63]"><ArrowLeft size={14} /> 返回目录</Link>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end"><div><div className="eyebrow">API PRICE / TOKEN LAYER</div><h1 className="mt-3 text-5xl font-black tracking-[-.06em] md:text-7xl">{api.name}</h1><p className="mt-5 max-w-3xl text-sm leading-6 text-[#5f5b54]">{api.note}</p></div><div className="paper-card flex items-center justify-between p-4"><div><div className="eyebrow">VERIFIED</div><div className="mono mt-2 text-sm font-black">{api.verifiedAt}</div></div><Database size={24} /></div></div>

      <div className="mt-10 border-y border-black bg-white/35 px-4 py-3 text-[11px] leading-5 text-[#5f5b54]">
        “普通输入”也包括缓存未命中的输入；“缓存读取”对应命中后的 token 价；“缓存写入”只在厂商明确单独计价时显示数字。自动写入、按小时收存储费或随模型变化会直接写明，不再统称“官网未披露”。
      </div>
      <div className="scrollbar-none overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left"><thead><tr className="bg-black text-white">{["模型", "上下文 / 时段", "普通输入 / 未命中", "缓存读取 / 命中", "缓存写入 / 创建", "输出", "单位"].map(h => <th key={h} className="p-4 text-[10px] font-black tracking-wider">{h}</th>)}</tr></thead><tbody>{api.models.map((model) => <tr key={`${model.model}-${model.context ?? "default"}`} className="border-b hairline align-top hover:bg-white/50"><td className="p-4 text-sm font-black">{model.model}</td><td className="p-4 text-xs text-[#6f6b63]">{model.context ?? "—"}</td><td className="p-4 text-xs">{cell(model.input, model.currency, model.inputLabel)}</td><td className="p-4 text-xs">{cell(model.cachedInput, model.currency, model.cachedInputLabel)}</td><td className="p-4 text-xs">{cell(model.cacheWrite, model.currency, model.cacheWriteLabel)}</td><td className="p-4 text-xs">{cell(model.output, model.currency, model.outputLabel)}</td><td className="p-4 text-xs text-[#6f6b63]">{model.per}</td></tr>)}</tbody></table></div>
      <div className="mt-5 space-y-2">{api.models.filter(m => m.batchNote || m.longContextNote).map(m => <div key={m.model} className="border-l-2 border-black pl-3 text-[11px] leading-5 text-[#6f6b63]"><strong>{m.model}：</strong>{[m.longContextNote, m.batchNote].filter(Boolean).join("；")}</div>)}</div>

      <section className="mt-16 grid gap-8 border-t border-black pt-10 lg:grid-cols-[250px_1fr]"><div><div className="eyebrow">SWITCH VENDOR</div><h2 className="mt-2 text-xl font-black">其他 API</h2></div><div className="grid gap-px bg-[#d5d1c7] sm:grid-cols-2 lg:grid-cols-4">{apiVendors.map(v => <Link key={v.slug} href={`/apis/${v.slug}`} className={`flex items-center justify-between bg-[var(--paper)] p-3 text-xs font-bold hover:bg-white ${v.slug === api.slug ? "text-[var(--blue)]" : ""}`}>{v.name.replace(" API", "")}<span>→</span></Link>)}</div></section>
      <section className="mt-12 border-t hairline pt-8"><div className="eyebrow">OFFICIAL EVIDENCE</div><div className="mt-4 grid gap-2">{Array.from(new Set(api.models.flatMap(m => m.sourceIds))).map(id => { const s = sourceById.get(id); return s ? <a key={id} href={s.url} target="_blank" rel="noreferrer" className="flex items-center justify-between border-b hairline py-3 text-xs font-black hover:text-[var(--blue)]">{s.title}<ArrowUpRight size={14} /></a> : null; })}</div></section>
    </div>
  );
}

import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { ChangeNotice, SourceEvidence, Vendor } from "@/lib/schema";

export function ChangeHighlight({ changes, sources, vendors }: { changes: ChangeNotice[]; sources: SourceEvidence[]; vendors: Vendor[] }) {
  const sorted = [...changes]
    .filter((item) => item.featured)
    .sort((a, b) => {
      const published = b.publishedAt.localeCompare(a.publishedAt);
      if (published) return published;
      return (b.effectiveAt ?? "").localeCompare(a.effectiveAt ?? "");
    });
  const seenProducts = new Set<string>();
  const latest = sorted.filter((item) => {
    const key = item.productSlug ?? item.vendorId;
    if (seenProducts.has(key)) return false;
    seenProducts.add(key);
    return true;
  }).slice(0, 2);
  if (!latest.length) return null;

  const primary = latest[0];
  const secondary = latest[1];
  const vendorFor = (change: ChangeNotice) => vendors.find((item) => item.id === change.vendorId);
  const sourceFor = (change: ChangeNotice) => sources.find((item) => item.id === change.sourceIds[0]);
  const sourceLabel = (source?: SourceEvidence) => source?.url.includes("x.com") ? "查看 X 信号" : "官方来源";

  return <section className="border-b border-black">
    <div className="shell py-6 md:py-8">
      <div className="flex items-end justify-between gap-4">
        <div><div className="eyebrow">LATEST CHANGES</div><h2 className="mt-1 text-xl font-black tracking-[-.03em] md:text-2xl">最新消息</h2></div>
        <div className="mono text-[9px] font-bold text-[#777269]">01 主卡 · 02 副卡</div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_.85fr]">
        <article className="grid border border-black bg-white lg:grid-cols-[150px_1fr]">
          <div className="flex flex-col justify-between bg-[var(--blue)] p-5 !text-white">
            <div className="mono text-[10px] font-black tracking-[.15em]">LATEST · 01</div>
            <div className="mt-8"><div className="text-xs font-black">最新变动</div><div className="mt-1 mono text-[10px] text-white/65">核验 {primary.verifiedAt}</div></div>
          </div>
          <div className="flex min-w-0 flex-col p-5 md:p-6">
            <div className="text-xs font-black">{vendorFor(primary)?.name ?? primary.vendorId}</div>
            <h3 className="mt-3 text-2xl font-black tracking-[-.04em] md:text-3xl">{primary.title}</h3>
            <div className="mt-3 text-lg font-black text-[var(--blue)]">{primary.impact}</div>
            <p className="mt-3 max-w-3xl text-xs leading-5 text-[#625e57]">{primary.summary}</p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t hairline pt-4">
              <div className="flex items-center gap-2 text-[10px] font-black"><Clock3 size={13} />{primary.effectiveLabel}</div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/apis/${primary.vendorId}`} className="inline-flex h-8 items-center gap-2 border border-black px-3 text-[10px] font-black hover:bg-black hover:!text-white">API 价格 <ArrowUpRight size={13} /></Link>
                {sourceFor(primary) ? <a href={sourceFor(primary)?.url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-2 bg-black px-3 text-[10px] font-black !text-white visited:!text-white hover:bg-[var(--blue)]">{sourceLabel(sourceFor(primary))} <ArrowUpRight size={13} /></a> : null}
              </div>
            </div>
          </div>
        </article>

        {secondary ? <article className="flex min-w-0 flex-col border border-black bg-[#ebe9e2] p-5 md:p-6">
          <div className="flex items-center justify-between gap-3"><div className="mono text-[10px] font-black tracking-[.15em] text-[#777269]">NEXT · 02</div><div className="mono text-[10px] text-[#777269]">核验 {secondary.verifiedAt}</div></div>
          <div className="mt-8 text-xs font-black">{vendorFor(secondary)?.name ?? secondary.vendorId}</div>
          <h3 className="mt-2 text-xl font-black leading-tight tracking-[-.04em] md:text-2xl">{secondary.title}</h3>
          <div className="mt-3 text-sm font-black text-[var(--blue)]">{secondary.impact}</div>
          <p className="mt-3 text-xs leading-5 text-[#625e57]">{secondary.summary}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t hairline pt-4">
            <div className="flex items-center gap-2 text-[10px] font-black"><Clock3 size={13} />{secondary.effectiveLabel}</div>
            {sourceFor(secondary) ? <a href={sourceFor(secondary)?.url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-2 border border-black bg-black px-3 text-[10px] font-black !text-white visited:!text-white hover:bg-[var(--blue)]">{sourceLabel(sourceFor(secondary))} <ArrowUpRight size={13} /></a> : null}
          </div>
        </article> : null}
      </div>
    </div>
  </section>;
}

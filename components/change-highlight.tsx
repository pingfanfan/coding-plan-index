import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { ChangeNotice, SourceEvidence, Vendor } from "@/lib/schema";

export function ChangeHighlight({ changes, sources, vendors }: { changes: ChangeNotice[]; sources: SourceEvidence[]; vendors: Vendor[] }) {
  const change = [...changes].filter((item) => item.featured).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
  if (!change) return null;
  const vendor = vendors.find((item) => item.id === change.vendorId);
  const source = sources.find((item) => item.id === change.sourceIds[0]);

  return <section className="border-b border-black">
    <div className="shell py-6 md:py-8">
      <article className="grid border border-black bg-white lg:grid-cols-[170px_1fr_250px]">
        <div className="flex flex-col justify-between bg-[var(--blue)] p-5 !text-white">
          <div className="mono text-[10px] font-black tracking-[.15em]">LATEST CHANGE</div>
          <div className="mt-8"><div className="text-xs font-black">最新变动</div><div className="mt-1 mono text-[10px] text-white/65">核验 {change.verifiedAt}</div></div>
        </div>
        <div className="border-t border-black p-5 lg:border-l lg:border-t-0 lg:p-6">
          <div className="text-xs font-black">{vendor?.name ?? change.vendorId}</div>
          <h2 className="mt-3 text-2xl font-black tracking-[-.04em] md:text-3xl">{change.title}</h2>
          <div className="mt-3 text-lg font-black text-[var(--blue)]">{change.impact}</div>
          <p className="mt-3 max-w-3xl text-xs leading-5 text-[#625e57]">{change.summary}</p>
        </div>
        <div className="flex flex-col border-t border-black p-5 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 text-[10px] font-black"><Clock3 size={13} />生效：{change.effectiveLabel}</div>
          <div className="mt-auto grid gap-2 pt-6">
            <Link href={`/apis/${change.vendorId}`} className="inline-flex h-9 items-center justify-between border border-black px-3 text-[10px] font-black hover:bg-black hover:!text-white">查看 API 价格 <ArrowUpRight size={13} /></Link>
            {source ? <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-between bg-black px-3 text-[10px] font-black !text-white visited:!text-white hover:bg-[var(--blue)]">官方通知（需登录） <ArrowUpRight size={13} /></a> : null}
          </div>
        </div>
      </article>
    </div>
  </section>;
}

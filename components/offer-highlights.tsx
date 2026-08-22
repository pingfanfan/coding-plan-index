import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { offerPhase, sortOffers } from "@/lib/offers";
import type { Offer, SourceEvidence, Vendor } from "@/lib/schema";

export function OfferHighlights({ offers, sources, vendors }: { offers: Offer[]; sources: SourceEvidence[]; vendors: Vendor[] }) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const featured = sortOffers(offers).filter((offer) => offer.featured && offerPhase(offer) === "current").slice(0, 3);
  if (!featured.length) return null;

  return (
    <section className="border-b hairline">
      <div className="shell py-6 md:py-8">
        <div className="flex items-center justify-between gap-4">
          <div><div className="flex items-center gap-2 eyebrow"><span className="h-1.5 w-1.5 bg-[var(--blue)]" />NOW / VERIFIED</div><h2 className="mt-1 text-xl font-black tracking-[-.03em] md:text-2xl">活动与临时权益</h2></div>
          <div className="flex shrink-0 items-center gap-4 text-[11px] font-black">
            <Link href="/#subscribe" className="underline decoration-2 underline-offset-4">订阅提醒</Link>
            <Link href="/offers" className="underline decoration-2 underline-offset-4">查看全部</Link>
          </div>
        </div>
        <div className="mt-5 grid gap-px border hairline bg-[var(--line)] lg:grid-cols-3">
          {featured.map((offer) => {
            const source = sourceById.get(offer.sourceIds[0]);
            return <article key={offer.id} className="flex min-h-44 flex-col bg-white/55 p-4 last:border-b-0 lg:border-b-0">
              <div className="text-[10px] font-bold text-[#777269]">{vendorById.get(offer.vendorId)?.name ?? offer.vendorId} · {offer.endLabel}</div>
              <div className="mt-4 text-2xl font-black tracking-[-.04em]">{offer.benefit}</div>
              <h3 className="mt-2 text-xs font-black">{offer.title}</h3>
              <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                <p className="max-w-[80%] text-[10px] leading-4 text-[#625e57]">{offer.eligibility}</p>
                {source ? <a href={source.url} target="_blank" rel="noreferrer" aria-label={`${offer.title} 官方来源`} className="grid h-8 w-8 shrink-0 place-items-center border border-black bg-black !text-white visited:!text-white"><ArrowUpRight size={14} /></a> : null}
              </div>
            </article>;
          })}
        </div>
      </div>
    </section>
  );
}

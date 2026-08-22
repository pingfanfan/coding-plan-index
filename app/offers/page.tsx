import type { Metadata } from "next";
import { ArrowUpRight, CheckCircle2, CircleDashed, Clock3, Radio } from "lucide-react";
import { getCatalog } from "@/lib/data";
import { offerPhase, sortOffers } from "@/lib/offers";
import { PromoSubscribe } from "@/components/promo-subscribe";

export const metadata: Metadata = {
  title: "活动与临时权益",
  description: "AI 编程与 API 厂商当前赠送 Token、临时扩容、Reset 与限时折扣，附官方来源和到期时间。",
};

const scopeLabel = { coding: "AI 编程", api: "API", video: "AI 视频", multi: "多产品" } as const;
const authorityLabel = { official_account: "厂商官方账号", product_lead: "产品负责人", employee: "厂商员工" } as const;

export default function OffersPage() {
  const { offers, sources, vendors, socialWatchSources } = getCatalog();
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const ordered = sortOffers(offers);
  const current = ordered.filter((offer) => offerPhase(offer) === "current");
  const upcoming = ordered.filter((offer) => offerPhase(offer) === "upcoming");
  const ended = ordered.filter((offer) => offerPhase(offer) === "ended");

  const list = (items: typeof offers, muted = false) => <div className="border-t border-black">{items.map((offer, index) => {
    const vendor = vendorById.get(offer.vendorId);
    const official = sourceById.get(offer.sourceIds[0]);
    return <article key={offer.id} className={`grid gap-5 border-b hairline py-6 md:grid-cols-[54px_180px_1fr_210px] md:gap-7 ${muted ? "opacity-60" : ""}`}>
      <div className="mono text-[10px] text-[#6f6b63]">{String(index + 1).padStart(2, "0")}</div>
      <div>
        <div className="text-xs font-black">{vendor?.name ?? offer.vendorId}</div>
        <div className="mt-1 text-[10px] text-[#6f6b63]">{scopeLabel[offer.scope]} · 核验 {offer.verifiedAt}</div>
      </div>
      <div>
        <div className="text-2xl font-black tracking-[-.04em] md:text-3xl">{offer.benefit}</div>
        <h2 className="mt-2 text-sm font-black">{offer.title}</h2>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-[#625e57]">{offer.summary}</p>
        <dl className="mt-4 grid gap-2 text-[11px] leading-5 sm:grid-cols-2">
          <div><dt className="font-black">适用条件</dt><dd className="text-[#625e57]">{offer.eligibility}</dd></div>
          <div><dt className="font-black">如何获得</dt><dd className="text-[#625e57]">{offer.claimMethod}</dd></div>
        </dl>
        {offer.note ? <p className="mt-4 border-l-2 border-black pl-3 text-[10px] leading-5 text-[#625e57]">{offer.note}</p> : null}
      </div>
      <div className="flex flex-col items-start md:items-end">
        <div className="flex items-center gap-2 text-[11px] font-black"><Clock3 size={13} />{offer.endLabel}</div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-[#625e57]">{offer.verification === "verified" ? <CheckCircle2 size={13} className="text-[#168b4f]" /> : <CircleDashed size={13} className="text-[#a06d00]" />}{offer.verification === "verified" ? "官方规则已核验" : "资格以账户内为准"}</div>
        {official ? <a href={official.url} target="_blank" rel="noreferrer" className="mt-auto inline-flex h-9 items-center gap-2 border border-black bg-black px-3 text-[10px] font-black !text-white visited:!text-white hover:bg-[var(--blue)]">官方活动页 <ArrowUpRight size={13} /></a> : null}
      </div>
    </article>;
  })}</div>;

  return <div className="shell py-10 md:py-16">
    <header className="grid gap-7 border-b border-black pb-10 md:grid-cols-[1fr_360px] md:items-end">
      <div><div className="eyebrow">LIVE BENEFITS</div><h1 className="mt-3 text-5xl font-black tracking-[-.06em] md:text-7xl">活动与临时权益</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[#5f5b54]">只收录会直接改变可用量或实际成本的信息：赠送 Token、临时扩容、Reset 和限时资源包。它们不计入长期套餐权益。</p></div>
      <div className="border border-black bg-[var(--acid)] p-4"><div className="text-3xl font-black">{current.length}</div><div className="mt-1 text-xs font-black">项正在进行</div><p className="mt-3 text-[10px] leading-4 text-black/60">每日扫描官方页面；有结束时间的项目会在下一次每日构建时自动移入“最近结束”。</p></div>
    </header>

    <PromoSubscribe />

    <section className="pt-10"><div className="eyebrow">CURRENT</div><h2 className="mt-2 text-2xl font-black">正在进行</h2><div className="mt-6">{list(current)}</div></section>
    {upcoming.length ? <section className="pt-14"><div className="eyebrow">UPCOMING</div><h2 className="mt-2 text-2xl font-black">即将开始</h2><div className="mt-6">{list(upcoming)}</div></section> : null}
    {ended.length ? <details className="mt-14 border-y border-black py-5"><summary className="cursor-pointer text-sm font-black">最近结束（{ended.length}）</summary><div className="mt-5">{list(ended, true)}</div></details> : null}

    <aside className="mt-14 border border-black p-5 text-xs leading-6"><strong>关于“智谱新用户直接送 1 亿 Token”：</strong>当前智谱公开入口存在不同文案口径；可稳定核验的是特惠页的 1 亿 Token ¥189.9 限量包，以及邀请活动双方各 2000 万 Token。本站不把未经统一确认的“无条件赠送 1 亿”作为确定权益。</aside>

    <section className="mt-16 border-t border-black pt-8">
      <div className="grid gap-5 md:grid-cols-[1fr_360px] md:items-end">
        <div><div className="eyebrow">EARLY SIGNALS</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">比官网更早的消息源</h2></div>
        <p className="text-xs leading-5 text-[#625e57]">厂商官方账号和产品负责人经常先公布 Reset、临时扩容与赠送活动。社媒消息只用于快速发现，并按身份标级；正式价格仍以官网为准。</p>
      </div>
      <div className="mt-6 grid border border-black sm:grid-cols-2 lg:grid-cols-4">
        {socialWatchSources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="group flex min-h-40 flex-col border-b border-black p-4 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0">
          <div className="flex items-center justify-between gap-3"><Radio size={14} /><ArrowUpRight size={14} className="group-hover:text-[var(--blue)]" /></div>
          <div className="mt-5 text-sm font-black">{source.displayName}</div>
          <div className="mt-1 mono text-[10px] text-[#625e57]">{source.handle}</div>
          <div className="mt-auto pt-5 text-[10px] font-black">{authorityLabel[source.authority]}</div>
        </a>)}
      </div>
      <p className="mt-3 text-[10px] leading-5 text-[#625e57]">已建立每 4 小时的 X 官方 API 扫描流程；未配置 API 凭证时安全跳过，不使用网页抓取。发现新消息后进入人工核验队列，不自动改写套餐事实。</p>
    </section>
  </div>;
}

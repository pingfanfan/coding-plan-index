import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CheckCircle2, CircleDollarSign, Clock3, Info } from "lucide-react";
import { disclosureLabel, formatApproximatePrice, formatMonthlyPrice, formatPrice } from "@/lib/format";
import { getCatalog, getProduct } from "@/lib/data";
import { modelAccessLabels, modelBillingLabels, modelRoutingLabels, productRoleLabels } from "@/lib/model-access";

export function generateStaticParams() { return getCatalog().products.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return { title: product?.name ?? "产品", description: product?.summary };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const { vendors, sources } = getCatalog();
  const vendor = vendors.find((item) => item.id === product.vendorId);
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const productSources = product.sourceIds.map((id) => sourceById.get(id)).filter(Boolean);
  return (
    <>
      <section className="border-b hairline" style={{ borderTop: `7px solid ${product.accent}` }}>
        <div className="shell py-10 md:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#6f6b63]"><ArrowLeft size={14} /> 返回产品目录</Link>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div><div className="eyebrow">{vendor?.name} · {product.family}</div><h1 className="mt-3 text-[clamp(48px,7vw,96px)] font-black leading-[.9] tracking-[-.065em]">{product.name}</h1><p className="mt-7 max-w-3xl text-lg leading-8 text-[#5f5b54]">{product.summary}</p></div>
            <div className="paper-card p-5">
              <div className="flex items-center justify-between"><span className="eyebrow">DATA STATUS</span><span className="status-dot" /></div>
              <dl className="mt-8 grid gap-4 text-xs">
                <div className="flex justify-between border-b hairline pb-3"><dt className="text-[#6f6b63]">最后人工核验</dt><dd className="mono font-bold">{product.verifiedAt}</dd></div>
                <div className="flex justify-between border-b hairline pb-3"><dt className="text-[#6f6b63]">在售 / 记录</dt><dd className="font-bold">{product.plans.filter(p => p.status !== "legacy").length} / {product.plans.length}</dd></div>
                <div className="flex justify-between border-b hairline pb-3"><dt className="text-[#6f6b63]">产品角色</dt><dd className="font-bold">{productRoleLabels[product.modelAccess.role]}</dd></div>
                <div className="flex justify-between border-b hairline pb-3"><dt className="text-[#6f6b63]">模型接入</dt><dd className="font-bold">{modelAccessLabels[product.modelAccess.mode]}</dd></div>
                <div className="flex justify-between border-b hairline pb-3"><dt className="text-[#6f6b63]">BYOK</dt><dd className="font-bold">{product.byok ? "支持" : "不支持"}</dd></div>
                <div className="flex justify-between"><dt className="text-[#6f6b63]">使用界面</dt><dd className="max-w-[210px] text-right font-bold">{product.surfaces.join(" / ")}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {(product.slug === "openrouter" || product.slug === "opencode") ? <div className="shell pt-8"><Link href="/free-models" className="group flex flex-col justify-between gap-3 border border-black bg-[var(--acid)] p-4 sm:flex-row sm:items-center"><div><div className="eyebrow">LIVE DIRECTORY</div><strong className="mt-1 block text-lg">查看当前免费与隐身模型</strong><p className="mt-1 text-[10px] text-black/60">实时读取官方模型 API，并标出数据政策与使用方法。</p></div><span className="flex items-center gap-2 text-xs font-black">打开雷达 <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span></Link></div> : null}

      <section className="shell border-b border-black py-10 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8"><div><div className="eyebrow">EVIDENCE / 01</div><h2 className="mt-2 text-2xl font-black">官方来源</h2><p className="mt-3 text-xs leading-5 text-[#6f6b63]">价格与额度均需官方来源。自动扫描只负责发现变化，核验日期只在人工确认后更新。</p></div><div className="grid gap-px bg-[#d5d1c7]">{productSources.map((source) => source && <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-4 bg-[var(--paper)] p-4 hover:bg-white"><div><div className="text-xs font-black">{source.title}</div><div className="mt-1 text-[10px] text-[#6f6b63]">{source.supports.join(" · ")}</div></div><ArrowUpRight className="shrink-0 group-hover:text-[var(--blue)]" size={16} /></a>)}</div></div>
      </section>

      <section className="shell py-14">
        <div className="flex items-end justify-between"><div><div className="eyebrow">PLANS / 02</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">套餐与额度窗口</h2></div><span className="hidden text-xs text-[#6f6b63] md:block">横向滚动查看全部套餐 →</span></div>
        <div className="scrollbar-none mt-7 flex snap-x gap-3 overflow-x-auto pb-4">
          {product.plans.map((plan) => (
            <article key={plan.id} className={`w-[min(390px,88vw)] shrink-0 snap-start border p-5 ${plan.status === "legacy" ? "border-dashed border-[#aaa49a] opacity-70" : "border-black bg-white/55"}`}>
              <div className="flex items-start justify-between gap-3"><div><div className="eyebrow">{plan.audience} · {plan.regions.join(" / ")}</div><h3 className="mt-2 text-2xl font-black">{plan.name}</h3></div><span className={`px-2 py-1 text-[9px] font-black uppercase ${plan.status === "current" ? "bg-[var(--acid)]" : "bg-[#dedad1]"}`}>{plan.status}</span></div>
              <div className="mt-8 text-3xl font-black tracking-[-.04em]">{formatMonthlyPrice(plan)}</div>
              {formatApproximatePrice(plan) && <div className="mt-1 text-[10px] font-bold text-[#6f6b63]">{formatApproximatePrice(plan)}</div>}
              {plan.price.annualMonthly != null && <div className="mt-1 text-[11px] text-[#6f6b63]">年付折算 {formatPrice(plan, true)} / 月</div>}
              <p className="mt-3 min-h-10 text-[11px] leading-5 text-[#6f6b63]">{plan.price.billingNote} · {plan.price.tax}</p>
              <div className="mt-6 space-y-3">
                {plan.quotas.map((quota, i) => <div key={`${quota.label}-${i}`} className="border-t hairline pt-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-black">{quota.label}</span><span className="text-[9px] font-bold text-[#6f6b63]">{disclosureLabel(quota.disclosure)}</span></div><div className="mt-2 text-sm"><span className="font-black">{quota.amount ?? "官网未披露"}</span> <span className="text-xs text-[#6f6b63]">{quota.unit}</span></div><div className="mt-1 flex items-center gap-1 text-[10px] text-[#6f6b63]"><Clock3 size={11} /> {quota.window} · {quota.refresh}</div>{quota.shared && <div className="mt-1 text-[10px] text-[#6f6b63]">共享：{quota.shared}</div>}</div>)}
              </div>
              <div className="mt-6 border-t border-black pt-4"><div className="flex items-center gap-2 text-xs font-black"><CircleDollarSign size={14} /> 额度耗尽</div><p className="mt-2 text-[11px] leading-5 text-[#6f6b63]">{plan.overage.detail}</p></div>
              <Link href={`/compare?plans=${encodeURIComponent(`${product.slug}::${plan.id}`)}`} className="mt-5 block border border-black py-2.5 text-center text-xs font-black hover:bg-black hover:text-white">把这项加入比较</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y hairline bg-black py-14 text-white">
        <div className="shell grid gap-10 lg:grid-cols-2">
          <div><div className="eyebrow !text-white/45">CONSUMPTION / 03</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">消耗规则</h2><p className="mt-4 max-w-lg text-sm leading-6 text-white/55">同一个“请求”可能触发多次模型调用；同名 credit 也可能使用完全不同的成本模型。下面保留厂商自己的口径。</p></div>
          <div className="space-y-px bg-white/15">
            {product.plans.flatMap((plan) => plan.consumption.map((rule) => ({ ...rule, plan: plan.name }))).map((rule, i) => <div key={`${rule.plan}-${i}`} className="bg-black p-4"><div className="text-[10px] font-bold text-[var(--acid)]">{rule.plan} · {rule.label}</div><p className="mt-2 text-xs leading-5 text-white/70">{rule.rule}</p></div>)}
            {product.plans.every((plan) => plan.consumption.length === 0) && <div className="bg-black p-4 text-xs text-white/60">官网未披露更细的消耗倍率。</div>}
          </div>
        </div>
      </section>

      <section className="shell grid gap-12 py-14 lg:grid-cols-2">
        <div>
          <div className="eyebrow">CAPABILITY / 04</div><h2 className="mt-2 text-2xl font-black">模型与能力</h2>
          <div className="mt-6 grid gap-px bg-[#d5d1c7] sm:grid-cols-2">
            <div className="bg-[var(--paper)] p-3"><div className="text-[9px] font-black text-[#6f6b63]">模型方式</div><div className="mt-1 text-xs font-black">{modelAccessLabels[product.modelAccess.mode]}</div></div>
            <div className="bg-[var(--paper)] p-3"><div className="text-[9px] font-black text-[#6f6b63]">模型范围</div><div className="mt-1 text-xs font-black">{product.modelAccess.countLabel}</div></div>
            <div className="bg-[var(--paper)] p-3"><div className="text-[9px] font-black text-[#6f6b63]">选择与路由</div><div className="mt-1 text-xs font-black">{modelRoutingLabels[product.modelAccess.routing]}</div></div>
            <div className="bg-[var(--paper)] p-3"><div className="text-[9px] font-black text-[#6f6b63]">模型计费</div><div className="mt-1 text-xs font-black">{modelBillingLabels[product.modelAccess.billing]}</div></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#6f6b63]">{product.modelAccess.note}</p>
          <div className="mt-5 flex flex-wrap gap-2">{product.models.map((model) => <span key={model} className="border hairline bg-white/45 px-3 py-2 text-xs font-bold">{model}</span>)}</div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">{Array.from(new Set(product.plans.flatMap(p => p.features))).map((feature) => <div key={feature} className="flex gap-2 text-xs leading-5"><CheckCircle2 className="mt-0.5 shrink-0" size={14} />{feature}</div>)}</div>
        </div>
        <div><div className="eyebrow">GOVERNANCE / 05</div><h2 className="mt-2 text-2xl font-black">团队治理与数据</h2><div className="mt-6 space-y-2">{Array.from(new Set(product.plans.flatMap(p => p.governance))).map((item) => <div key={item} className="border-b hairline pb-2 text-xs font-bold">{item}</div>)}{product.plans.every(p => p.governance.length === 0) && <div className="flex gap-2 border hairline p-4 text-xs text-[#6f6b63]"><Info size={15} /> 官网套餐页未披露统一治理能力。</div>}</div></div>
      </section>
    </>
  );
}

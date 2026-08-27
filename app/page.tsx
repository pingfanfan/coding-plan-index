import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Database, Github, RefreshCw, ShieldCheck } from "lucide-react";
import { CatalogExplorer } from "@/components/catalog-explorer";
import { ChangeHighlight } from "@/components/change-highlight";
import { DecisionMap } from "@/components/decision-map";
import { OfferHighlights } from "@/components/offer-highlights";
import { PromoSubscribe } from "@/components/promo-subscribe";
import { getCatalog } from "@/lib/data";
import type { VideoPlan, VideoProduct } from "@/lib/schema";

function featuredVideoPlan(product: VideoProduct) {
  return product.plans
    .filter((plan) => plan.status === "current" && plan.price.monthly !== null && plan.price.monthly > 0)
    .sort((a, b) => (a.price.monthly ?? Infinity) - (b.price.monthly ?? Infinity))[0]
    ?? product.plans.find((plan) => plan.status === "current");
}

function videoPlanPrice(plan?: VideoPlan) {
  if (!plan || plan.price.monthly === null) return "官网未披露";
  if (plan.price.monthly === 0) return "免费";
  const prefix = plan.price.currency === "USD" ? "$" : `${plan.price.currency} `;
  return `${prefix}${plan.price.monthly}`;
}

export default function HomePage() {
  const { products, sources, vendors, apiVendors, videoProducts, decisionEstimates, offers, changes } = getCatalog();
  const planCount = products.reduce((sum, product) => sum + product.plans.filter((plan) => plan.status !== "legacy").length, 0);
  return (
    <>
      <section className="relative overflow-hidden border-b hairline dot-grid">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--paper)] via-[rgba(243,241,235,.86)] to-transparent" />
        <div className="shell relative py-4 md:py-10">
          <div className="hidden items-center justify-between text-[10px] font-bold text-[#777269] md:flex">
            <span>主流产品 · 第一阶段</span>
            <span className="mono">数据截至 2026.08.27</span>
          </div>
          <div className="grid gap-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(235px,.42fr)] md:items-end md:gap-10 md:py-10">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold text-[#625e57] md:mb-4"><span className="status-dot" /> 每 4 小时扫描官方来源</div>
              <h1 className="text-[34px] font-black leading-[.94] tracking-[-.06em] md:text-[clamp(44px,5.4vw,84px)]"><span className="block">AI 编程套餐，</span><span className="mt-[.08em] block text-[var(--blue)]">直接比较。</span></h1>
              <p className="mt-3 max-w-2xl text-xs leading-5 text-[#5f5b54] md:mt-5 md:text-base md:leading-6">{products.length} 家产品，{planCount} 个套餐。价格看官网，Agent 能力与用量看估计。</p>
            </div>
            <a href="https://github.com/pingfanfan/coding-plan-index" target="_blank" rel="noreferrer" className="group flex min-h-24 flex-col justify-between bg-black p-4 text-white transition hover:bg-[var(--blue)] md:min-h-36 md:p-5">
              <div className="flex items-center justify-between gap-3 text-[9px] font-black tracking-[.14em] text-white/60"><span className="flex items-center gap-2"><Github size={14} className="text-white" /> OPEN SOURCE</span><ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
              <div><div className="mt-5 text-base font-black tracking-[-.03em] md:text-lg">GitHub 开源项目</div><div className="mt-1 text-[10px] leading-4 text-white/60">数据 · 页面 · 自动更新</div></div>
            </a>
          </div>
          <div className="hidden items-center gap-6 border-y hairline py-4 text-[11px] text-[#6f6b63] md:flex">
            {[
              [String(products.length).padStart(2, "0"), "主流产品", "个人 / 团队 / API"],
              [String(planCount), "当前套餐", "历史方案单独隔离"],
              [String(apiVendors.length).padStart(2, "0"), "API 厂商", "token / cache / output"],
              [String(sources.length), "来源证据", "官方页 + 独立评测入口"],
            ].map(([value, label, note], index) => <div key={label} className="flex items-baseline gap-2" title={note}><strong className="text-base text-black">{value}</strong><span>{label}</span>{index < 3 ? <span className="ml-4 text-[#aaa49a]">·</span> : null}</div>)}
          </div>
        </div>
      </section>

      <div className="shell pb-4">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,.92fr)_minmax(300px,1.08fr)]">
          <PromoSubscribe compact />
          <Link href="/free-models" className="group flex min-h-[72px] items-center gap-3 border-l-2 border-l-[var(--blue)] bg-white/70 px-3 py-2.5 transition hover:bg-[#e9edf7]">
            <span className="grid h-9 w-9 shrink-0 place-items-center border hairline bg-[#eef1f7] text-[10px] font-black leading-none text-[var(--blue)] transition group-hover:border-[var(--blue)] group-hover:bg-[var(--blue)] group-hover:text-white">FREE</span>
            <div className="min-w-0 flex-1"><div className="text-[8px] font-black tracking-[.16em] text-[var(--blue)]">FREE RADAR · 免费模型</div><h2 className="mt-1 truncate text-sm font-black tracking-[-.03em]">官方额度与平台免费模型</h2></div>
            <ArrowUpRight size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      <ChangeHighlight changes={changes} sources={sources} vendors={vendors} apiVendors={apiVendors} />

      <OfferHighlights offers={offers} sources={sources} vendors={vendors} />

      <DecisionMap products={products} estimates={decisionEstimates} compact />

      <CatalogExplorer products={products} />

      <section className="border-y border-black bg-white/30 py-12 md:py-16">
        <div className="shell">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h2 className="text-4xl font-black tracking-[-.05em] md:text-6xl">AI 视频生成</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#625e57]">这是主站里的第二个完整比较板块。{videoProducts.length} 个平台单独比较订阅 credits、片段时长、分辨率、原生音频和 API 每秒价格，不与编程套餐混算。</p>
            </div>
            <Link href="/video" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start border border-black bg-black px-5 text-xs font-black !text-white visited:!text-white hover:bg-[var(--blue)] lg:self-auto">查看全部视频平台 <ArrowUpRight size={14} /></Link>
          </div>

          <div className="mt-8 grid gap-px border hairline bg-[#d5d1c7] sm:grid-cols-2 xl:grid-cols-4">
            {videoProducts.filter((product) => product.status === "current").slice(0, 4).map((product) => {
              const plan = featuredVideoPlan(product);
              return <Link key={product.slug} href={`/video/${product.slug}`} className="group flex min-h-56 flex-col border-t-[3px] bg-[var(--paper)] p-5 transition hover:bg-black hover:!text-white" style={{ borderTopColor: product.accent }}>
                <div className="flex items-start justify-between gap-3">
                  <div><div className="text-[10px] font-bold text-[#777269] group-hover:text-white/55">{product.vendor}</div><h3 className="mt-1 text-xl font-black tracking-[-.03em]">{product.name}</h3></div>
                  <ArrowUpRight className="mt-1 opacity-35 group-hover:opacity-100" size={15} />
                </div>
                <div className="mt-7 flex items-end justify-between gap-4">
                  <div><div className="text-[9px] font-bold text-[#777269] group-hover:text-white/55">公开月费</div><div className="mt-1 text-3xl font-black">{videoPlanPrice(plan)}</div></div>
                  <div className="max-w-[55%] text-right text-[10px] leading-4 text-[#625e57] group-hover:text-white/65">{plan?.name ?? "当前方案"}<br />{plan?.credits.amount ?? "额度未披露"} {plan?.credits.amount !== null ? plan?.credits.unit : ""}</div>
                </div>
                <p className="mt-auto border-t hairline pt-4 text-[10px] leading-4 text-[#625e57] group-hover:border-white/20 group-hover:text-white/65">{plan?.videoAllowance ?? product.summary}</p>
              </Link>;
            })}
          </div>
        </div>
      </section>

      <section className="shell mt-16 border-y border-black py-12">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div><h2 className="max-w-md text-4xl font-black leading-[1.02] tracking-[-.05em]">先告诉你哪里不能比，再帮你比。</h2></div>
          <div className="grid gap-px bg-[#d5d1c7] sm:grid-cols-3">
            {[
              [ShieldCheck, "单位不乱换", "自定义 credit 只在同一厂商、同一计费制度内计算单价。"],
              [Database, "套餐与 API 分层", "API Cost per Task 不替代订阅套餐的实际任务成本。"],
              [RefreshCw, "扫描 ≠ 核验", "每 4 小时检测官网变化；人工确认后才更新价格与核验日期。"],
            ].map(([Icon, title, text]) => { const I = Icon as typeof ShieldCheck; return <div key={String(title)} className="bg-[var(--paper)] p-5"><I size={22} /><h3 className="mt-8 text-sm font-black">{String(title)}</h3><p className="mt-2 text-xs leading-5 text-[#6f6b63]">{String(text)}</p></div>; })}
          </div>
        </div>
      </section>

      <section className="shell py-20">
        <div className="flex items-end justify-between"><h2 className="text-3xl font-black tracking-[-.04em]">API 价格单独看</h2><Link href="/methodology" className="hidden items-center gap-2 text-xs font-black sm:flex">为什么要分层 <ArrowUpRight size={14} /></Link></div>
        <div className="mt-8 grid gap-px border hairline bg-[#d5d1c7] sm:grid-cols-2 lg:grid-cols-4">
          {apiVendors.map((api) => <Link key={api.slug} href={`/apis/${api.slug}`} className="group flex min-h-40 flex-col justify-between bg-[var(--paper)] p-5 hover:bg-black hover:text-white"><span className="mono text-[10px] opacity-50">{api.models.length} MODELS</span><div><h3 className="text-lg font-black">{api.name}</h3><div className="mt-3 flex items-center gap-1 text-xs opacity-60 group-hover:opacity-100">查看价格表 <ArrowDownRight size={13} /></div></div></Link>)}
        </div>
      </section>
    </>
  );
}

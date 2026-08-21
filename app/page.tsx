import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Database, Film, Github, RefreshCw, ShieldCheck } from "lucide-react";
import { CatalogExplorer } from "@/components/catalog-explorer";
import { DecisionMap } from "@/components/decision-map";
import { getCatalog } from "@/lib/data";

export default function HomePage() {
  const { products, sources, apiVendors, videoProducts, decisionEstimates } = getCatalog();
  const planCount = products.reduce((sum, product) => sum + product.plans.filter((plan) => plan.status !== "legacy").length, 0);
  return (
    <>
      <section className="relative overflow-hidden border-b hairline dot-grid">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--paper)] via-[rgba(243,241,235,.86)] to-transparent" />
        <div className="shell relative py-4 md:py-10">
          <div className="hidden items-center justify-between md:flex">
            <div className="eyebrow">PHASE 01 · MAINSTREAM 20%</div>
            <div className="mono text-[10px] text-[#6f6b63]">DATA CUT 2026.08.20</div>
          </div>
          <div className="max-w-5xl py-4 md:py-12">
            <div className="mb-3 inline-flex items-center gap-2 border border-black bg-[var(--acid)] px-2 py-1 text-[9px] font-black md:mb-4 md:px-3 md:text-[10px]"><span className="status-dot" /> 每日扫描</div>
            <h1 className="text-[34px] font-black leading-[.94] tracking-[-.06em] md:text-[clamp(44px,7.2vw,104px)]"><span className="block">AI 编程套餐，</span><span className="mt-[.08em] block text-[var(--blue)]">直接比较。</span></h1>
            <p className="mt-3 max-w-2xl text-xs leading-5 text-[#5f5b54] md:mt-5 md:text-base md:leading-6">{products.length} 家产品，{planCount} 个套餐。价格看官网，Agent 能力与用量看估计。</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-6">
              <a href="https://github.com/pingfanfan/coding-plan-index" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 bg-black px-4 text-[11px] font-black text-white hover:bg-[var(--blue)]"><Github size={15} /> GitHub 开源项目 <ArrowUpRight size={13} /></a>
              <span className="text-[10px] font-bold text-[#817c73]">查看数据 · 提交纠错 · 补充产品</span>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-px border hairline bg-[#d5d1c7] md:grid lg:grid-cols-4">
            {[
              [String(products.length).padStart(2, "0"), "主流产品", "个人 / 团队 / API"],
              [String(planCount), "当前套餐", "历史方案单独隔离"],
              [String(apiVendors.length).padStart(2, "0"), "API 厂商", "token / cache / output"],
              [String(sources.length), "来源证据", "官方页 + 独立评测入口"],
            ].map(([value, label, note]) => <div key={label} className="bg-[var(--paper)] p-3 md:p-4"><div className="text-2xl font-black tracking-[-.05em]">{value}</div><div className="mt-1 text-[11px] font-black">{label}</div><div className="mt-1 hidden text-[10px] text-[#817c73] md:block">{note}</div></div>)}
          </div>
        </div>
      </section>

      <DecisionMap products={products} estimates={decisionEstimates} compact />

      <section className="border-y border-black bg-black py-12 text-white">
        <div className="shell flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div><div className="flex items-center gap-2 text-[10px] font-black text-[var(--acid)]"><Film size={14} /> NEW CATEGORY</div><h2 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-6xl">AI 视频生成，<br />单独算一本账。</h2><p className="mt-5 max-w-2xl text-sm leading-6 text-white/55">{videoProducts.length} 个主流平台与历史迁移条目。比较订阅 credits、片段时长、分辨率、原生音频和 API 每秒价格，不与 Coding Plan 混算。</p></div>
          <Link href="/video" className="flex h-12 items-center justify-center gap-2 bg-[var(--acid)] px-6 text-xs font-black text-black">进入 AI 视频比较 <ArrowUpRight size={15} /></Link>
        </div>
      </section>

      <CatalogExplorer products={products} />

      <section className="shell mt-16 border-y border-black py-12">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div><div className="eyebrow">THE RULES / 03</div><h2 className="mt-3 max-w-md text-4xl font-black leading-[1.02] tracking-[-.05em]">先告诉你哪里不能比，再帮你比。</h2></div>
          <div className="grid gap-px bg-[#d5d1c7] sm:grid-cols-3">
            {[
              [ShieldCheck, "单位不乱换", "自定义 credit 只在同一厂商、同一计费制度内计算单价。"],
              [Database, "套餐与 API 分层", "API Cost per Task 不替代订阅套餐的实际任务成本。"],
              [RefreshCw, "扫描 ≠ 核验", "每日检测官网变化；人工确认后才更新价格与核验日期。"],
            ].map(([Icon, title, text]) => { const I = Icon as typeof ShieldCheck; return <div key={String(title)} className="bg-[var(--paper)] p-5"><I size={22} /><h3 className="mt-8 text-sm font-black">{String(title)}</h3><p className="mt-2 text-xs leading-5 text-[#6f6b63]">{String(text)}</p></div>; })}
          </div>
        </div>
      </section>

      <section className="shell py-20">
        <div className="flex items-end justify-between"><div><div className="eyebrow">API LAYER / 04</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">API 价格单独看</h2></div><Link href="/methodology" className="hidden items-center gap-2 text-xs font-black sm:flex">为什么要分层 <ArrowUpRight size={14} /></Link></div>
        <div className="mt-8 grid gap-px border hairline bg-[#d5d1c7] sm:grid-cols-2 lg:grid-cols-4">
          {apiVendors.map((api) => <Link key={api.slug} href={`/apis/${api.slug}`} className="group flex min-h-40 flex-col justify-between bg-[var(--paper)] p-5 hover:bg-black hover:text-white"><span className="mono text-[10px] opacity-50">{api.models.length} MODELS</span><div><h3 className="text-lg font-black">{api.name}</h3><div className="mt-3 flex items-center gap-1 text-xs opacity-60 group-hover:opacity-100">查看价格表 <ArrowDownRight size={13} /></div></div></Link>)}
        </div>
      </section>
    </>
  );
}

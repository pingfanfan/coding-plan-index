import type { Metadata } from "next";
import { ArrowUpRight, Gauge, GitBranch, TriangleAlert } from "lucide-react";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = { title: "独立评测", description: "Artificial Analysis 与 llm2014/llm_benchmark 的方法、入口与局限。" };

export default function BenchmarksPage() {
  const { benchmarks } = getCatalog();
  return (
    <div className="shell py-12 md:py-16">
      <div className="eyebrow">INDEPENDENT BENCHMARKS</div><h1 className="mt-3 max-w-5xl text-5xl font-black leading-[.95] tracking-[-.06em] md:text-8xl">两套评测并列，<br />不合成新总分。</h1>
      <p className="mt-7 max-w-2xl text-base leading-7 text-[#5f5b54]">模型版本、推理档位和 Agent 脚手架只有全部一致，才标记为“对应评测”；否则只能称为“相关模型评测”。</p>
      <div className="mt-12 grid gap-px border hairline bg-[#d5d1c7] lg:grid-cols-2">
        {benchmarks.map((benchmark, index) => <article key={benchmark.id} className="bg-[var(--paper)] p-6 md:p-8"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center bg-black text-xs font-black text-white">0{index + 1}</span>{index === 0 ? <Gauge /> : <GitBranch />}</div><h2 className="mt-10 text-3xl font-black tracking-[-.04em]">{benchmark.name}</h2><p className="mt-4 text-sm leading-6 text-[#5f5b54]">{benchmark.scope}</p><div className="mt-8"><div className="eyebrow">LIMITATIONS</div><ul className="mt-3 space-y-3">{benchmark.limitations.map(item => <li key={item} className="flex gap-2 text-xs leading-5"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-black" />{item}</li>)}</ul></div><div className="mt-8 border border-[#dfb646] bg-[#fff5d6] p-4 text-xs leading-5"><strong>授权边界：</strong>{benchmark.redistribution}</div><div className="mt-6 flex flex-wrap gap-2"><a href={benchmark.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-black px-4 py-3 text-xs font-black text-white">打开评测 <ArrowUpRight size={14} /></a><a href={benchmark.methodologyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-black px-4 py-3 text-xs font-black">查看方法 <ArrowUpRight size={14} /></a></div></article>)}
      </div>
      <div className="mt-10 flex gap-3 border-t border-black pt-6 text-xs leading-5 text-[#6f6b63]"><TriangleAlert className="shrink-0" size={18} /><p><strong className="text-black">测试成本不是套餐任务成本。</strong> 第三方榜单里的 Cost per Task 是在特定模型、推理档位、Agent 与 API 价格下的评测支出，不代表 ChatGPT Plus、Claude Max、Grok 或 Kimi 会员里完成同一任务的真实扣费。</p></div>
    </div>
  );
}

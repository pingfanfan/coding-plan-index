import type { Metadata } from "next";
import { ArrowUpRight, KeyRound, Route, Terminal } from "lucide-react";
import { FreeModelRadar } from "@/components/free-model-radar";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = {
  title: "免费与隐身模型雷达",
  description: "按免费规则查看 OpenRouter、OpenCode、Gemini、Groq、ModelScope 等入口，并实时核对官方目录。",
};

export default function FreeModelsPage() {
  const { freePlatforms, freeModels } = getCatalog();
  return <div className="shell py-10 md:py-16">
    <header className="grid gap-7 border-b hairline pb-8 md:grid-cols-[minmax(0,1fr)_300px] md:items-end md:pb-10">
      <div>
        <div className="eyebrow">FREE / OFFICIAL</div>
        <h1 className="mt-3 text-[clamp(2.8rem,6vw,5rem)] font-black leading-[.9] tracking-[-.075em]">免费模型</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[#625e57]">先看能不能用，再看有多少模型。这里把官方免费额度、平台免费模型和有限期试用分开，完整规则按需展开。</p>
      </div>
      <div className="grid grid-cols-3 gap-3 border-t hairline pt-4 md:grid-cols-1 md:gap-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        <div><div className="text-2xl font-black tracking-[-.06em]">{freePlatforms.length}</div><div className="mt-1 text-[10px] text-[#6f6b63]">已收录平台</div></div>
        <div><div className="text-2xl font-black tracking-[-.06em]">3</div><div className="mt-1 text-[10px] text-[#6f6b63]">免费类型</div></div>
        <div><div className="text-2xl font-black tracking-[-.06em]">4h</div><div className="mt-1 text-[10px] text-[#6f6b63]">规则检查</div></div>
      </div>
    </header>

    <FreeModelRadar platforms={freePlatforms} spotlightModels={freeModels} />

    <section className="mt-12 border-t hairline pt-7">
      <div className="flex items-end justify-between gap-4"><div><div className="eyebrow">QUICK START</div><h2 className="mt-2 text-2xl font-black">怎么使用</h2></div><p className="hidden max-w-xs text-right text-[10px] leading-4 text-[#625e57] sm:block">只保留最短路径，完整限制请回到对应官网。</p></div>
      <div className="mt-5 grid gap-2 md:grid-cols-2">
        <details className="group border-b hairline bg-white/35 px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black"><span className="flex items-center gap-3"><Route size={16} />OpenRouter</span><span className="text-xl font-normal leading-none text-[#777269] transition group-open:rotate-45">+</span></summary>
          <div className="border-t hairline pt-3 text-xs leading-5 text-[#625e57]"><p>创建 API Key，把模型设为 <code className="bg-white px-1.5 py-0.5 text-black">openrouter/free</code>，或在官方目录选择带 <code className="bg-white px-1.5 py-0.5 text-black">:free</code> 后缀的模型。</p><a href="https://openrouter.ai/docs/cookbook/get-started/free-models-router-playground" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 font-black text-black underline decoration-1 underline-offset-4">官方教程 <ArrowUpRight size={13} /></a></div>
        </details>
        <details className="group border-b hairline bg-white/35 px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black"><span className="flex items-center gap-3"><Terminal size={16} />OpenCode Zen</span><span className="text-xl font-normal leading-none text-[#777269] transition group-open:rotate-45">+</span></summary>
          <div className="border-t hairline pt-3 text-xs leading-5 text-[#625e57]"><p>按官方流程取得 Key，在 OpenCode TUI 运行 <code className="bg-white px-1.5 py-0.5 text-black">/connect</code>，再用 <code className="bg-white px-1.5 py-0.5 text-black">/models</code> 选择当前可用模型。</p><a href="https://opencode.ai/docs/zen/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 font-black text-black underline decoration-1 underline-offset-4">官方教程 <ArrowUpRight size={13} /></a></div>
        </details>
      </div>
    </section>

    <section className="mt-12 flex gap-3 border-t hairline pt-6 text-xs leading-5 text-[#625e57]"><KeyRound className="mt-0.5 shrink-0" size={16} /><p>本站不代理模型请求、不收集 API Key，也不把免费状态当作长期承诺。页面读取失败时会显示最近人工核验快照，并明确标识。</p></section>
  </div>;
}

import type { Metadata } from "next";
import { ArrowUpRight, KeyRound, Route, Terminal } from "lucide-react";
import { FreeModelRadar } from "@/components/free-model-radar";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = {
  title: "免费与隐身模型雷达",
  description: "按免费规则查看 Google、Groq、ModelScope、SiliconFlow、OpenRouter、OpenCode 等模型平台，并实时核对官方目录。",
};

export default function FreeModelsPage() {
  const { freePlatforms } = getCatalog();
  return <div className="shell py-10 md:py-16">
    <header className="max-w-4xl">
      <div className="eyebrow">LIVE FREE MODEL RADAR</div>
      <h1 className="mt-3 text-5xl font-black leading-[.94] tracking-[-.06em] md:text-7xl">免费模型，<br />别再靠偶遇。</h1>
      <p className="mt-5 max-w-2xl text-sm leading-6 text-[#625e57]">这里把持续额度、模型零价、一次性赠送、免费试用和开发测试分开。公开模型目录直接读取官方接口，平台规则保留官方入口并持续检查。</p>
    </header>

    <FreeModelRadar platforms={freePlatforms} />

    <section className="mt-16 border-t border-black pt-8">
      <div className="eyebrow">QUICK START</div>
      <h2 className="mt-2 text-3xl font-black">怎么使用</h2>
      <div className="mt-7 grid gap-px bg-[#d5d1c7] md:grid-cols-2">
        <article className="bg-[var(--paper)] p-5">
          <Route size={20} />
          <h3 className="mt-6 text-xl font-black">OpenRouter</h3>
          <ol className="mt-4 space-y-3 text-xs leading-5 text-[#625e57]">
            <li><strong className="text-black">1.</strong> 登录 OpenRouter 并创建 API Key。</li>
            <li><strong className="text-black">2.</strong> 自动选择免费模型时，把模型 ID 设为 <code className="bg-white px-1.5 py-0.5 text-black">openrouter/free</code>。</li>
            <li><strong className="text-black">3.</strong> 指定模型时使用官方目录里的完整 ID，例如带 <code className="bg-white px-1.5 py-0.5 text-black">:free</code> 后缀的型号。</li>
            <li><strong className="text-black">4.</strong> API 地址使用 OpenAI 兼容端点；免费模型限速较低，不适合作为生产服务保证。</li>
          </ol>
          <a href="https://openrouter.ai/docs/cookbook/get-started/free-models-router-playground" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-black">官方教程 <ArrowUpRight size={13} /></a>
        </article>
        <article className="bg-[var(--paper)] p-5">
          <Terminal size={20} />
          <h3 className="mt-6 text-xl font-black">OpenCode Zen</h3>
          <ol className="mt-4 space-y-3 text-xs leading-5 text-[#625e57]">
            <li><strong className="text-black">1.</strong> 登录 OpenCode Zen，按官方流程取得 API Key。</li>
            <li><strong className="text-black">2.</strong> 在 OpenCode TUI 运行 <code className="bg-white px-1.5 py-0.5 text-black">/connect</code>，选择 OpenCode Zen 并粘贴 Key。</li>
            <li><strong className="text-black">3.</strong> 运行 <code className="bg-white px-1.5 py-0.5 text-black">/models</code>，选择当前免费或隐身模型。</li>
            <li><strong className="text-black">4.</strong> 配置文件中的模型 ID 使用 <code className="bg-white px-1.5 py-0.5 text-black">opencode/&lt;model-id&gt;</code>。</li>
          </ol>
          <a href="https://opencode.ai/docs/zen/" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-black">官方教程 <ArrowUpRight size={13} /></a>
        </article>
      </div>
    </section>

    <section className="mt-12 flex gap-3 border-t border-black pt-6 text-xs leading-5 text-[#625e57]"><KeyRound className="mt-0.5 shrink-0" size={16} /><p>本站不代理模型请求、不收集 API Key，也不把免费状态当作长期承诺。页面读取失败时会显示最近人工核验快照，并明确标识。</p></section>
  </div>;
}

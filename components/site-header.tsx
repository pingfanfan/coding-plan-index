import Link from "next/link";
import { CPLogo } from "@/components/cp-logo";

const nav = [
  ["AI 编程", "/"],
  ["活动", "/offers"],
  ["决策图", "/map"],
  ["比较器", "/compare"],
  ["API", "/apis/openai"],
  ["免费", "/free-models"],
  ["AI 视频", "/video"],
  ["评测", "/benchmarks"],
  ["方法", "/methodology"],
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b hairline bg-[rgba(243,241,235,.91)] backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Coding Plan Index 首页">
          <CPLogo className="h-8 w-8 shrink-0 text-black" />
          <span className="hidden text-sm font-black tracking-[-.02em] sm:block">CODING PLAN INDEX</span>
        </Link>
        <nav className="scrollbar-none flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto md:justify-center" aria-label="主导航">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="whitespace-nowrap px-3 py-2 text-xs font-bold text-[#5d5952] transition hover:bg-black hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden shrink-0 items-center gap-2 text-[11px] font-bold lg:flex">
          <span className="status-dot" /> 每 4 小时扫描
        </div>
      </div>
    </header>
  );
}

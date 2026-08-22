import Link from "next/link";
import { CPLogo } from "@/components/cp-logo";

const primaryNav = [
  ["AI 编程", "/"],
  ["AI 视频", "/video"],
  ["免费", "/free-models"],
];

const secondaryNav = [
  ["活动", "/offers"],
  ["比较器", "/compare"],
  ["决策图", "/map"],
  ["API", "/apis/openai"],
  ["评测", "/benchmarks"],
  ["方法", "/methodology"],
  ["来源", "/sources"],
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b hairline bg-[rgba(243,241,235,.91)] backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Coding Plan Index 首页">
          <CPLogo className="h-8 w-8 shrink-0 text-black" />
          <span className="hidden text-sm font-black tracking-[-.02em] sm:block">CODING PLAN INDEX</span>
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-center gap-1" aria-label="主导航">
          {primaryNav.map(([label, href]) => (
            <Link key={href} href={href} className="whitespace-nowrap px-2.5 py-2 text-xs font-black text-[#5d5952] transition hover:bg-black hover:text-white sm:px-3">
              {label}
            </Link>
          ))}
          <details className="group relative shrink-0">
            <summary className="flex cursor-pointer list-none items-center gap-1 whitespace-nowrap px-2.5 py-2 text-xs font-bold text-[#5d5952] transition hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)] sm:px-3 [&::-webkit-details-marker]:hidden">
              更多 <span aria-hidden="true" className="text-[10px] transition group-open:rotate-180">⌄</span>
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 grid min-w-36 border hairline bg-[var(--paper)] p-1 shadow-[4px_4px_0_rgba(18,18,18,.12)]">
              {secondaryNav.map(([label, href]) => (
                <Link key={href} href={href} className="whitespace-nowrap px-3 py-2.5 text-xs font-bold text-[#5d5952] transition hover:bg-black hover:text-white">
                  {label}
                </Link>
              ))}
            </div>
          </details>
        </nav>
        <div className="hidden shrink-0 items-center gap-2 text-[11px] font-bold lg:flex">
          <span className="status-dot" /> 每 4 小时扫描
        </div>
      </div>
    </header>
  );
}

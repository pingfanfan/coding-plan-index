import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-black bg-black py-10 text-white">
      <div className="shell flex flex-col justify-between gap-8 md:flex-row">
        <div>
          <div className="text-lg font-black">Coding Plan Index</div>
          <p className="mt-2 max-w-lg text-sm leading-6 text-white/60">价格和额度来自厂商官网。第三方评测只做方法摘要与外链，不创造综合总分。</p>
          <p className="mt-2 text-[10px] text-white/40">匿名访问统计由 Cloudflare Web Analytics 提供，不使用 Cookie。</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-white/70">
          <Link href="/offers">活动与临时权益</Link><Link href="/free-models">免费模型雷达</Link><Link href="/methodology">比较方法</Link><Link href="/sources">官方来源</Link><Link href="/benchmarks">独立评测</Link>
        </div>
      </div>
    </footer>
  );
}

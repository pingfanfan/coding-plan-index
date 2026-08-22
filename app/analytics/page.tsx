import type { Metadata } from "next";
import { AnalyticsSummary } from "@/components/analytics-summary";

export const metadata: Metadata = {
  title: "订阅数据 · CP",
  description: "CP 促销提醒订阅漏斗的聚合统计。",
};

export default function AnalyticsPage() {
  return <main className="shell py-10 md:py-16">
    <div className="max-w-2xl">
      <div className="eyebrow">ANALYTICS / AGGREGATED</div>
      <h1 className="mt-3 text-4xl font-black tracking-[-.055em] md:text-6xl">订阅数据。</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[#625e57]">只看漏斗，不看个人。这里展示促销提醒的聚合事件，帮助判断订阅入口是否有效。</p>
    </div>
    <div className="mt-8 max-w-4xl"><AnalyticsSummary /></div>
  </main>;
}

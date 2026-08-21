import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareTool } from "@/components/compare-tool";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = { title: "套餐比较器", description: "最多四项并排比较价格、额度窗口、超额规则和治理能力。" };
export default function ComparePage() {
  const { products } = getCatalog();
  return <Suspense fallback={<div className="shell grid min-h-[70vh] place-items-center text-sm text-[#6f6b63]">正在载入比较器…</div>}><CompareTool products={products} /></Suspense>;
}

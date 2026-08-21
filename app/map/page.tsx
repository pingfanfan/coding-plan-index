import type { Metadata } from "next";
import { DecisionMap } from "@/components/decision-map";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = { title: "套餐决策地图", description: "用价格、编码智能估计与可用量档位查看 AI 编程套餐；每项估计标注证据和置信度。" };

export default function MapPage() {
  const { products, decisionEstimates } = getCatalog();
  return <DecisionMap products={products} estimates={decisionEstimates} />;
}

import type { Metadata } from "next";
import { VideoExplorer } from "@/components/video-explorer";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = { title: "AI 视频生成价格比较", description: "比较 Runway、Veo、Firefly、Pika、Luma、Kling、Hailuo 等 AI 视频平台的套餐、credits、片段消耗与 API 每秒价格。" };

export default function VideoPage() {
  return <VideoExplorer products={getCatalog().videoProducts} />;
}

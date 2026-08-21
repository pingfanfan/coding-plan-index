import type { Metadata } from "next";
import { Suspense } from "react";
import { VideoCompareTool } from "@/components/video-compare-tool";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = { title: "AI 视频套餐比较器" };
export default function VideoComparePage() { return <Suspense><VideoCompareTool products={getCatalog().videoProducts} /></Suspense>; }

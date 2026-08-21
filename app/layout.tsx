import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: { default: "Coding Plan Index", template: "%s · Coding Plan Index" },
  description: "基于厂商官网的 AI 编程订阅、额度与 API 价格数据库。",
  metadataBase: new URL("https://cp.pingfan.me"),
  openGraph: { title: "Coding Plan Index", description: "AI 编程套餐，终于可以认真比较。", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

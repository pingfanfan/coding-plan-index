"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, MailCheck, Send, XCircle } from "lucide-react";

type EventName = "subscribe_started" | "confirmation_sent" | "confirmation_failed" | "confirmation_success";
type Totals = Record<EventName, number>;
type Snapshot = { version: 1; updatedAt: string; totals: Totals; days: Array<{ date: string; totals: Totals }> };

const labels: Record<EventName, string> = {
  subscribe_started: "开始订阅",
  confirmation_sent: "确认邮件已发送",
  confirmation_success: "完成确认",
  confirmation_failed: "发送失败",
};

const icons: Record<EventName, typeof Activity> = {
  subscribe_started: Send,
  confirmation_sent: MailCheck,
  confirmation_success: CheckCircle2,
  confirmation_failed: XCircle,
};

function percent(value: number, total: number) {
  if (!total) return "—";
  return `${Math.round((value / total) * 100)}%`;
}

export function AnalyticsSummary() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/analytics", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const value = await response.json() as Snapshot & { configured?: boolean; message?: string };
        if (!response.ok) throw new Error("统计暂时无法读取");
        if (value.configured === false) {
          setConfigured(false);
          return;
        }
        setSnapshot(value);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError("统计接口暂时不可用，请稍后刷新。");
      });
    return () => controller.abort();
  }, []);

  const recent = useMemo(() => {
    if (!snapshot) return [];
    return [...snapshot.days].slice(-14);
  }, [snapshot]);

  if (error) return <div className="paper-card flex items-center gap-2 p-4 text-sm text-[#b42318]"><AlertCircle size={16} /> {error}</div>;
  if (!configured) return <div className="paper-card p-5 text-sm leading-6 text-[#625e57]">聚合统计存储尚未连接。订阅事件不会保存邮箱或个人信息；连接 Cloudflare KV 后，这里会显示订阅漏斗数字。</div>;
  if (!snapshot) return <div className="paper-card p-5 text-sm text-[#625e57]">正在读取统计…</div>;

  const started = snapshot.totals.subscribe_started;
  return <div className="space-y-5">
    <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
      {(Object.keys(labels) as EventName[]).map((event) => {
        const Icon = icons[event];
        return <div key={event} className="bg-[var(--paper)] p-4"><div className="flex items-center justify-between text-[#625e57]"><span className="text-[10px] font-black">{labels[event]}</span><Icon size={14} /></div><div className="mt-2 text-2xl font-black tracking-[-.04em]">{snapshot.totals[event].toLocaleString("zh-CN")}</div>{event === "confirmation_success" && <div className="mt-1 text-[10px] text-[#625e57]">完成率 {percent(snapshot.totals[event], started)}</div>}</div>;
      })}
    </div>
    <div className="paper-card overflow-hidden">
      <div className="flex items-center justify-between border-b hairline px-4 py-3"><div className="flex items-center gap-2 text-xs font-black"><Activity size={14} /> 最近 14 天</div><span className="text-[10px] text-[#625e57]">更新于 {new Date(snapshot.updatedAt).toLocaleString("zh-CN")}</span></div>
      {recent.length ? <div className="divide-y divide-[var(--line)]">{recent.reverse().map((day) => <div key={day.date} className="grid grid-cols-[88px_repeat(4,minmax(0,1fr))] items-center gap-2 px-4 py-2.5 text-xs"><span className="font-bold text-[#625e57]">{day.date.slice(5)}</span><span>{day.totals.subscribe_started}</span><span>{day.totals.confirmation_sent}</span><span>{day.totals.confirmation_success}</span><span>{day.totals.confirmation_failed}</span></div>)}</div> : <div className="px-4 py-5 text-sm text-[#625e57]">还没有事件记录。</div>}
    </div>
    <p className="text-[10px] leading-5 text-[#625e57]">仅保存事件总数和日期，不保存邮箱、IP、设备、来源或可识别个人的信息。</p>
  </div>;
}

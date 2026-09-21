"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export function Spark({ data, color, height = 64 }: { data: number[]; color: string; height?: number }) {
  const path = useMemo(() => {
    if (!data.length) return "";
    const w = 280;
    const h = height;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    return data
      .map((v, i) => {
        const x = (i / Math.max(1, data.length - 1)) * w;
        const y = h - 6 - ((v - min) / span) * (h - 14);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [data, height]);
  if (!path) return <div className="flex items-center justify-center font-mono text-xs text-slate-500" style={{ height }}>awaiting feed…</div>;
  return (
    <svg viewBox={`0 0 280 ${height}`} className="w-full" style={{ height }}>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d={`${path} L280,${height} L0,${height} Z`} fill={color} opacity="0.12" stroke="none" />
    </svg>
  );
}

export function Gauge({ value, max, color, label, sub }: { value: number; max: number; color: string; label: string; sub: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs uppercase tracking-widest text-slate-400">{label}</div>
      <div className="font-display mt-1 text-3xl font-bold" style={{ color }}>
        {sub}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1 }}
        />
      </div>
      <div className="mt-2 font-mono text-[11px] text-slate-400">
        {value.toFixed(1)} / {max}
      </div>
    </div>
  );
}

export function FeedDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px]">
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: ok ? "#34d399" : "#facc15" }} />
      <span className="text-slate-300">{label}</span>
      <span className="text-slate-500">{ok ? "live" : "cache"}</span>
    </span>
  );
}

export function AlertsCard({ alerts }: { alerts: { message?: string; issue_datetime?: string }[] }) {
  if (!alerts.length)
    return (
      <div className="glass rounded-2xl p-5 text-sm text-slate-400">
        <span className="text-emerald-300">●</span> No active aurora/storm advisories in the latest model run. Quiet Sun — good nights for deep-sky imaging.
      </div>
    );
  return (
    <ul className="space-y-2">
      {alerts.map((a, i) => (
        <li key={i} className="flex gap-2 rounded-xl bg-amber-400/10 p-3 text-[13px] text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span><span className="font-mono text-[11px] text-amber-300">{a.issue_datetime ?? ""}</span> — {a.message?.slice(0, 260)}</span>
        </li>
      ))}
    </ul>
  );
}

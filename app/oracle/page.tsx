"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import OraclePanel from "@/components/OraclePanel";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";
import { useHelios } from "@/hooks/useHelios";

function OracleRoom() {
  const h = useHelios();
  const params = useSearchParams();
  const q = params.get("q");
  return (
    <div className="glass-strong rounded-3xl p-6 md:p-8">
      <OraclePanel kp={h.kp} wind={h.wind} bz={h.bz} lat={null} quakeCount={h.quakes.length} initialQ={q} />
      <p className="mt-4 text-xs text-slate-500">
        Powered by Gemini 3.5 Flash with a built-in physics engine fallback — it answers even with zero AI budget.
        For life-safety decisions always follow NOAA SWPC + local authorities.
      </p>
    </div>
  );
}

export default function OraclePage() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <SiteNav />
      <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-300">AI briefing room</div>
        <h1 className="font-display mt-1 text-4xl font-bold md:text-5xl">🤖 Oracle</h1>
        <p className="mt-2 text-slate-400">Plain-English space-weather intelligence, with live Kp, wind and Bz attached to every question.</p>
        <div className="mt-6">
          <Suspense fallback={<div className="glass rounded-3xl p-8 font-mono text-sm text-slate-400">waking oracle…</div>}>
            <OracleRoom />
          </Suspense>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

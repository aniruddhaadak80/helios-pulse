"use client";

import { Activity, Magnet, RefreshCw, Satellite, Wind } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";
import { AlertsCard, FeedDot, Gauge, Spark } from "@/components/LivePanels";
import { useHelios } from "@/hooks/useHelios";

export default function LivePage() {
  const h = useHelios();
  const sw = h.sw;

  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <SiteNav />
      <div className="mx-auto w-full max-w-7xl flex-1 px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-orange-300">Mission control</div>
            <h1 className="font-display mt-1 text-4xl font-bold md:text-5xl">🔴 Live room</h1>
            <p className="mt-2 text-slate-400">Every feed HELIOS watches, raw and timestamped. Refreshes every 2 minutes.</p>
          </div>
          <button onClick={h.refresh} className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm hover:bg-white/10">
            <RefreshCw className={`h-4 w-4 ${h.syncing ? "animate-spin" : ""}`} /> Sync · {h.updated}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <FeedDot ok={!sw?.kp?.degraded && h.live} label="NOAA Kp" />
          <FeedDot ok={!sw?.xray?.degraded && h.live} label="GOES X-ray" />
          <FeedDot ok={!sw?.solarWind?.degraded && h.live} label="Solar wind" />
          <FeedDot ok={!sw?.mag?.degraded && h.live} label="IMF Bz" />
          <FeedDot ok={h.live} label="OVATION aurora" />
          <FeedDot ok={h.quakes.length > 0} label="USGS quakes" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Gauge value={h.kp} max={9} color={h.storm.color} label="Planetary K-index" sub={`Kp ${h.kp.toFixed(1)} · ${h.storm.scale}`} />
          <Gauge value={h.wind} max={1000} color={h.wind > 600 ? "#f43f5e" : h.wind > 450 ? "#fb923c" : "#34d399"} label="Solar wind speed" sub={`${h.wind.toFixed(0)} km/s`} />
          <Gauge value={Math.abs(h.bz ?? 0)} max={30} color={(h.bz ?? 0) < -10 ? "#f43f5e" : (h.bz ?? 0) < -5 ? "#fb923c" : "#34d399"} label="IMF Bz (southward = stormy)" sub={`${(h.bz ?? 0).toFixed(1)} nT`} />
          <Gauge value={h.risk.score} max={100} color={h.risk.color} label="Grid stress index" sub={`${h.risk.level} ${h.risk.score}`} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="glass rounded-2xl p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-orange-300" /> Kp — last 2 hours</div>
            <Spark data={(sw?.kp?.series ?? []).map((p) => p.kp)} color={h.storm.color} />
            <p className="mt-2 font-mono text-[11px] text-slate-500">latest: {sw?.kp?.time ?? "—"}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Wind className="h-4 w-4 text-sky-300" /> Solar wind km/s</div>
            <Spark data={(sw?.solarWind?.series ?? []).map((p) => p.speed)} color="#38bdf8" />
            <p className="mt-2 font-mono text-[11px] text-slate-500">density now: {(sw?.solarWind?.density ?? h.quakes.length >= 0 ? sw?.solarWind?.density : null)?.toFixed?.(2) ?? "—"} p/cm³</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Magnet className="h-4 w-4 text-rose-300" /> Bz nT (southward dips)</div>
            <Spark data={(sw?.mag?.series ?? []).map((p) => p.bz)} color="#f43f5e" />
            <p className="mt-2 font-mono text-[11px] text-slate-500">Bt total: {sw?.mag?.bt != null ? Number(sw.mag.bt).toFixed(1) : "—"} nT</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-2xl p-5">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
              <Satellite className="h-4 w-4 text-amber-300" /> X-ray flux · current class{" "}
              <span className="font-display text-xl" style={{ color: h.xr.color }}>{h.xr.cls}</span>
            </div>
            <p className="text-sm text-slate-400">A &lt; B &lt; C &lt; M &lt; X — each letter is 10× stronger. M/X flares black out dayside HF radio within minutes.</p>
            <div className="mt-3"><Spark data={(sw?.xray?.series ?? []).map((p) => Math.log10(Math.max(1e-9, p.flux)))} color={h.xr.color} height={52} /></div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="mb-2 text-sm font-semibold">OVATION aurora model · peak probability {sw?.ovation?.maxProbability ?? "—"}% across {sw?.ovation?.cells ?? "—"} cells</div>
            <AlertsCard alerts={sw?.alerts ?? []} />
          </div>
        </div>

        <div className="glass mt-4 rounded-2xl p-5 text-sm text-slate-400">
          <b className="text-slate-200">How to read this room:</b> Kp 0–2 quiet · 3–4 active · 5+ storm (G1–G5).
          Wind over 600 km/s or Bz below −10 nT means a storm is loading. X-ray M/X means radio blackouts are happening <i>now</i> on the dayside.
          Machines: everything here is one <span className="font-mono text-orange-200">GET /api/space-weather</span> away.
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

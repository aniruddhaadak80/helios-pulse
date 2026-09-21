"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Flame,
  Magnet,
  Radio,
  Satellite,
  Shield,
  Sparkles,
  Wind,
  Zap,
} from "lucide-react";
import Globe, { GlobeFocus } from "./Globe";
import { SiteFooter, SiteNav } from "./SiteChrome";
import { AlertsCard, Gauge, Spark } from "./LivePanels";
import OraclePanel from "./OraclePanel";
import { useHelios } from "@/hooks/useHelios";

export default function Dashboard() {
  const h = useHelios();
  const sw = h.sw;
  const [lat, setLat] = useState("52.5");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<GlobeFocus | null>(null);
  const [nonce, setNonce] = useState(0);

  const latN = Number.parseFloat(lat);
  const selected = h.quakes.find((e) => e.id === selectedId) ?? null;

  const onGlobeSelect = (id: string | null) => {
    setSelectedId(id);
    const q = h.quakes.find((e) => e.id === id);
    if (q) {
      const n = nonce + 1;
      setNonce(n);
      setFocus({ lat: q.coords.lat, lon: q.coords.lon, nonce: n });
    }
  };

  const biggest = h.quakes.reduce((m, e) => Math.max(m, e.mag ?? 0), 0);

  return (
    <div className="relative z-10">
      {/* alert ticker */}
      <div className="overflow-hidden border-b border-white/10 bg-black/40 py-1.5 text-[12px]">
        <div className="animate-ticker flex w-max gap-10 whitespace-nowrap px-4 font-mono text-amber-200/90">
          {[0, 1].map((k) => (
            <span key={k}>
              ● LIVE SOLAR CYCLE 25 MAXIMUM — Kp {h.kp.toFixed(1)} ({h.storm.label}) · Wind {h.wind.toFixed(0)} km/s · Bz {(h.bz ?? 0).toFixed(1)} nT · X-ray {h.xr.cls}-class · {h.quakes.length} M4.5+ quakes/72h
              {(sw?.alerts?.[0]?.message) ? ` · NOAA: ${sw.alerts[0].message.slice(0, 90)}` : " · No active NOAA warnings"}
            </span>
          ))}
        </div>
      </div>

      <SiteNav />

      {/* hero */}
      <section className="grid-overlay relative">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-10 pt-14 lg:grid-cols-2 lg:items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 font-mono text-[11px] text-orange-200">
                <Sparkles className="h-3.5 w-3.5" /> SOLAR CYCLE 25 · PEAK NOW · 2024 → LATE 2026
              </div>
              <h1 className="font-display text-glow-solar mt-5 text-5xl font-bold leading-[1.02] md:text-7xl">
                Our star is<br />
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent">wide awake.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-300">
                HELIOS PULSE is the living dashboard for solar maximum — live <b>Kp</b>, solar wind, flares,
                aurora odds, earthquakes and grid risk, fused by an AI Oracle into plain English. Open data. Open API. Open source.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/live" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-orange-200">
                  ⚡ Enter the live room
                </Link>
                <Link href="/developers" className="glass rounded-full px-5 py-3 text-sm font-semibold hover:bg-white/10">
                  {"</>"} Use the free API + MCP
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 font-mono text-[11px] text-slate-400">
                <span className="glass rounded-full px-3 py-1">Kp {h.kp.toFixed(1)} · {h.storm.label}</span>
                <span className="glass rounded-full px-3 py-1">Wind {h.wind.toFixed(0)} km/s</span>
                <span className="glass rounded-full px-3 py-1">Bz {(h.bz ?? 0).toFixed(1)} nT</span>
                <span className="glass rounded-full px-3 py-1">X-ray {h.xr.cls}-class</span>
                <span className="glass rounded-full px-3 py-1">{h.live ? `Updated ${h.updated}` : "syncing…"}</span>
              </div>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
            <Globe kp={h.kp} quakes={h.quakes} selectedId={selectedId} focus={focus} onSelect={onGlobeSelect} />
            {selected ? (
              <Link href="/quakes" className="glass mx-auto mt-2 flex max-w-md items-center justify-between gap-3 rounded-2xl border-orange-400/40 p-3 hover:bg-white/10">
                <span><b className="text-orange-300">M{selected.mag?.toFixed(1)}</b> <span className="text-sm text-slate-200">{selected.place}</span></span>
                <span className="font-mono text-[11px] text-slate-400">open quakes →</span>
              </Link>
            ) : (
              <p className="mt-2 text-center font-mono text-[11px] text-slate-500">
                drag to orbit · scroll to zoom · click a quake marker
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* live gauges */}
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold md:text-3xl">🔴 Live now</h2>
          <Link href="/live" className="font-mono text-xs text-orange-300 hover:text-orange-200">full live room →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Gauge value={h.kp} max={9} color={h.storm.color} label="Planetary K-index" sub={`Kp ${h.kp.toFixed(1)} · ${h.storm.scale}`} />
          <Gauge value={h.wind} max={1000} color={h.wind > 600 ? "#f43f5e" : h.wind > 450 ? "#fb923c" : "#34d399"} label="Solar wind speed" sub={`${h.wind.toFixed(0)} km/s`} />
          <Gauge value={Math.abs(h.bz ?? 0)} max={30} color={(h.bz ?? 0) < -10 ? "#f43f5e" : (h.bz ?? 0) < -5 ? "#fb923c" : "#34d399"} label="IMF Bz (southward = stormy)" sub={`${(h.bz ?? 0).toFixed(1)} nT`} />
          <Gauge value={h.risk.score} max={100} color={h.risk.color} label="Grid stress index" sub={`${h.risk.level} ${h.risk.score}`} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="glass rounded-2xl p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-orange-300" /> Kp — last 2 hours</div>
            <Spark data={(sw?.kp?.series ?? []).map((p) => p.kp)} color={h.storm.color} />
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Wind className="h-4 w-4 text-sky-300" /> Solar wind km/s</div>
            <Spark data={(sw?.solarWind?.series ?? []).map((p) => p.speed)} color="#38bdf8" />
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Magnet className="h-4 w-4 text-rose-300" /> Bz nT (southward dips)</div>
            <Spark data={(sw?.mag?.series ?? []).map((p) => p.bz)} color="#f43f5e" />
          </div>
        </div>

        <div className="glass mt-4 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Flame className="h-4 w-4 text-amber-300" /> X-ray flux · current class <span className="font-display text-xl" style={{ color: h.xr.color }}>{h.xr.cls}</span></div>
          <p className="mt-1 text-sm text-slate-400">A &lt; B &lt; C &lt; M &lt; X — each letter is 10× stronger. M/X flares can black out HF radio on Earth&apos;s dayside within minutes.</p>
          <div className="mt-3"><Spark data={(sw?.xray?.series ?? []).map((p) => Math.log10(Math.max(1e-9, p.flux)))} color={h.xr.color} height={52} /></div>
          {(sw?.alerts?.length ?? 0) > 0 && (
            <div className="mt-4"><AlertsCard alerts={sw!.alerts!} /></div>
          )}
        </div>
      </section>

      {/* aurora teaser */}
      <section className="mx-auto max-w-7xl px-5 py-6">
        <div className="glass-strong flex flex-wrap items-center gap-5 rounded-3xl p-6 md:p-8">
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold md:text-3xl">🌌 Aurora tonight? Check your latitude.</h2>
            <p className="mt-1 text-slate-400">Live Kp {h.kp.toFixed(1)} · personalized 0–100 verdict · tonight&apos;s field plan.</p>
          </div>
          <div className="flex gap-2">
            <input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" placeholder="52.5" className="w-28 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono outline-none focus:border-emerald-400" />
            <Link href={`/aurora`} className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-black hover:bg-emerald-300">Open planner</Link>
          </div>
        </div>
      </section>

      {/* quakes teaser */}
      <section className="mx-auto max-w-7xl px-5 py-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold md:text-3xl">🌍 Earthquakes · last 72h</h2>
          <Link href="/quakes" className="font-mono text-xs text-orange-300 hover:text-orange-200">explore all {h.quakes.length} →</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {h.quakes.slice(0, 6).map((e) => (
            <Link key={e.id} href="/quakes" className="glass rounded-2xl p-4 transition hover:bg-white/10">
              <span className={`font-display rounded-lg px-2.5 py-1 text-lg font-bold ${e.mag >= 6 ? "bg-rose-500/20 text-rose-300" : e.mag >= 5 ? "bg-orange-500/20 text-orange-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                M{e.mag?.toFixed(1)}
              </span>
              <div className="mt-2 text-sm font-medium text-slate-100">{e.place}</div>
              <div className="mt-1 font-mono text-[11px] text-slate-500">
                {new Date(e.time).toUTCString().slice(5, 22)} UTC · {e.coords.lat.toFixed(1)}°, {e.coords.lon.toFixed(1)}°
              </div>
            </Link>
          ))}
          {h.quakes.length === 0 && <div className="glass rounded-2xl p-6 text-slate-400">Seismic feed loading…</div>}
        </div>
        <p className="mt-3 text-xs text-slate-500">Biggest M{biggest.toFixed(1)} · Honest science: no reliable causal link between solar storms and earthquakes.</p>
      </section>

      {/* oracle teaser */}
      <section className="mx-auto max-w-7xl px-5 py-6">
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          <OraclePanel kp={h.kp} wind={h.wind} bz={h.bz} lat={Number.isFinite(latN) ? latN : null} quakeCount={h.quakes.length} />
          <Link href="/oracle" className="mt-3 inline-block font-mono text-xs text-orange-300 hover:text-orange-200">open full oracle room →</Link>
        </div>
      </section>

      {/* impacts */}
      <section className="mx-auto max-w-7xl px-5 py-6">
        <h2 className="font-display mb-4 text-2xl font-bold md:text-3xl">⚡ Why solar maximum matters in 2026</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Zap, t: "Power grids", d: "G4–G5 storms drive currents in long lines. Operators in 2024–25 already ran protection drills — HELIOS shows the stress index live.", c: "#facc15" },
            { icon: Satellite, t: "Starlink & satellites", d: "Heated atmosphere = extra drag. Thousands of collision-avoidance burns happen during big storms. Wind >600 km/s is the tell.", c: "#38bdf8" },
            { icon: Radio, t: "GPS & HF radio", d: "M/X flares black out dayside HF in minutes; strong Kp degrades GNSS accuracy for aviation, farming and surveying.", c: "#f43f5e" },
            { icon: Shield, t: "Aurora hunters", d: "The upside! Declining phase after maximum statistically delivers the biggest individual storms — and the lowest-latitude auroras.", c: "#34d399" },
          ].map((c) => (
            <div key={c.t} className="glass rounded-2xl p-5">
              <c.icon className="h-6 w-6" style={{ color: c.c }} />
              <div className="font-display mt-2 font-bold">{c.t}</div>
              <p className="mt-1 text-sm text-slate-400">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* developers teaser */}
      <section className="mx-auto max-w-7xl px-5 py-6">
        <div className="glass rounded-3xl p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold">🧩 For developers — free API + MCP</h2>
          <p className="mt-1 text-sm text-slate-400">No keys. CORS-open. Cached at the edge. Give your agent live eyes on the Sun.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/developers" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-orange-200">Explore the API →</Link>
            <Link href="/oracle" className="glass rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-white/10">Ask the Oracle →</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

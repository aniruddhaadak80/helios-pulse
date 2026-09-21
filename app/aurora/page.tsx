"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";
import { useHelios } from "@/hooks/useHelios";
import { auroraLatitude, auroraVerdict } from "@/lib/helio";

const PRESETS: [string, number][] = [
  ["Reykjavík", 64.1],
  ["Tromsø", 69.6],
  ["Oslo", 59.9],
  ["Edinburgh", 55.9],
  ["London", 51.5],
  ["Berlin", 52.5],
  ["New York", 40.7],
  ["Delhi", 28.6],
  ["Sydney", -33.9],
];

const GSCALE = [
  { g: "G0", kp: "0–4", c: "#34d399", fx: "Quiet–active. Aurora near the poles only." },
  { g: "G1", kp: "5", c: "#facc15", fx: "Minor. Aurora ~60° magnetic latitude. Weak grid flickers." },
  { g: "G2", kp: "6", c: "#fb923c", fx: "Moderate. Aurora mid-latitudes. HF fades, satellite drag." },
  { g: "G3", kp: "7", c: "#f43f5e", fx: "Strong. Aurora ~50°. GPS wobbles, transformers alert." },
  { g: "G4", kp: "8", c: "#e11d48", fx: "Severe. Widespread aurora, grid protection trips possible." },
  { g: "G5", kp: "9", c: "#a855f7", fx: "Extreme. Carrington-class. Grids, GNSS, aviation hit hard." },
];

export default function AuroraPage() {
  const h = useHelios();
  const [lat, setLat] = useState("52.5");
  const latN = Number.parseFloat(lat);
  const valid = Number.isFinite(latN) && Math.abs(latN) <= 90;
  const verdict = valid ? auroraVerdict(h.kp, latN) : null;
  const oval = auroraLatitude(h.kp);

  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <SiteNav />
      <div className="mx-auto w-full max-w-7xl flex-1 px-5 py-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-300">Aurora hunter</div>
        <h1 className="font-display mt-1 text-4xl font-bold md:text-5xl">🌌 Will I see the aurora tonight?</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          At live Kp {h.kp.toFixed(1)} the oval&apos;s equatorward edge sits near <b className="text-slate-200">{oval.toFixed(0)}°</b> magnetic
          latitude. Dial in your latitude for a personal verdict.
        </p>

        <div className="glass-strong mt-6 overflow-hidden rounded-3xl">
          <div className="grid lg:grid-cols-2">
            <div className="bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-indigo-600/20 p-8">
              <Sparkles className="h-8 w-8 text-emerald-300" />
              <div className="mt-4 text-sm text-slate-300">Your latitude</div>
              <div className="font-display mt-1 text-6xl font-bold">{valid ? latN.toFixed(1) : "--"}°</div>
              <input
                type="range" min={-60} max={75} step={0.5} value={valid ? latN : 52.5}
                onChange={(e) => setLat(e.target.value)}
                className="mt-5 w-full accent-emerald-400"
              />
              <div className="mt-3 flex gap-2">
                <input
                  value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" placeholder="e.g. 52.5"
                  className="w-36 rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 font-mono outline-none focus:border-emerald-400"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {PRESETS.map(([name, v]) => (
                  <button key={name} onClick={() => setLat(String(v))} className="glass rounded-full px-3 py-1 text-xs hover:bg-white/10">
                    {name} {v}°
                  </button>
                ))}
              </div>
            </div>
            <div className="p-8">
              {verdict ? (
                <>
                  <div className="font-display text-6xl font-bold text-emerald-300">{verdict.score}<span className="text-xl text-slate-400">/100</span></div>
                  <p className="mt-3 text-lg text-slate-200">{verdict.text}</p>
                  {/* oval visual */}
                  <div className="mt-6">
                    <div className="mb-1 flex justify-between font-mono text-[10px] text-slate-500"><span>EQUATOR 0°</span><span>OVAL EDGE {oval.toFixed(0)}°</span><span>POLE 90°</span></div>
                    <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                      <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-400/80 to-emerald-400/10" style={{ width: `${((90 - oval) / 90) * 100}%` }} />
                      <div className="absolute inset-y-[-4px] w-[3px] bg-white" style={{ left: `${(Math.abs(latN) / 90) * 100}%` }} title="you" />
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-slate-400"><MapPin className="h-3 w-3" /> white tick = you · green = auroral zone right now</div>
                  </div>
                  <ul className="mt-5 space-y-1.5 text-sm text-slate-400">
                    <li>🌑 Dark skies 22:00–02:00 local · eyes adapt 20 min</li>
                    <li>📷 Tripod + night mode, 3–10s — cameras see it first</li>
                    <li>☁️ Needs clear skies — check local cloud cover too</li>
                  </ul>
                  <Link
                    href={`/oracle?q=${encodeURIComponent(`Can I see aurora at latitude ${latN}? Kp is ${h.kp.toFixed(1)}. Give me a tonight plan.`)}`}
                    className="mt-5 inline-block rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-emerald-300"
                  >
                    Ask Oracle for my aurora plan →
                  </Link>
                </>
              ) : <p className="text-slate-400">Enter a latitude between −90 and 90.</p>}
            </div>
          </div>
        </div>

        <h2 className="font-display mt-10 text-2xl font-bold">The G-scale, decoded</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {GSCALE.map((r) => (
            <div key={r.g} className="glass rounded-2xl border-l-4 p-4" style={{ borderColor: r.c }}>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl font-bold" style={{ color: r.c }}>{r.g}</span>
                <span className="font-mono text-xs text-slate-400">Kp {r.kp}</span>
              </div>
              <p className="mt-1 text-sm text-slate-300">{r.fx}</p>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

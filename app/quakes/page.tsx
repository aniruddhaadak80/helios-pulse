"use client";

import { useMemo, useState } from "react";
import { Crosshair, ExternalLink, X } from "lucide-react";
import Globe, { GlobeFocus } from "@/components/Globe";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";
import { useHelios } from "@/hooks/useHelios";

const FILTERS = [4.5, 5, 5.5, 6];

export default function QuakesPage() {
  const h = useHelios();
  const [min, setMin] = useState(4.5);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<GlobeFocus | null>(null);
  const [nonce, setNonce] = useState(0);

  const list = useMemo(() => h.quakes.filter((e) => (e.mag ?? 0) >= min), [h.quakes, min]);
  const biggest = useMemo(() => list.reduce((m, e) => Math.max(m, e.mag ?? 0), 0), [list]);
  const selected = h.quakes.find((e) => e.id === selectedId) ?? null;

  const flyTo = (id: string, lat: number, lon: number) => {
    setSelectedId(id);
    const n = nonce + 1;
    setNonce(n);
    setFocus({ lat, lon, nonce: n });
  };

  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <SiteNav />
      <div className="mx-auto w-full max-w-7xl flex-1 px-5 py-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-orange-300">Seismic watch</div>
        <h1 className="font-display mt-1 text-4xl font-bold md:text-5xl">🌍 Earthquakes · 72h</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          {list.length} events ≥ M{min} · biggest M{biggest.toFixed(1)} · USGS. Click any marker on the globe — or any row — and the planet spins to meet it.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((m) => (
            <button
              key={m}
              onClick={() => setMin(m)}
              className={`rounded-full px-4 py-1.5 font-mono text-xs ${min === m ? "bg-orange-500 text-white" : "glass text-slate-300 hover:bg-white/10"}`}
            >
              M{m}+
            </button>
          ))}
          <span className="ml-auto font-mono text-[11px] text-slate-500">sync {h.updated}</span>
        </div>

        {selected && (
          <div className="glass-strong mt-4 flex flex-wrap items-center gap-4 rounded-2xl border-orange-400/30 p-4">
            <span className="font-display rounded-lg bg-orange-500/20 px-3 py-1 text-2xl font-bold text-orange-300">M{selected.mag?.toFixed(1)}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{selected.place}</div>
              <div className="font-mono text-[11px] text-slate-400">
                {new Date(selected.time).toUTCString().slice(5, 22)} UTC · {selected.coords.lat.toFixed(2)}°, {selected.coords.lon.toFixed(2)}° · {selected.coords.depth.toFixed(0)} km deep
                {selected.tsunami ? " · 🌊 TSUNAMI FLAG" : ""}
              </div>
            </div>
            <a href={selected.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-black hover:bg-orange-200">
              USGS detail <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button onClick={() => setSelectedId(null)} className="glass rounded-full p-2 hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-3xl p-4">
            <Globe
              kp={h.kp}
              quakes={h.quakes}
              selectedId={selectedId}
              focus={focus}
              onSelect={(id) => {
                setSelectedId(id);
                const q = h.quakes.find((e) => e.id === id);
                if (q) {
                  const n = nonce + 1;
                  setNonce(n);
                  setFocus({ lat: q.coords.lat, lon: q.coords.lon, nonce: n });
                }
              }}
            />
            <p className="pb-2 text-center font-mono text-[11px] text-slate-500">drag to spin · scroll to zoom · click a pulse · double-click resets</p>
          </div>
          <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
            {list.map((e) => (
              <button
                key={e.id}
                onClick={() => flyTo(e.id, e.coords.lat, e.coords.lon)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                  e.id === selectedId ? "border border-orange-400/50 bg-orange-500/10" : "glass hover:bg-white/10"
                }`}
              >
                <span className={`font-display shrink-0 rounded-lg px-2.5 py-1 font-bold ${e.mag >= 6 ? "bg-rose-500/20 text-rose-300" : e.mag >= 5 ? "bg-orange-500/20 text-orange-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                  M{e.mag?.toFixed(1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{e.place}</span>
                  <span className="font-mono text-[11px] text-slate-500">{new Date(e.time).toUTCString().slice(5, 22)} UTC</span>
                </span>
                <Crosshair className="h-4 w-4 shrink-0 text-slate-500" />
              </button>
            ))}
            {list.length === 0 && <div className="glass rounded-2xl p-6 text-slate-400">Seismic feed loading…</div>}
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">Honest science: decades of studies find <b>no reliable causal link</b> between solar storms and earthquakes. HELIOS shows both so you can watch — not to imply causation.</p>
      </div>
      <SiteFooter />
    </main>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bot,
  Flame,
  Globe2,
  Magnet,
  Radio,
  Satellite,
  Send,
  Shield,
  Sparkles,
  Sun,
  Wind,
  Zap,
} from "lucide-react";
import Globe from "./Globe";
import { FALLBACK, auroraLatitude, auroraVerdict, gridRisk, stormLevel, xrayClass } from "@/lib/helio";

// Aurora glyph (Sparkles reads well as aurora shimmer)
const AuroraGlyph = Sparkles;

type SW = {
  kp?: { latest: number | null; series: { t: string; kp: number }[]; time?: string | null };
  xray?: { flux: number | null; series: { t: string; flux: number }[] };
  solarWind?: { speed: number | null; density: number | null; series: { t: string; speed: number }[] };
  mag?: { bz: number | null; series: { t: string; bz: number }[] };
  alerts?: { message?: string; issue_datetime?: string }[];
};
type Quake = {
  id: string;
  mag: number;
  place: string;
  time: number;
  url: string;
  tsunami: number;
  coords: { lat: number; lon: number; depth: number };
};

function Spark({ data, color, height = 64 }: { data: number[]; color: string; height?: number }) {
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
  return (
    <svg viewBox={`0 0 280 ${height}`} className="w-full" style={{ height }}>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d={`${path} L280,${height} L0,${height} Z`} fill={color} opacity="0.12" stroke="none" />
    </svg>
  );
}

function Gauge({ value, max, color, label, sub }: { value: number; max: number; color: string; label: string; sub: string }) {
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

export default function Dashboard() {
  const [sw, setSw] = useState<SW | null>(null);
  const [quakes, setQuakes] = useState<Quake[]>([]);
  const [lat, setLat] = useState("52.5");
  const [q, setQ] = useState("");
  const [chat, setChat] = useState<{ role: string; text: string }[]>([
    { role: "oracle", text: "I am the HELIOS Oracle. Ask me anything — try “Can I see aurora at 40° tonight?” or “Is the power grid at risk?”" },
  ]);
  const [busy, setBusy] = useState(false);
  const [updated, setUpdated] = useState<string>("—");

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch("/api/space-weather").then((r) => r.json()),
        fetch("/api/earthquakes?minmag=4.5&limit=30&hours=72").then((r) => r.json()),
      ]);
      setSw(a);
      setQuakes(b.quakes ?? []);
      setUpdated(new Date().toUTCString().slice(5, 22) + " UTC");
    } catch {
      /* keep fallbacks */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 120000);
    return () => clearInterval(t);
  }, [load]);

  const kp = sw?.kp?.latest ?? FALLBACK.kp;
  const wind = sw?.solarWind?.speed ?? FALLBACK.windSpeed;
  const bz = sw?.mag?.bz ?? FALLBACK.bz;
  const flux = sw?.xray?.flux ?? FALLBACK.xrayFlux;
  const storm = stormLevel(kp);
  const risk = gridRisk(kp, wind, bz);
  const xr = xrayClass(flux);
  const latN = Number.parseFloat(lat);
  const verdict = Number.isFinite(latN) ? auroraVerdict(kp, latN) : null;
  const oval = auroraLatitude(kp);

  const ask = useCallback(
    async (question: string) => {
      if (!question.trim() || busy) return;
      setBusy(true);
      setChat((c) => [...c, { role: "you", text: question }]);
      setQ("");
      try {
        const r = await fetch("/api/oracle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question, kp, wind, bz, lat: Number.isFinite(latN) ? latN : null, quakes: quakes.slice(0, 5) }),
        });
        const j = await r.json();
        setChat((c) => [...c, { role: "oracle", text: j.answer }]);
      } catch {
        setChat((c) => [...c, { role: "oracle", text: "My link to the Sun flickered. Try again in a moment." }]);
      }
      setBusy(false);
    },
    [busy, kp, wind, bz, latN, quakes]
  );

  const alerts = (sw?.alerts ?? []).filter((a) => a.message).slice(0, 5);
  const biggest = quakes.reduce((m, e) => Math.max(m, e.mag ?? 0), 0);

  return (
    <div className="relative">
      {/* alert ticker */}
      <div className="overflow-hidden border-b border-white/10 bg-black/40 py-1.5 text-[12px]">
        <div className="animate-ticker flex w-max gap-10 whitespace-nowrap px-4 font-mono text-amber-200/90">
          {[0, 1].map((k) => (
            <span key={k}>
              ● LIVE SOLAR CYCLE 25 MAXIMUM — Kp {kp.toFixed(1)} ({storm.label}) · Wind {wind.toFixed(0)} km/s · Bz {(bz ?? 0).toFixed(1)} nT · X-ray {xr.cls}-class · {quakes.length} M4.5+ quakes/72h
              {alerts[0]?.message ? ` · NOAA: ${alerts[0].message.slice(0, 90)}` : " · No active NOAA warnings"}
            </span>
          ))}
        </div>
      </div>

      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#030014]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-600 shadow-lg shadow-orange-500/30">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-display text-sm font-bold tracking-[0.2em]">HELIOS PULSE</div>
              <div className="font-mono text-[10px] text-emerald-300">● LIVE · SOLAR MAX 2026</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#live" className="hover:text-white">Live</a>
            <a href="#aurora" className="hover:text-white">Aurora</a>
            <a href="#quakes" className="hover:text-white">Quakes</a>
            <a href="#oracle" className="hover:text-white">Oracle</a>
            <a href="#developers" className="hover:text-white">API</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="#oracle" className="rounded-full bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2 text-sm font-semibold shadow-lg shadow-orange-500/25 hover:brightness-110">
              Ask Oracle
            </a>
            <a
              href="https://github.com/aniruddhaadak80/helios-pulse"
              target="_blank"
              rel="noreferrer"
              className="glass rounded-full px-4 py-2 text-sm hover:bg-white/10"
            >
              ★ Star
            </a>
          </div>
        </div>
      </header>

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
                <button onClick={() => ask(`Brief me: Kp ${kp.toFixed(1)}, wind ${wind.toFixed(0)} km/s. What should I do tonight?`)} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-orange-200">
                  ⚡ Get my live briefing
                </button>
                <a href="#developers" className="glass rounded-full px-5 py-3 text-sm font-semibold hover:bg-white/10">
                  {"</>"} Use the free API + MCP
                </a>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 font-mono text-[11px] text-slate-400">
                <span className="glass rounded-full px-3 py-1">Kp {kp.toFixed(1)} · {storm.label}</span>
                <span className="glass rounded-full px-3 py-1">Wind {wind.toFixed(0)} km/s</span>
                <span className="glass rounded-full px-3 py-1">Bz {(bz ?? 0).toFixed(1)} nT</span>
                <span className="glass rounded-full px-3 py-1">X-ray {xr.cls}-class</span>
                <span className="glass rounded-full px-3 py-1">Updated {updated}</span>
              </div>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
            <Globe kp={kp} quakes={quakes} />
            <p className="mt-2 text-center font-mono text-[11px] text-slate-500">
              ● orange pulses = M4.5+ quakes (72h) · globe glow = geomagnetic storm level
            </p>
          </motion.div>
        </div>
      </section>

      {/* live gauges */}
      <section id="live" className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold md:text-3xl">🔴 Live now</h2>
          <span className="font-mono text-xs text-slate-400">NOAA SWPC · USGS · refresh 2 min</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Gauge value={kp} max={9} color={storm.color} label="Planetary K-index" sub={`Kp ${kp.toFixed(1)} · ${storm.scale}`} />
          <Gauge value={wind} max={1000} color={wind > 600 ? "#f43f5e" : wind > 450 ? "#fb923c" : "#34d399"} label="Solar wind speed" sub={`${wind.toFixed(0)} km/s`} />
          <Gauge value={Math.abs(bz ?? 0)} max={30} color={(bz ?? 0) < -10 ? "#f43f5e" : (bz ?? 0) < -5 ? "#fb923c" : "#34d399"} label="IMF Bz (southward = stormy)" sub={`${(bz ?? 0).toFixed(1)} nT`} />
          <Gauge value={risk.score} max={100} color={risk.color} label="Grid stress index" sub={`${risk.level} ${risk.score}`} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="glass rounded-2xl p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-orange-300" /> Kp — last 2 hours</div>
            <Spark data={(sw?.kp?.series ?? []).map((p) => p.kp)} color={storm.color} />
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
          <div className="flex items-center gap-2 text-sm font-semibold"><Flame className="h-4 w-4 text-amber-300" /> X-ray flux · current class <span className="font-display text-xl" style={{ color: xr.color }}>{xr.cls}</span></div>
          <p className="mt-1 text-sm text-slate-400">A &lt; B &lt; C &lt; M &lt; X — each letter is 10× stronger. M/X flares can black out HF radio on Earth's dayside within minutes.</p>
          <div className="mt-3"><Spark data={(sw?.xray?.series ?? []).map((p) => Math.log10(Math.max(1e-9, p.flux)))} color={xr.color} height={52} /></div>
          {alerts.length > 0 && (
            <ul className="mt-4 space-y-2">
              {alerts.map((a, i) => (
                <li key={i} className="flex gap-2 rounded-xl bg-amber-400/10 p-3 text-[13px] text-amber-100">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span><span className="font-mono text-[11px] text-amber-300">{a.issue_datetime ?? ""}</span> — {a.message?.slice(0, 220)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* aurora */}
      <section id="aurora" className="mx-auto max-w-7xl px-5 py-6">
        <div className="glass-strong overflow-hidden rounded-3xl">
          <div className="grid lg:grid-cols-2">
            <div className="bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-indigo-600/20 p-8">
              <AuroraGlyph className="h-8 w-8 text-emerald-300" />
              <h2 className="font-display mt-3 text-3xl font-bold">Will I see the aurora tonight?</h2>
              <p className="mt-2 text-slate-300">At Kp {kp.toFixed(1)} the oval's equatorward edge sits near <b>{oval.toFixed(0)}°</b> magnetic latitude. Enter your latitude for a personal verdict.</p>
              <div className="mt-5 flex gap-2">
                <input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" placeholder="e.g. 52.5" className="w-40 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-lg outline-none focus:border-emerald-400" />
                <button onClick={() => setLat(lat)} className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-black hover:bg-emerald-300">Check</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[["Reykjavík", 64.1], ["Oslo", 59.9], ["London", 51.5], ["New York", 40.7], ["Delhi", 28.6]].map(([name, v]) => (
                  <button key={name as string} onClick={() => setLat(String(v))} className="glass rounded-full px-3 py-1 text-xs hover:bg-white/10">{name} {v}°</button>
                ))}
              </div>
            </div>
            <div className="p-8">
              {verdict ? (
                <>
                  <div className="font-display text-5xl font-bold text-emerald-300">{verdict.score}<span className="text-xl text-slate-400">/100</span></div>
                  <p className="mt-3 text-lg text-slate-200">{verdict.text}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-slate-400">
                    <li>🌑 Go somewhere dark 22:00–02:00 local · let eyes adapt 20 min</li>
                    <li>📷 Phone on tripod, night mode, 3–10s exposure — cameras see it first</li>
                    <li>☁️ Clear skies required — check local cloud cover too</li>
                  </ul>
                  <button onClick={() => ask(`Can I see aurora at latitude ${latN}? Kp is ${kp.toFixed(1)}. Give me a tonight plan.`)} className="mt-5 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-emerald-300">
                    Ask Oracle for my aurora plan →
                  </button>
                </>
              ) : <p className="text-slate-400">Enter a valid latitude.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* quakes */}
      <section id="quakes" className="mx-auto max-w-7xl px-5 py-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold md:text-3xl">🌍 Earthquakes · last 72h</h2>
          <span className="font-mono text-xs text-slate-400">{quakes.length} events · biggest M{biggest.toFixed(1)} · USGS</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {quakes.slice(0, 9).map((e) => (
            <a key={e.id} href={e.url} target="_blank" rel="noreferrer" className="glass rounded-2xl p-4 transition hover:bg-white/10">
              <div className="flex items-center justify-between">
                <span className={`font-display rounded-lg px-2.5 py-1 text-lg font-bold ${e.mag >= 6 ? "bg-rose-500/20 text-rose-300" : e.mag >= 5 ? "bg-orange-500/20 text-orange-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                  M{e.mag?.toFixed(1)}
                </span>
                {e.tsunami ? <span className="rounded-full bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] text-sky-300">TSUNAMI FLAG</span> : null}
              </div>
              <div className="mt-2 text-sm font-medium text-slate-100">{e.place}</div>
              <div className="mt-1 font-mono text-[11px] text-slate-500">
                {new Date(e.time).toUTCString().slice(5, 22)} UTC · {e.coords.lat.toFixed(1)}°, {e.coords.lon.toFixed(1)}° · {e.coords.depth.toFixed(0)} km deep
              </div>
            </a>
          ))}
          {quakes.length === 0 && <div className="glass rounded-2xl p-6 text-slate-400">Seismic feed loading…</div>}
        </div>
        <p className="mt-3 text-xs text-slate-500">Honest science: decades of studies find <b>no reliable causal link</b> between solar storms and earthquakes. HELIOS shows both side-by-side so you can watch — not to imply causation.</p>
      </section>

      {/* oracle */}
      <section id="oracle" className="mx-auto max-w-7xl px-5 py-6">
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-600"><Bot className="h-6 w-6 text-white" /></div>
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">HELIOS Oracle</h2>
              <p className="font-mono text-[11px] text-slate-400">physics engine on-device · upgrades to LLM if OPENAI_API_KEY is set</p>
            </div>
          </div>
          <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
            {chat.map((m, i) => (
              <div key={i} className={`max-w-3xl whitespace-pre-wrap rounded-2xl p-4 text-sm leading-relaxed ${m.role === "you" ? "ml-auto bg-orange-500/20 text-orange-50" : "bg-white/5 text-slate-200"}`}>
                <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">{m.role === "you" ? "you" : "✦ oracle"}</div>
                {m.text}
              </div>
            ))}
            {busy && <div className="font-mono text-xs text-slate-500">oracle consulting the Sun…</div>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="mt-4 flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Ask: "Is GPS at risk?" · "aurora at 40°?" · "should I worry about the grid?"' className="flex-1 rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-orange-400" />
            <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-3 text-sm font-bold disabled:opacity-50">
              <Send className="h-4 w-4" /> Ask
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Brief me in 3 bullets", "Is the power grid at risk right now?", "Can I see aurora at 40° tonight?", "I'm flying polar — any concern?", "Explain Kp like I'm 12"].map((s) => (
              <button key={s} onClick={() => ask(s)} className="glass rounded-full px-3 py-1.5 text-xs hover:bg-white/10">{s}</button>
            ))}
          </div>
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

      {/* developers */}
      <section id="developers" className="mx-auto max-w-7xl px-5 py-6">
        <div className="glass rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-orange-300" /><h2 className="font-display text-2xl font-bold">For developers — free API + MCP</h2></div>
          <p className="mt-1 text-sm text-slate-400">No keys. CORS-open. Cached at the edge. Give your agent live eyes on the Sun.</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <pre className="overflow-x-auto rounded-2xl bg-black/60 p-4 font-mono text-[11px] leading-relaxed text-emerald-200">{`# live space weather\ncurl https://helios-pulse.vercel.app/api/space-weather\n\n# recent quakes\ncurl "https://helios-pulse.vercel.app/api/earthquakes?minmag=5&limit=10"\n\n# oracle briefing\ncurl -X POST https://helios-pulse.vercel.app/api/oracle \\
  -H 'content-type: application/json' \\
  -d '{"question":"aurora at 52.5?","kp":5.2,"lat":52.5}'`}</pre>
            <pre className="overflow-x-auto rounded-2xl bg-black/60 p-4 font-mono text-[11px] leading-relaxed text-sky-200">{`// MCP manifest for agents\nGET /api/mcp  →  tools:\n  helios.space_weather\n  helios.aurora_verdict\n  helios.quakes\n  helios.ask_oracle\n\n// dispatch\nPOST /api/mcp\n{"tool":"helios.space_weather"}`}</pre>
            <div className="rounded-2xl bg-gradient-to-br from-orange-500/15 to-rose-600/15 p-5">
              <div className="font-display font-bold">Embed HELIOS in your agent</div>
              <p className="mt-1 text-sm text-slate-300">Point Claude / Cursor / Codex at <span className="font-mono text-orange-200">/api/mcp</span> — it lists tools + JSON schemas. Fork it, add webhooks, ship your own aurora bot tonight.</p>
              <a href="https://github.com/aniruddhaadak80/helios-pulse" target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-orange-200">Fork on GitHub →</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 text-center">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-orange-400" />
            <span className="font-display text-sm font-bold tracking-[0.2em]">HELIOS PULSE</span>
          </div>
          <p className="max-w-2xl text-sm text-slate-400">
            Data: NOAA Space Weather Prediction Center · USGS Earthquake Hazards · Open science, MIT-licensed.
            Not an official alert feed — for life-safety decisions always follow NOAA SWPC + local authorities.
          </p>
          <p className="font-mono text-[11px] text-slate-600">Built for Solar Cycle 25 maximum · Sep 2026 · by aniruddhaadak80 · PRs welcome ★</p>
        </div>
      </footer>
    </div>
  );
}

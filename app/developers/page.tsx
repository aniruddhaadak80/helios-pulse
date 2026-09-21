"use client";

import { useState } from "react";
import { FlaskConical, Play } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";

type EP = "space" | "quakes" | "oracle" | "mcp";

const EPS: Record<EP, { title: string; desc: string; curl: string; js: string; py: string; run: () => Promise<unknown> }> = {
  space: {
    title: "GET /api/space-weather",
    desc: "Kp series, GOES X-ray flux, solar-wind speed/density, IMF Bz, OVATION aurora. Cached 60s at the edge.",
    curl: "curl https://helios-pulse.vercel.app/api/space-weather",
    js: 'const r = await fetch("https://helios-pulse.vercel.app/api/space-weather");\nconst { kp, solarWind, mag } = await r.json();\nconsole.log("Kp", kp.latest, "| wind", solarWind.speed);',
    py: 'import requests\nd = requests.get("https://helios-pulse.vercel.app/api/space-weather").json()\nprint("Kp", d["kp"]["latest"], "| wind", d["solarWind"]["speed"])',
    run: () => fetch("/api/space-weather").then((r) => r.json()),
  },
  quakes: {
    title: "GET /api/earthquakes",
    desc: "USGS M4.5+ quakes, simplified. ?minmag= &limit= &hours= supported.",
    curl: 'curl "https://helios-pulse.vercel.app/api/earthquakes?minmag=5&limit=10"',
    js: 'const r = await fetch("https://helios-pulse.vercel.app/api/earthquakes?minmag=5&limit=10");\nconst { quakes } = await r.json();',
    py: 'import requests\nqs = requests.get("https://helios-pulse.vercel.app/api/earthquakes",\n  params={"minmag": 5, "limit": 10}).json()["quakes"]',
    run: () => fetch("/api/earthquakes?minmag=5&limit=5&hours=72").then((r) => r.json()),
  },
  oracle: {
    title: "POST /api/oracle",
    desc: "Gemini 3.5 Flash briefing with physics fallback. Attach kp/wind/bz/lat for grounded answers.",
    curl: `curl -X POST https://helios-pulse.vercel.app/api/oracle \\\n  -H 'content-type: application/json' \\\n  -d '{"question":"aurora at 52.5?","kp":5.2,"lat":52.5}'`,
    js: 'const r = await fetch("https://helios-pulse.vercel.app/api/oracle", {\n  method: "POST",\n  headers: { "content-type": "application/json" },\n  body: JSON.stringify({ question: "aurora at 52.5?", kp: 5.2, lat: 52.5 }),\n});\nconst { answer } = await r.json();',
    py: 'import requests\na = requests.post("https://helios-pulse.vercel.app/api/oracle",\n  json={"question": "aurora at 52.5?", "kp": 5.2, "lat": 52.5}).json()\nprint(a["answer"])',
    run: () =>
      fetch("/api/oracle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "Brief me in 2 bullets.", kp: 2, wind: 410, bz: -2, lat: null }),
      }).then((r) => r.json()),
  },
  mcp: {
    title: "GET /api/mcp · POST /api/mcp",
    desc: "Agent manifest: tool list + JSON schemas. POST {tool, args} dispatches.",
    curl: 'curl https://helios-pulse.vercel.app/api/mcp',
    js: 'const manifest = await fetch("https://helios-pulse.vercel.app/api/mcp").then(r => r.json());\n// manifest.tools → helios.space_weather, helios.quakes, helios.ask_oracle',
    py: 'import requests\nm = requests.get("https://helios-pulse.vercel.app/api/mcp").json()\nprint([t["name"] for t in m["tools"]])',
    run: () => fetch("/api/mcp").then((r) => r.json()),
  },
};

const TOOLS = [
  { name: "helios.space_weather", use: "Current Kp, wind, Bz, X-ray, aurora model" },
  { name: "helios.aurora_verdict", use: "Visibility verdict for {latitude, kp}" },
  { name: "helios.quakes", use: "Recent significant earthquakes" },
  { name: "helios.ask_oracle", use: "Plain-English risk briefing" },
];

export default function DevelopersPage() {
  const [ep, setEp] = useState<EP>("space");
  const [lang, setLang] = useState<"curl" | "js" | "py">("curl");
  const [out, setOut] = useState<string>("← press “Try live” to hit this endpoint right now.");
  const [busy, setBusy] = useState(false);

  const active = EPS[ep];
  const snippet = lang === "curl" ? active.curl : lang === "js" ? active.js : active.py;

  const run = async () => {
    setBusy(true);
    try {
      const j = await active.run();
      setOut(JSON.stringify(j, null, 2).slice(0, 4000));
    } catch (e) {
      setOut(`error: ${String(e)}`);
    }
    setBusy(false);
  };

  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <SiteNav />
      <div className="mx-auto w-full max-w-7xl flex-1 px-5 py-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-orange-300">For developers + agents</div>
        <h1 className="font-display mt-1 text-4xl font-bold md:text-5xl">🧩 Free API + MCP</h1>
        <p className="mt-2 max-w-2xl text-slate-400">No keys. CORS-open. Edge-cached. Give your app — or your agent — live eyes on the Sun.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {(Object.keys(EPS) as EP[]).map((k) => (
            <button key={k} onClick={() => setEp(k)} className={`rounded-full px-4 py-2 font-mono text-xs ${ep === k ? "bg-orange-500 text-white" : "glass text-slate-300 hover:bg-white/10"}`}>
              {EPS[k].title.split(" ")[1]}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-2xl p-5">
            <div className="font-mono text-sm text-orange-200">{active.title}</div>
            <p className="mt-1 text-sm text-slate-400">{active.desc}</p>
            <div className="mt-3 flex gap-1 rounded-full bg-black/40 p-1 font-mono text-xs">
              {(["curl", "js", "py"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`flex-1 rounded-full py-1.5 ${lang === l ? "bg-white/15 text-white" : "text-slate-500"}`}>{l === "js" ? "javascript" : l === "py" ? "python" : "curl"}</button>
              ))}
            </div>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-black/60 p-4 font-mono text-[11.5px] leading-relaxed text-emerald-200">{snippet}</pre>
            <button onClick={run} disabled={busy} className="mt-3 flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-emerald-300 disabled:opacity-50">
              <Play className="h-4 w-4" /> {busy ? "calling…" : "Try live"}
            </button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/60 p-5">
            <div className="mb-2 flex items-center gap-2 font-mono text-xs text-slate-400"><FlaskConical className="h-4 w-4" /> live response</div>
            <pre className="max-h-[420px] overflow-auto font-mono text-[11px] leading-relaxed text-sky-200">{out}</pre>
          </div>
        </div>

        <h2 className="font-display mt-10 text-2xl font-bold">Agent tools (MCP)</h2>
        <p className="mt-1 text-sm text-slate-400">Point Claude / Cursor / Codex / OpenClaw at <span className="font-mono text-orange-200">GET /api/mcp</span> — it returns tools + JSON schemas, and <span className="font-mono text-orange-200">POST /api/mcp</span> dispatches them.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {TOOLS.map((t) => (
            <div key={t.name} className="glass rounded-2xl p-4">
              <div className="font-mono text-sm text-emerald-300">{t.name}</div>
              <div className="mt-1 text-sm text-slate-400">{t.use}</div>
            </div>
          ))}
        </div>

        <div className="glass mt-6 rounded-2xl p-5 text-sm text-slate-400">
          Fair use: upstream NOAA/USGS are public goods — responses are edge-cached (60–120s), so poll no faster than <span className="font-mono text-slate-200">once a minute</span>.
          Oracle answers are AI-generated + physics-grounded; never safety-critical. Deploy your own with one click:{" "}
          <a className="text-orange-300 underline" href="https://vercel.com/new/clone?repository-url=https://github.com/aniruddhaadak80/helios-pulse" target="_blank" rel="noreferrer">vercel.com/new/clone</a>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

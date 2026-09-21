<div align="center">

# ☀️ HELIOS PULSE

### *Our star is wide awake — this is the living dashboard for it.*

**Live space-weather · aurora odds · earthquakes · grid risk · AI Oracle — for Solar Cycle 25 maximum (2024 → late 2026)**

[![Live](https://img.shields.io/badge/●_LIVE-helios--pulse.vercel.app-orange?style=for-the-badge)](https://helios-pulse.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![API](https://img.shields.io/badge/API-REST_+_MCP-emerald?style=flat-square)](https://helios-pulse.vercel.app/api/mcp)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-rose?style=flat-square)](./CONTRIBUTING.md)

**No API keys · No signup · Real NOAA + USGS data · MCP-ready for AI agents**

[🔴 Open the live app](https://helios-pulse.vercel.app) · [🤖 Oracle API](#-helios-oracle) · [🧩 MCP for agents](#-mcp--agent-tools) · [🛠️ Run locally](#️-run-locally)

</div>

---

## 🌞 Why now — Solar Maximum 2026

Solar Cycle 25 officially peaked in 2024–2025, but **2026 is still inside the maximum**: elevated auroras, frequent Kp5+ storms, M/X-class flares. Statistically, the *declining phase* right after maximum is when some of the largest individual storms in history struck — including the 1859 Carrington Event.

The same storms that paint the sky can:

- ⚡ trip **power-grid protection** (G4–G5)
- 🛰️ spike **satellite drag** (Starlink lost ~40 sats to one storm in 2022)
- 📡 degrade **GPS** and black out **HF radio** within minutes of an X-flare
- ✈️ reroute **polar flights** and disrupt migratory navigation

HELIOS PULSE turns raw NOAA/USGS firehoses into **one beautiful screen anyone can read in 10 seconds** — and an API any agent can use in 10 lines.

## ✨ What you get

| | |
|---|---|
| 🌍 **Interactive 3D globe** | `cobe` WebGL Earth — **drag to spin, scroll to zoom, click quake pulses** to select, auto fly-to, storm-reactive glow |
| 🔴 **Live room** (`/live`) | Kp · solar-wind · Bz · X-ray class · grid-stress + feed-health dots (NOAA SWPC, 60s cache) |
| 📈 **Storm tapes** | 2-hour Kp / wind / Bz sparklines + GOES X-ray flux + OVATION aurora advisories |
| 🌌 **Aurora planner** (`/aurora`) | Latitude slider + presets, 0–100 verdict, oval-edge visual, G-scale decoder |
| 🌍 **Quake explorer** (`/quakes`) | Magnitude filters, click-to-fly globe, USGS detail cards |
| 🤖 **HELIOS Oracle** (`/oracle`) | **Gemini 3.5 Flash** briefings in plain English; physics engine fallback with zero keys |
| 🧩 **REST + MCP** (`/developers`) | `/api/space-weather` · `/api/earthquakes` · `/api/oracle` · `/api/mcp` — live-try playground included |

## 🤖 HELIOS Oracle

```bash
curl -X POST https://helios-pulse.vercel.app/api/oracle \
  -H 'content-type: application/json' \
  -d '{"question":"Can I see aurora at 52.5° tonight?","kp":5.2,"wind":610,"bz":-12,"lat":52.5}'
```

## 🧩 MCP / agent tools

```bash
curl https://helios-pulse.vercel.app/api/mcp   # manifest + JSON schemas
```

Tools: `helios.space_weather` · `helios.aurora_verdict` · `helios.quakes` · `helios.ask_oracle`.
Works with Claude Code, Cursor, Codex, OpenClaw — anything that speaks JSON over HTTPS.

```bash
curl -X POST https://helios-pulse.vercel.app/api/mcp \
  -H 'content-type: application/json' \
  -d '{"tool":"helios.space_weather"}'
```

## 🛰️ Data sources (all keyless, all open)

- **NOAA SWPC** — `planetary_k_index_1m`, GOES X-ray 6h, solar-wind plasma + mag 2h, alerts
- **USGS** — FDSN earthquake catalog M4.5+ / 72h
- Proxied + edge-cached by Next.js routes (`/api/*`) so the UI never CORS-fails and never hammers upstream

## ⌨️ Run locally

```bash
git clone https://github.com/aniruddhaadak80/helios-pulse.git
cd helios-pulse
npm install
npm run dev        # → http://localhost:3000
```

Optional AI upgrade (free tier — key stays server-side, never committed):

```bash
# .env.local (gitignored) — or set GEMINI_API_KEY in Vercel env
GEMINI_API_KEY="your-ai-studio-key"
GEMINI_MODEL="gemini-3.5-flash"
npm run dev
```

Deploy your own in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aniruddhaadak80/helios-pulse)

## 🗺️ Roadmap

- [ ] OVATION-style auroral-oval overlay on a 2D night map
- [ ] NASA DONKI CME/flare timeline cards
- [ ] Push alerts (WebPush) for Kp ≥ 6 at your latitude
- [ ] PWA offline + shareable aurora-verdict OG cards
- [ ] Crowd aurora sightings layer

PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). Good first issues: `aurora-map`, `donki-timeline`, `webpush`.

## ⚠️ Honest science

- For life-safety decisions always follow **NOAA SWPC** + local authorities — HELIOS is an educational lens, not an official alert feed.
- Decades of research find **no reliable causal link between solar storms and earthquakes**; we display both so you can watch, not to imply causation.

## 📜 License

MIT © aniruddhaadak80 — the Sun belongs to everyone.

---

<div align="center">

**If HELIOS helped you catch an aurora or dodge a storm — give it a ★ and tell someone under dark skies.** 🌌

</div>

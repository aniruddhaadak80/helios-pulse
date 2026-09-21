<div align="center">

# ☀️ HELIOS PULSE

### *Our star is wide awake — this is the living dashboard for it.*

**Live space-weather · aurora odds · earthquakes · grid risk · AI Oracle — for Solar Cycle 25 maximum (2024 → late 2026)**

[![Live](https://img.shields.io/badge/●_LIVE-helios--pulse.vercel.app-orange?style=for-the-badge)](https://helios-pulse.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![3D](https://img.shields.io/badge/3D-react--globe.gl_+_three.js-violet?style=flat-square)](https://github.com/vasturiano/react-globe.gl)
[![Oracle](https://img.shields.io/badge/Oracle-Gemini_3.5_Flash-4285F4?style=flat-square)](https://ai.google.dev)
[![API](https://img.shields.io/badge/API-REST_+_MCP-emerald?style=flat-square)](https://helios-pulse.vercel.app/api/mcp)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-rose?style=flat-square)](./CONTRIBUTING.md)

**No API keys · No signup · Real NOAA + USGS data · MCP-ready for AI agents**

[🔴 Open the live app](https://helios-pulse.vercel.app) · [🛰️ Live room](https://helios-pulse.vercel.app/live) · [🌌 Aurora planner](https://helios-pulse.vercel.app/aurora) · [🤖 Oracle API](#-helios-oracle)

</div>

---

## 🌞 Why now — Solar Maximum 2026

Solar Cycle 25 officially peaked in 2024–2025, but **2026 is still inside the maximum**: elevated auroras, frequent Kp5+ storms, M/X-class flares. Statistically, the *declining phase* right after maximum is when some of the largest individual storms in history struck — including the 1859 Carrington Event.

The same storms that paint the sky can trip power grids, spike satellite drag, degrade GPS and black out HF radio. HELIOS PULSE turns raw NOAA/USGS firehoses into **one beautiful screen anyone can read in 10 seconds** — and an API any agent can use in 10 lines.

---

## 🗺️ How HELIOS works — system architecture

```mermaid
flowchart LR
    subgraph SRC["🛰️ Open data sources"]
        direction TB
        NOAA["☀️ NOAA SWPC<br/>Kp · X-ray · wind · Bz · OVATION"]
        USGS["🌍 USGS FDSN<br/>M4.5+ quakes / 72h"]
        GEM["✨ Google Gemini 3.5 Flash<br/>free tier, server-side key"]
    end
    subgraph APP["▲ HELIOS — Next.js 16 App Router"]
        direction TB
        API["📡 Route handlers<br/>/api/space-weather · /api/earthquakes<br/>/api/oracle · /api/mcp<br/>edge-cached 60–120s"]
        PAGES["🖥️ Routes<br/>/ · /live · /aurora<br/>/quakes · /oracle · /developers"]
        GLOBE["🌐 react-globe.gl + three.js<br/>orbit · zoom · click · fly-to"]
    end
    subgraph YOU["💛 Consumers"]
        direction TB
        HUMAN["🧑 Humans<br/>aurora hunters · grid nerds"]
        AGENT["🤖 AI agents<br/>REST + MCP tools"]
    end
    NOAA --> API
    USGS --> API
    GEM --> API
    API --> PAGES
    API --> GLOBE
    PAGES --> HUMAN
    API --> AGENT

    classDef src fill:#1e3a8a,stroke:#60a5fa,color:#fff,stroke-width:2px
    classDef app fill:#7c2d12,stroke:#fb923c,color:#fff,stroke-width:2px
    classDef you fill:#065f46,stroke:#34d399,color:#fff,stroke-width:2px
    class NOAA,USGS,GEM src
    class API,PAGES,GLOBE app
    class HUMAN,AGENT you
```

---

## 🔄 Live data pipeline — every 2 minutes

```mermaid
flowchart TD
    T(["⏱️ useHelios hook<br/>polls every 120s"]) --> SW["GET /api/space-weather"]
    T --> EQ["GET /api/earthquakes?minmag=4.5"]
    SW --> C1{"Edge cache<br/>fresh < 60s?"}
    C1 -- yes --> R1["⚡ cached JSON"]
    C1 -- no --> N1["🌐 NOAA SWPC<br/>Kp 1-min · GOES X-ray<br/>RTSW wind + mag · OVATION"]
    N1 --> R1
    EQ --> C2{"Edge cache<br/>fresh < 120s?"}
    C2 -- yes --> R2["⚡ cached JSON"]
    C2 -- no --> N2["🌐 USGS FDSN catalog"]
    N2 --> R2
    R1 --> UI["🎨 gauges · sparklines<br/>globe glow · aurora math"]
    R2 --> UI
    UI --> DEG{"feed degraded?"}
    DEG -- yes --> FB["🛟 graceful fallbacks<br/>app never breaks"]
    DEG -- no --> DONE(["✅ live badges everywhere"])

    classDef trig fill:#312e81,stroke:#a78bfa,color:#fff
    classDef api fill:#0c4a6e,stroke:#38bdf8,color:#fff
    classDef ext fill:#1e3a8a,stroke:#60a5fa,color:#fff
    classDef ok fill:#065f46,stroke:#34d399,color:#fff
    classDef warn fill:#78350f,stroke:#fbbf24,color:#fff
    class T trig
    class SW,EQ api
    class N1,N2 ext
    class R1,R2,UI,DONE ok
    class C1,C2,DEG,FB warn
```

---

## 🧭 Page map — real routes, no hash navigation

```mermaid
flowchart LR
    HOME["🏠 / — hero +<br/>interactive globe + teasers"]
    LIVE["🔴 /live<br/>mission control"]
    AUR["🌌 /aurora<br/>latitude planner"]
    QUA["🌍 /quakes<br/>fly-to explorer"]
    ORA["🤖 /oracle<br/>chat room"]
    DEV["🧩 /developers<br/>API playground"]

    HOME --> LIVE
    HOME --> AUR
    HOME --> QUA
    HOME --> ORA
    HOME --> DEV
    AUR -- "?q= aurora plan" --> ORA
    QUA -- "selected quake" --> QUA
    DEV -- "Try live" --> API["📡 /api/* JSON"]

    classDef page fill:#4c1d95,stroke:#a78bfa,color:#fff,stroke-width:2px
    classDef api fill:#065f46,stroke:#34d399,color:#fff,stroke-width:2px
    class HOME,LIVE,AUR,QUA,ORA,DEV page
    class API api
```

Every link in the nav is a dedicated Next.js route with its own layout, metadata and deep-linkable state.

---

## 🤖 HELIOS Oracle — Gemini brain with physics fallback

```mermaid
flowchart TD
    Q(["💬 POST /api/oracle<br/>{question, kp, wind, bz, lat}"]) --> CTX["📦 attach live context<br/>storm level · grid risk<br/>aurora verdict"]
    CTX --> KEY{"GEMINI_API_KEY<br/>configured?"}
    KEY -- yes --> GEM["✨ Gemini 3.5 Flash<br/>free tier · server-side only<br/>NOW / IMPACTS / TONIGHT<br/>under 180 words"]
    GEM --> GOK{"answer<br/>returned?"}
    GOK -- yes --> OUT(["✅ mode: gemini"])
    KEY -- no --> PHYS
    GOK -- no / timeout --> PHYS["🧮 physics engine<br/>stormLevel() · gridRisk()<br/>auroraVerdict() — zero keys"]
    PHYS --> OUT2(["✅ mode: physics-engine"])

    classDef q fill:#312e81,stroke:#a78bfa,color:#fff
    classDef dec fill:#78350f,stroke:#fbbf24,color:#fff
    classDef gem fill:#1e40af,stroke:#60a5fa,color:#fff
    classDef phys fill:#0f766e,stroke:#5eead4,color:#fff
    classDef out fill:#065f46,stroke:#34d399,color:#fff
    class Q q
    class KEY,GOK dec
    class GEM gem
    class CTX,PHYS phys
    class OUT,OUT2 out
```

The key lives **only** in the Vercel Production env (Secret) and local `.env.local` (gitignored) — it is never committed, never shipped to the browser.

---

## 🌐 Interactive 3D globe — community-grade, not hand-rolled

Built on **[react-globe.gl](https://github.com/vasturiano/react-globe.gl)** (three.js) with community-standard `three-globe` earth textures (night lights + topology). Orbit controls, clickable magnitude points, expanding selection rings and animated fly-to come from the library — no custom WebGL math.

```mermaid
flowchart TD
    DRAG["🖱️ drag"] --> ORBIT["🌍 orbit controls<br/>rotate · damping"]
    WHEEL["🎡 scroll / pinch"] --> ZOOM["🔍 zoom 0.85–3.2x"]
    CLICK["👆 click quake point"] --> SEL["🎯 select → white dot<br/>+ expanding ring + detail card"]
    SEL --> FLY["✈️ pointOfView()<br/>animated fly-to 1.2s"]
    ROW["📋 click quake row"] --> FLY
    KP["☀️ live Kp"] --> ATM["🌈 atmosphere color<br/>indigo → violet → magenta"]
    IDLE["😴 2.5s idle"] --> SPIN["🌀 auto-rotate resumes"]

    classDef act fill:#4c1d95,stroke:#a78bfa,color:#fff
    classDef fx fill:#7c2d12,stroke:#fb923c,color:#fff
    classDef live fill:#065f46,stroke:#34d399,color:#fff
    class DRAG,WHEEL,CLICK,ROW act
    class ORBIT,ZOOM,SEL,FLY,SPIN fx
    class KP,ATM,IDLE live
```

---

## 🧩 MCP — give your agent eyes on the Sun

```mermaid
flowchart LR
    AG["🤖 Claude / Cursor / Codex"] -- "GET /api/mcp" --> MAN["📜 manifest<br/>tools + JSON schemas"]
    MAN --> PICK{"pick a tool"}
    PICK -- "helios.space_weather" --> SW["☀️ Kp · wind · Bz · X-ray"]
    PICK -- "helios.aurora_verdict" --> AV["🌌 {latitude, kp} verdict"]
    PICK -- "helios.quakes" --> QK["🌍 recent quakes"]
    PICK -- "helios.ask_oracle" --> OR["🤖 plain-English briefing"]
    SW --> DONE(["✅ agent answers<br/>with live sky"])
    AV --> DONE
    QK --> DONE
    OR --> DONE

    classDef ag fill:#312e81,stroke:#a78bfa,color:#fff
    classDef man fill:#78350f,stroke:#fbbf24,color:#fff
    classDef tool fill:#0c4a6e,stroke:#38bdf8,color:#fff
    classDef done fill:#065f46,stroke:#34d399,color:#fff
    class AG ag
    class MAN,PICK man
    class SW,AV,QK,OR tool
    class DONE done
```

---

## ✨ What you get

| | |
|---|---|
| 🌍 **Interactive 3D globe** | `react-globe.gl` + three.js — orbit, zoom, click-to-select quakes, animated fly-to, storm-reactive atmosphere |
| 🔴 **Live room** (`/live`) | Kp · wind · Bz · X-ray class · grid-stress + per-feed health dots (NOAA SWPC, 60s cache) |
| 📈 **Storm tapes** | 2-hour Kp / wind / Bz sparklines + GOES X-ray flux + OVATION aurora advisories |
| 🌌 **Aurora planner** (`/aurora`) | Latitude slider + presets, 0–100 verdict, oval-edge visual, G-scale decoder |
| 🌍 **Quake explorer** (`/quakes`) | Magnitude filters, rows that fly the globe, USGS detail cards |
| 🤖 **HELIOS Oracle** (`/oracle`) | Gemini 3.5 Flash briefings; physics-engine fallback with zero keys |
| 🧩 **REST + MCP** (`/developers`) | `/api/space-weather` · `/api/earthquakes` · `/api/oracle` · `/api/mcp` — live-try playground |
| ▲ **100% Next.js 16** | App Router routes, Route Handlers, metadata, `sitemap.xml` + `robots.txt` — no plain-React shell |

---

## 🛰️ Data sources (all keyless, all open)

- **NOAA SWPC** — planetary Kp 1-min, GOES X-ray 6h, RTSW solar-wind + mag 1-min, OVATION aurora latest
- **USGS** — FDSN earthquake catalog M4.5+ / 72h
- Proxied + edge-cached by Next.js Route Handlers (`/api/*`) so the UI never CORS-fails and never hammers upstream

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

---

## 🗺️ Roadmap — step by step, every phase charted

### ✅ Step 1 — Interactive 3D globe (shipped)

1. Evaluated community 3D globe libraries (cobe → react-globe.gl).
2. Integrated `react-globe.gl` + three.js with night-lights + topology textures.
3. Wired quake points (color/size by magnitude), tooltips, click-select.
4. Added selection rings + `pointOfView` fly-to + idle auto-rotate.

```mermaid
flowchart LR
    EVAL(["① evaluate libs"]) --> INT["② integrate react-globe.gl"]
    INT --> PTS["③ quake points<br/>color × size × tooltip"]
    PTS --> SEL["④ click → ring + card"]
    SEL --> FLY["⑤ rows + markers → fly-to"]

    classDef done fill:#065f46,stroke:#34d399,color:#fff
    class EVAL,INT,PTS,SEL,FLY done
```

### ✅ Step 2 — Real routes, full Next.js (shipped)

1. Moved every section off hash-anchors onto App Router routes.
2. Shared `SiteNav`/`SiteFooter` chrome + `useHelios` data hook.
3. Deep-linkable state (`/oracle?q=…`), per-route metadata, `sitemap.xml` + `robots.txt`.

```mermaid
flowchart LR
    A(["① routes: /live /aurora<br/>/quakes /oracle /developers"]) --> B["② shared chrome + hook"]
    B --> C["③ deep links + metadata"]
    C --> D["④ sitemap + robots"]

    classDef done fill:#065f46,stroke:#34d399,color:#fff
    class A,B,C,D done
```

### ✅ Step 3 — Gemini Oracle (shipped)

1. Replaced OpenAI with Gemini 3.5 Flash (free tier, REST + `x-goog-api-key`).
2. Server-side only; physics-engine fallback preserved.
3. Key in Vercel Production secret + gitignored `.env.local`.

```mermaid
flowchart LR
    A(["① swap OpenAI → Gemini"]) --> B["② server-side route"]
    B --> C["③ fallback engine kept"]
    C --> D["④ secret in Vercel env"]

    classDef done fill:#065f46,stroke:#34d399,color:#fff
    class A,B,C,D done
```

### ✅ Step 4 — Open API + MCP (shipped)

1. Four documented endpoints with edge caching.
2. MCP manifest + dispatcher for Claude/Cursor/Codex.
3. Live-try playground on `/developers`.

```mermaid
flowchart LR
    A(["① 4 endpoints"]) --> B["② MCP manifest"]
    B --> C["③ playground page"]

    classDef done fill:#065f46,stroke:#34d399,color:#fff
    class A,B,C done
```

### 🔜 Step 5 — OVATION auroral-oval overlay

1. Parse `ovation_aurora_latest.json` coordinates (65k probability cells).
2. Downsample to a heat-point layer the globe can render at 60fps.
3. Toggle: oval overlay on/off; auto-show when Kp ≥ 5.
4. Legend: probability → color ramp + tonight's edge latitude.

```mermaid
flowchart TD
    F(["① fetch OVATION cells"]) --> D["② downsample grid"]
    D --> L["③ globe heat layer"]
    L --> T{"④ Kp ≥ 5?"}
    T -- yes --> ON["🌌 auto-show oval"]
    T -- no --> OFF["🔭 toggle available"]
    ON --> LEG["⑤ legend + edge latitude"]
    OFF --> LEG

    classDef next fill:#1e3a8a,stroke:#60a5fa,color:#fff
    classDef dec fill:#78350f,stroke:#fbbf24,color:#fff
    classDef out fill:#065f46,stroke:#34d399,color:#fff
    class F,D,L next
    class T dec
    class ON,OFF,LEG out
```

### 🔜 Step 6 — NASA DONKI CME / flare timeline

1. Proxy DONKI CME + SolarFlare endpoints (demo key → user key).
2. Timeline cards: speed, source location, Earth-impact probability.
3. Link CMEs to Kp spikes on the storm tapes.

```mermaid
flowchart LR
    A(["① proxy DONKI"]) --> B["② CME + flare cards"]
    B --> C["③ impact probability"]
    C --> D["④ link to Kp spikes"]

    classDef next fill:#7c2d12,stroke:#fb923c,color:#fff
    class A,B,C,D next
```

### 🔜 Step 7 — Push alerts for Kp ≥ 6

1. WebPush subscription keyed to user latitude.
2. Server cron checks Kp every 5 min.
3. Push only when oval edge reaches the user's latitude band.
4. Quiet hours + unsubscribe in one tap.

```mermaid
flowchart TD
    S(["① subscribe + latitude"]) --> C["② cron checks Kp / 5 min"]
    C --> R{"③ Kp ≥ 6 near user?"}
    R -- yes --> P["🔔 push aurora alert"]
    R -- no --> W["😴 stay quiet"]
    P --> Q{"④ quiet hours?"}
    Q -- yes --> W
    Q -- no --> SEND(["✅ delivered"])

    classDef next fill:#4c1d95,stroke:#a78bfa,color:#fff
    classDef dec fill:#78350f,stroke:#fbbf24,color:#fff
    classDef out fill:#065f46,stroke:#34d399,color:#fff
    class S,C next
    class R,Q dec
    class P,W,SEND out
```

### 🔜 Step 8 — Crowd aurora sightings

1. One-tap "I see it!" with geolocation + photo optional.
2. Server validates against live Kp/oval plausibility.
3. Cluster sightings; render as green dots on the globe.
4. Sightings feed powers "confirmed overhead" badges.

```mermaid
flowchart LR
    A(["① user reports sighting"]) --> B["② plausibility check<br/>vs live Kp + oval"]
    B --> C{"believable?"}
    C -- yes --> D["③ cluster + globe dots"]
    C -- no --> E["④ gentle reject<br/>with explanation"]
    D --> F(["✅ confirmed-overhead badges"])

    classDef next fill:#065f46,stroke:#34d399,color:#fff
    classDef dec fill:#78350f,stroke:#fbbf24,color:#fff
    classDef out fill:#0f766e,stroke:#5eead4,color:#fff
    class A,B next
    class C dec
    class D,E,F out
```

PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). Good first issues: `aurora-oval`, `donki-timeline`, `webpush`, `og-cards`, `crowd-sightings`.

---

## ⚠️ Honest science

- For life-safety decisions always follow **NOAA SWPC** + local authorities — HELIOS is an educational lens, not an official alert feed.
- Decades of research find **no reliable causal link between solar storms and earthquakes**; we display both so you can watch, not to imply causation.

## 📜 License

MIT © aniruddhaadak80 — the Sun belongs to everyone.

---

<div align="center">

**If HELIOS helped you catch an aurora or dodge a storm — give it a ★ and tell someone under dark skies.** 🌌

</div>

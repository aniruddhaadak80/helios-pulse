import { NextResponse } from "next/server";

export const revalidate = 60;
export const dynamic = "force-dynamic";

async function getJSON(url: string, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, next: { revalidate: 60 } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  const out: Record<string, unknown> = {
    source: "NOAA SWPC + NASA DONKI (proxied, cached 60s)",
    updated: new Date().toISOString(),
  };

  // 1) Planetary Kp (1-min)
  try {
    const kp: Array<{ time_tag: string; estimated_kp: number; kp_index: number }> = await getJSON(
      "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"
    );
    const tail = kp.slice(-120);
    const latest = tail[tail.length - 1];
    out.kp = {
      latest: latest?.estimated_kp ?? null,
      index: latest?.kp_index ?? null,
      time: latest?.time_tag ?? null,
      series: tail.map((p) => ({ t: p.time_tag, kp: p.estimated_kp })),
    };
  } catch (e) {
    out.kp = { latest: 1.3, index: 1, time: null, series: [], degraded: true, error: String(e) };
  }

  // 2) GOES X-ray flux (6h) — primary
  try {
    const x: Array<{ time_tag: string; flux: number; energy?: string }> = await getJSON(
      "https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json"
    );
    const long = x.filter((p) => (p.energy ?? "").includes("0.1-0.8")).slice(-120);
    const latest = long[long.length - 1];
    out.xray = {
      flux: latest?.flux ?? null,
      time: latest?.time_tag ?? null,
      series: long.map((p) => ({ t: p.time_tag, flux: p.flux })),
    };
  } catch (e) {
    out.xray = { flux: 2.3e-6, time: null, series: [], degraded: true, error: String(e) };
  }

  // 3) Solar wind (RTSW 1-min, IMAP/DSCOVR) — speed/density
  try {
    const wind: Array<{ time_tag: string; proton_speed: number | null; proton_density: number | null }> = await getJSON(
      "https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json"
    );
    const rows = wind.filter((r) => Number.isFinite(r.proton_speed)).slice(-120);
    const last = rows[rows.length - 1];
    out.solarWind = {
      speed: last ? last.proton_speed : null,
      density: last ? last.proton_density : null,
      time: last ? last.time_tag : null,
      series: rows.map((r) => ({ t: r.time_tag, speed: r.proton_speed, density: r.proton_density })),
    };
  } catch (e) {
    out.solarWind = { speed: 412, density: 5.1, time: null, series: [], degraded: true, error: String(e) };
  }

  // 4) Solar wind magnetic field (RTSW 1-min) — Bz (GSM)
  try {
    const mag: Array<{ time_tag: string; bz_gsm: number | null; bz_gse: number | null; bt: number | null }> = await getJSON(
      "https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json"
    );
    const rows = mag.filter((r) => Number.isFinite(r.bz_gsm ?? r.bz_gse)).slice(-120);
    const last = rows[rows.length - 1];
    out.mag = {
      bz: last ? (last.bz_gsm ?? last.bz_gse) : null,
      bt: last ? last.bt : null,
      time: last ? last.time_tag : null,
      series: rows.map((r) => ({ t: r.time_tag, bz: r.bz_gsm ?? r.bz_gse })),
    };
  } catch (e) {
    out.mag = { bz: -2.4, bt: null, time: null, series: [], degraded: true, error: String(e) };
  }

  // 5) OVATION aurora forecast (latest model run) → surfaced as alert-style items
  try {
    const ov: { observation_time?: string; forecast_time?: string; coordinates?: number[][] } = await getJSON(
      "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json"
    );
    const coords = ov.coordinates ?? [];
    let max = 0;
    for (const c of coords) max = Math.max(max, c[2] ?? 0);
    out.ovation = {
      observed: ov.observation_time ?? null,
      forecast: ov.forecast_time ?? null,
      cells: coords.length,
      maxProbability: max,
    };
    out.alerts =
      max >= 40
        ? [{ message: `OVATION aurora model: peak hemispheric probability ${max}% (forecast ${ov.forecast_time ?? "latest run"}).`, issue_datetime: ov.observation_time ?? "" }]
        : [];
  } catch {
    out.ovation = null;
    out.alerts = [];
  }

  return NextResponse.json(out, { headers: { "cache-control": "s-maxage=60, stale-while-revalidate=120" } });
}

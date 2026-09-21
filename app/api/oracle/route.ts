import { NextResponse } from "next/server";
import { auroraVerdict, gridRisk, stormLevel } from "@/lib/helio";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
].filter((m, i, a) => m && a.indexOf(m) === i);

async function askGemini(
  prompt: string,
  apiKey: string
): Promise<{ text: string; model: string } | { errors: string[] }> {
  const errors: string[] = [];
  for (const model of GEMINI_MODELS) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          signal: ctrl.signal,
          headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 500 },
          }),
        }
      );
      if (!r.ok) {
        const tag = `${model}: HTTP ${r.status}`;
        console.error(`[helios-oracle] ${tag}`);
        errors.push(tag);
        continue; // 429/503/404 → try next model in the chain
      }
      const j = await r.json();
      const parts = j.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p: { text?: string }) => p.text ?? "").join("").trim();
      if (text) return { text, model };
    } catch (e) {
      const tag = `${model}: ${e instanceof Error && e.name === "AbortError" ? "timeout" : "network-fail"}`;
      console.error(`[helios-oracle] ${tag}`);
      errors.push(tag);
      // timeout/network → try next model
    } finally {
      clearTimeout(t);
    }
  }
  return { errors };
}

/**
 * HELIOS Oracle — plain-English space-weather intelligence.
 * Primary brain: Gemini 3.5 Flash (free tier, server-side key).
 * Always-on fallback: built-in physics engine (works with zero keys).
 */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const question = String(body.question ?? "Brief me on current space weather risks.");
  const kp = Number(body.kp ?? 1.5);
  const wind = Number(body.wind ?? 410);
  const bz = body.bz === null || body.bz === undefined ? null : Number(body.bz);
  const lat = body.lat === undefined || body.lat === null ? null : Number(body.lat);
  const quakes = Array.isArray(body.quakes) ? body.quakes.length : 0;

  const storm = stormLevel(kp);
  const risk = gridRisk(kp, wind, bz);
  const aurora = lat !== null && Number.isFinite(lat) ? auroraVerdict(kp, lat) : null;

  const context = [
    `Current readings: Kp ${kp.toFixed(1)} (${storm.label}, ${storm.scale}), solar wind ${wind.toFixed(0)} km/s, ` +
      `IMF Bz ${bz !== null ? `${bz.toFixed(1)} nT` : "unknown"}, grid stress ${risk.level} (${risk.score}/100).`,
    aurora ? `User latitude ${lat!.toFixed(1)}°: aurora score ${aurora.score}/100. ${aurora.text}` : `User latitude unknown.`,
    `Seismic context: ${quakes} notable M4.5+ quakes in last 72h (shown alongside; no proven causal link to space weather).`,
  ].join("\n");

  const key = process.env.GEMINI_API_KEY;
  let geminiErrors: string[] = [];
  if (key) {
    const hit = await askGemini(
      `You are HELIOS ORACLE, a terse space-weather intelligence officer. Answer in under 180 words, plain English, ` +
        `with 3 sections: NOW / IMPACTS (grid, GPS/aviation, aurora) / TONIGHT. ` +
        `Never claim earthquakes are caused by solar activity.\n\nLive context:\n${context}\n\nUser question: ${question}`,
      key
    );
    if ("text" in hit)
      return NextResponse.json({ answer: hit.text, mode: "gemini", model: hit.model, kp, risk });
    geminiErrors = hit.errors;
  } else {
    geminiErrors = ["no GEMINI_API_KEY configured"];
  }

  const engineBrief = [
    `HELIOS ORACLE · ${new Date().toUTCString().slice(5, 22)} UTC`,
    ``,
    `GEOMAGNETIC: Kp ${kp.toFixed(1)} — ${storm.label} (${storm.scale}). ${storm.advice}`,
    `SOLAR WIND: ${wind.toFixed(0)} km/s${bz !== null ? `, Bz ${bz.toFixed(1)} nT` : ""}. Grid stress: ${risk.level} (${risk.score}/100).`,
    aurora ? `AURORA @ ${lat!.toFixed(1)}°: ${aurora.text}` : `AURORA: tell me your latitude (e.g. "aurora at 52.5") for a personal visibility verdict.`,
    `SEISMIC CONTEXT: ${quakes} notable M4.5+ quakes in the last 72h tracked on the Quakes page. (Science note: no proven causal link between space weather and earthquakes — HELIOS shows both so you can judge.)`,
    ``,
    `Q: ${question}`,
  ].join("\n");

  return NextResponse.json({ answer: engineBrief, mode: "physics-engine", kp, risk, geminiErrors });
}

export async function GET() {
  return NextResponse.json({
    name: "HELIOS Oracle",
    brain: `Gemini chain [${GEMINI_MODELS.join(" → ")}] (free tier) with physics-engine fallback`,
    usage: "POST { question, kp, wind, bz, lat } → plain-English briefing",
    example: { question: "Can I see aurora at 52.5° tonight?", kp: 5.2, wind: 610, bz: -12, lat: 52.5 },
  });
}

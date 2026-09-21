import { NextResponse } from "next/server";
import { auroraVerdict, gridRisk, stormLevel } from "@/lib/helio";

export const dynamic = "force-dynamic";

/**
 * HELIOS Oracle — plain-English space-weather intelligence.
 * Works fully offline with the built-in physics engine; if OPENAI_API_KEY
 * is set it upgrades to a live LLM briefing.
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

  const engineBrief = [
    `HELIOS ORACLE · ${new Date().toUTCString().slice(5, 22)} UTC`,
    ``,
    `GEOMAGNETIC: Kp ${kp.toFixed(1)} — ${storm.label} (${storm.scale}). ${storm.advice}`,
    `SOLAR WIND: ${wind.toFixed(0)} km/s${bz !== null ? `, Bz ${bz.toFixed(1)} nT` : ""}. Grid stress: ${risk.level} (${risk.score}/100).`,
    aurora ? `AURORA @ ${lat!.toFixed(1)}°: ${aurora.text}` : `AURORA: tell me your latitude (e.g. "aurora at 52.5") for a personal visibility verdict.`,
    `SEISMIC CONTEXT: ${quakes} notable M4.5+ quakes in the last 72h tracked below. (Science note: no proven causal link between space weather and earthquakes — HELIOS shows both so you can judge.)`,
    ``,
    `Q: ${question}`,
  ].join("\n");

  // Optional LLM upgrade
  const key = process.env.OPENAI_API_KEY;
  if (key) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.4,
          max_tokens: 450,
          messages: [
            {
              role: "system",
              content:
                "You are HELIOS ORACLE, a terse space-weather intelligence officer. Answer in <180 words, plain English, with 3 sections: NOW / IMPACTS (grid, GPS/aviation, aurora) / TONIGHT. Never claim earthquakes are caused by solar activity.",
            },
            { role: "user", content: `Context:\n${engineBrief}\n\nQuestion: ${question}` },
          ],
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const text = j.choices?.[0]?.message?.content ?? engineBrief;
        return NextResponse.json({ answer: text, mode: "llm+physics", kp, risk });
      }
    } catch {
      // fall through to engine brief
    }
  }

  return NextResponse.json({ answer: engineBrief, mode: "physics-engine", kp, risk });
}

export async function GET() {
  return NextResponse.json({
    name: "HELIOS Oracle",
    usage: "POST { question, kp, wind, bz, lat } → plain-English briefing",
    example: { question: "Can I see aurora at 52.5° tonight?", kp: 5.2, wind: 610, bz: -12, lat: 52.5 },
  });
}

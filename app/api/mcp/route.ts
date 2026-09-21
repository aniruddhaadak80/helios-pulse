import { NextResponse } from "next/server";

/** MCP + REST manifest so AI agents can consume HELIOS as a tool. */
export async function GET() {
  return NextResponse.json({
    name: "helios-pulse",
    version: "1.0.0",
    description:
      "Live Solar Maximum 2026 planetary intelligence: Kp, solar wind, X-ray flares, aurora verdicts, earthquakes, grid risk.",
    protocol: "mcp-like JSON over HTTPS (no auth)",
    endpoints: {
      spaceWeather: { method: "GET", path: "/api/space-weather", returns: "kp, xray, solarWind, mag, alerts" },
      earthquakes: { method: "GET", path: "/api/earthquakes?minmag=4.5&limit=30&hours=72" },
      oracle: { method: "POST", path: "/api/oracle", body: "{question, kp, wind, bz, lat}" },
    },
    tools: [
      {
        name: "helios.space_weather",
        description: "Get current Kp, solar wind speed/density, Bz, X-ray flux and active NOAA alerts.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
      },
      {
        name: "helios.aurora_verdict",
        description: "Aurora visibility verdict for a latitude given current Kp.",
        inputSchema: {
          type: "object",
          properties: { latitude: { type: "number" }, kp: { type: "number" } },
          required: ["latitude", "kp"],
        },
      },
      {
        name: "helios.quakes",
        description: "Recent significant earthquakes (USGS).",
        inputSchema: {
          type: "object",
          properties: { minmag: { type: "number" }, limit: { type: "number" } },
        },
      },
      {
        name: "helios.ask_oracle",
        description: "Ask the HELIOS Oracle for a plain-English risk briefing.",
        inputSchema: {
          type: "object",
          properties: { question: { type: "string" } },
          required: ["question"],
        },
      },
    ],
  });
}

export async function POST(req: Request) {
  // Minimal JSON-RPC-style dispatcher for agent clients
  let body: { tool?: string; args?: Record<string, number | string> } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const base = new URL(req.url).origin;
  if (body.tool === "helios.space_weather") {
    const r = await fetch(`${base}/api/space-weather`);
    return NextResponse.json({ result: await r.json() });
  }
  if (body.tool === "helios.quakes") {
    const r = await fetch(`${base}/api/earthquakes?minmag=4.5&limit=20&hours=72`);
    return NextResponse.json({ result: await r.json() });
  }
  if (body.tool === "helios.ask_oracle") {
    const r = await fetch(`${base}/api/oracle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: String(body.args?.question ?? "Brief me.") }),
    });
    return NextResponse.json({ result: await r.json() });
  }
  return NextResponse.json(
    { error: "unknown tool", tools: ["helios.space_weather", "helios.quakes", "helios.ask_oracle"] },
    { status: 400 }
  );
}

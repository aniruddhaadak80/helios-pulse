import { NextResponse } from "next/server";

export const revalidate = 120;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const minmag = searchParams.get("minmag") ?? "4.5";
  const limit = searchParams.get("limit") ?? "30";
  const hours = Number(searchParams.get("hours") ?? "72");

  const start = new Date(Date.now() - hours * 3600 * 1000).toISOString().slice(0, 10);
  const url =
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson` +
    `&starttime=${start}&minmagnitude=${encodeURIComponent(minmag)}` +
    `&limit=${encodeURIComponent(limit)}&orderby=time`;

  try {
    const r = await fetch(url, { next: { revalidate: 120 } });
    if (!r.ok) throw new Error(`USGS HTTP ${r.status}`);
    const j = await r.json();
    const quakes = (j.features ?? []).map((f: Record<string, unknown>) => {
      const props = f.properties as Record<string, unknown>;
      const geom = f.geometry as { coordinates: number[] };
      return {
        id: f.id,
        mag: props.mag,
        place: props.place,
        time: props.time,
        url: props.url,
        tsunami: props.tsunami,
        alert: props.alert,
        coords: { lon: geom.coordinates[0], lat: geom.coordinates[1], depth: geom.coordinates[2] },
      };
    });
    return NextResponse.json(
      { source: "USGS Earthquake Hazards Program", count: quakes.length, quakes },
      { headers: { "cache-control": "s-maxage=120, stale-while-revalidate=240" } }
    );
  } catch (e) {
    return NextResponse.json(
      { source: "USGS (degraded)", count: 0, quakes: [], error: String(e) },
      { status: 200 }
    );
  }
}

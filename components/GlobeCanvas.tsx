"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";

export type GlobeQuake = {
  id: string;
  mag: number;
  place?: string;
  coords: { lat: number; lon: number };
};

export type GlobeFocus = { lat: number; lon: number; nonce: number };

type Props = {
  kp: number;
  quakes: GlobeQuake[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  focus?: GlobeFocus | null;
  spin?: boolean;
};

type Pt = { id: string; lat: number; lng: number; mag: number; place: string };

const TEXTURES = "https://unpkg.com/three-globe/example/img";

function magColor(mag: number): string {
  if (mag >= 6) return "#f43f5e";
  if (mag >= 5) return "#fb923c";
  return "#facc15";
}

/** Kp storm factor 0..1 → atmosphere color indigo → violet → magenta. */
function atmosphereColor(kp: number): string {
  const t = Math.min(1, Math.max(0, (kp - 1) / 7));
  const stops: [number, number, number][] = [
    [99, 102, 241],
    [168, 85, 247],
    [244, 63, 94],
  ];
  const seg = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
  const k = t * (stops.length - 1) - seg;
  const c = stops[seg].map((v, i) => Math.round(v + (stops[seg + 1][i] - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export default function GlobeCanvas({ kp, quakes, selectedId, onSelect, focus, spin = true }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = Math.min(720, el.clientWidth);
      setDim({ w, h: w });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls();
    controls.autoRotate = spin;
    controls.autoRotateSpeed = 0.55;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    const el: HTMLElement = g.renderer().domElement;
    const stop = () => {
      controls.autoRotate = false;
    };
    el.addEventListener("pointerdown", stop, { once: true });
    return () => el.removeEventListener("pointerdown", stop);
  }, [spin, dim.w]);

  useEffect(() => {
    if (focus && globeRef.current && dim.w > 0) {
      globeRef.current.pointOfView({ lat: focus.lat, lng: focus.lon, altitude: 1.3 }, 1200);
    }
  }, [focus, dim.w]);

  const points: Pt[] = useMemo(
    () =>
      quakes.slice(0, 40).map((q) => ({
        id: q.id,
        lat: q.coords.lat,
        lng: q.coords.lon,
        mag: q.mag,
        place: q.place ?? "",
      })),
    [quakes]
  );

  const rings = useMemo(
    () => quakes.filter((q) => q.id === selectedId).map((q) => ({ lat: q.coords.lat, lng: q.coords.lon })),
    [quakes, selectedId]
  );

  const atmo = atmosphereColor(kp);

  return (
    <div ref={wrapRef} style={{ width: "100%", height: dim.h || 520, position: "relative" }}>
      {dim.w > 0 && (
        <Globe
          ref={globeRef}
          width={dim.w}
          height={dim.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={`${TEXTURES}/earth-night.jpg`}
          bumpImageUrl={`${TEXTURES}/earth-topology.png`}
          showAtmosphere
          atmosphereColor={atmo}
          atmosphereAltitude={0.2}
          pointsData={points}
          pointAltitude={(d) => 0.012 + Math.max(0, (d as Pt).mag - 4.5) * 0.02}
          pointRadius={0.34}
          pointColor={(d) => ((d as Pt).id === selectedId ? "#ffffff" : magColor((d as Pt).mag))}
          pointLabel={(d) => {
            const p = d as Pt;
            return `<div style="font:12px monospace;background:#000d;color:#ffe9c7;padding:6px 10px;border-radius:8px"><b>M${p.mag.toFixed(1)}</b> · ${p.place}</div>`;
          }}
          onPointClick={(d) => onSelect?.((d as Pt).id)}
          onGlobeClick={() => onSelect?.(null)}
          ringsData={rings}
          ringColor={() => (t: number) => `rgba(255,140,90,${Math.max(0, 1 - t).toFixed(3)})`}
          ringMaxRadius={5}
          ringPropagationSpeed={1.8}
          ringRepeatPeriod={800}
        />
      )}
    </div>
  );
}

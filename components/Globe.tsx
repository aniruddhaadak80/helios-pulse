"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

type Quake = { id: string; mag: number; coords: { lat: number; lon: number } };

export default function Globe({ kp, quakes }: { kp: number; quakes: Quake[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ kp, quakes });
  stateRef.current = { kp, quakes };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let phi = 0;
    let raf = 0;
    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: 640,
      height: 640,
      phi: 0,
      theta: 0.32,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.08, 0.1, 0.28],
      markerColor: [0.98, 0.55, 0.2],
      glowColor: [0.35, 0.12, 0.5],
      markers: [],
    });
    const tick = () => {
      phi += 0.0022;
      const { kp: k, quakes: q } = stateRef.current;
      const storm = Math.min(1, Math.max(0, (k - 1) / 7));
      globe.update({
        phi,
        glowColor: [0.25 + storm * 0.55, 0.1 + storm * 0.1, 0.55 - storm * 0.2],
        markers: q.slice(0, 24).map((e) => ({
          location: [e.coords.lat, e.coords.lon] as [number, number],
          size: Math.min(0.12, 0.03 + Number(e.mag) * 0.012),
        })),
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = Math.min(640, parent.clientWidth);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${w}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      globe.destroy();
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <div className="sun-rays pointer-events-none absolute inset-[-8%] rounded-full opacity-60" />
      <canvas ref={canvasRef} style={{ width: "100%", height: "auto", aspectRatio: "1" }} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="absolute h-[72%] w-[72%] rounded-full border border-orange-400/20"
          style={{ animation: "pulse-ring 3.2s ease-out infinite" }}
        />
      </div>
    </div>
  );
}

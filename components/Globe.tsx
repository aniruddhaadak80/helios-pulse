"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

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
  onSelect?: (id: string | null, quake?: GlobeQuake | null) => void;
  focus?: GlobeFocus | null;
  spin?: boolean;
};

const D2R = Math.PI / 180;

/** Marker [lat,lon] → cobe world vector (decoded from cobe source). */
function toVec(lat: number, lon: number): [number, number, number] {
  const r = lat * D2R;
  const a = lon * D2R - Math.PI;
  const o = Math.cos(r);
  return [-o * Math.sin(a), Math.sin(r), o * Math.cos(a)];
}

/** World vector → canvas fractions using current view (decoded from cobe source). */
function project(
  v: [number, number, number],
  view: { phi: number; theta: number; scale: number; aspect: number }
): { x: number; y: number; front: boolean } {
  const cf = Math.cos(view.phi);
  const sf = Math.sin(view.phi);
  const cl = Math.cos(view.theta);
  const sl = Math.sin(view.theta);
  const c = cf * v[0] + sf * v[2];
  const s = sf * sl * v[0] + cl * v[1] - cf * sl * v[2];
  const zp = -sf * cl * v[0] + sl * v[1] + cf * cl * v[2];
  return {
    x: ((c * view.scale) / view.aspect + 1) / 2,
    y: (-s * view.scale + 1) / 2,
    front: zp > 0.02,
  };
}

/** View that centers [lat,lon] on screen. */
function viewFor(lat: number, lon: number): { phi: number; theta: number } {
  return {
    phi: lon * D2R + Math.PI,
    theta: Math.max(-1.15, Math.min(1.15, lat * D2R)),
  };
}

function shortestDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function magColor(mag: number): [number, number, number] {
  if (mag >= 6) return [1, 0.25, 0.35];
  if (mag >= 5) return [1, 0.55, 0.2];
  return [1, 0.75, 0.3];
}

/**
 * Fully interactive cobe globe: drag to rotate, scroll to zoom,
 * click quake markers to select, programmatic fly-to, auto-spin.
 */
export default function Globe({ kp, quakes, selectedId, onSelect, focus, spin = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ kp, quakes, selectedId: selectedId ?? null });
  stateRef.current = { kp, quakes, selectedId: selectedId ?? null };
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const spinRef = useRef(spin);
  spinRef.current = spin;

  // fly-to request (nonce-guarded)
  const focusRef = useRef<GlobeFocus | null>(null);
  if (focus && focus.nonce !== (focusRef.current?.nonce ?? -1)) focusRef.current = focus;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let phi = 2.6;
    let theta = 0.32;
    let scale = 1;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let downX = 0;
    let downY = 0;
    let lastInteract = 0;
    let raf = 0;
    let fly: { p0: number; p1: number; t0: number; t1: number; start: number; dur: number } | null = null;
    let seenFocus = -1;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: 640,
      height: 640,
      phi,
      theta,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.08, 0.1, 0.28],
      markerColor: [0.98, 0.55, 0.2],
      glowColor: [0.35, 0.12, 0.5],
      markers: [],
    });

    const viewOf = () => {
      const rect = canvas.getBoundingClientRect();
      return { phi, theta, scale, aspect: rect.width / Math.max(1, rect.height) };
    };

    const toPx = (e: PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height };
    };

    const hitTest = (px: number, py: number, w: number, h: number): GlobeQuake | null => {
      const view = viewOf();
      let best: GlobeQuake | null = null;
      let bestD = 30; // px threshold
      for (const q of stateRef.current.quakes.slice(0, 30)) {
        const p = project(toVec(q.coords.lat, q.coords.lon), view);
        if (!p.front) continue;
        const dx = p.x * w - px;
        const dy = p.y * h - py;
        const d = Math.hypot(dx, dy);
        if (d < bestD) {
          bestD = d;
          best = q;
        }
      }
      return best;
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      fly = null;
      lastInteract = performance.now();
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        phi += dx * 0.005;
        theta = Math.max(-1.25, Math.min(1.25, theta + dy * 0.004));
        lastInteract = performance.now();
      } else {
        const { x, y, w, h } = toPx(e);
        canvas.style.cursor = hitTest(x, y, w, h) ? "pointer" : "grab";
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      lastInteract = performance.now();
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved < 6) {
        const { x, y, w, h } = toPx(e);
        const hit = hitTest(x, y, w, h);
        selectRef.current?.(hit ? hit.id : null, hit);
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scale = Math.max(0.85, Math.min(3.2, scale * Math.exp(-e.deltaY * 0.0012)));
      lastInteract = performance.now();
    };
    const onDbl = () => {
      scale = 1;
      theta = 0.32;
      lastInteract = performance.now();
    };

    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("dblclick", onDbl);

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const tick = () => {
      const now = performance.now();
      // fly-to request?
      const f = focusRef.current;
      if (f && f.nonce !== seenFocus) {
        seenFocus = f.nonce;
        const target = viewFor(f.lat, f.lon);
        fly = { p0: phi, p1: phi + shortestDelta(phi, target.phi), t0: theta, t1: target.theta, start: now, dur: 1400 };
      }
      if (fly) {
        const t = Math.min(1, (now - fly.start) / fly.dur);
        const k = ease(t);
        phi = fly.p0 + (fly.p1 - fly.p0) * k;
        theta = fly.t0 + (fly.t1 - fly.t0) * k;
        if (t >= 1) fly = null;
        lastInteract = now;
      } else if (spinRef.current && !dragging && now - lastInteract > 2500) {
        phi += 0.0022;
      }

      const { kp: k, quakes: q, selectedId: sel } = stateRef.current;
      const storm = Math.min(1, Math.max(0, (k - 1) / 7));
      globe.update({
        phi,
        theta,
        scale,
        glowColor: [0.25 + storm * 0.55, 0.1 + storm * 0.1, 0.55 - storm * 0.2],
        markers: q.slice(0, 30).map((m) => ({
          id: m.id,
          location: [m.coords.lat, m.coords.lon] as [number, number],
          size: m.id === sel ? 0.11 : Math.min(0.07, 0.025 + Number(m.mag) * 0.009),
          color: m.id === sel ? [1, 1, 1] : magColor(Number(m.mag)),
        })),
      });

      // selected-marker chip (imperative overlay, 60fps-safe)
      const chip = chipRef.current;
      if (chip) {
        const selQ = q.find((m) => m.id === sel);
        if (selQ) {
          const rect = canvas.getBoundingClientRect();
          const p = project(toVec(selQ.coords.lat, selQ.coords.lon), viewOf());
          if (p.front) {
            chip.style.display = "flex";
            chip.style.left = `${p.x * 100}%`;
            chip.style.top = `${p.y * 100}%`;
          } else {
            chip.style.display = "none";
          }
        } else {
          chip.style.display = "none";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = Math.min(680, parent.clientWidth);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${w}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("dblclick", onDbl);
      globe.destroy();
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-[680px]">
      <div className="sun-rays pointer-events-none absolute inset-[-8%] rounded-full opacity-60" />
      <canvas ref={canvasRef} style={{ width: "100%", height: "auto", aspectRatio: "1" }} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="absolute h-[72%] w-[72%] rounded-full border border-orange-400/20"
          style={{ animation: "pulse-ring 3.2s ease-out infinite" }}
        />
      </div>
      <div
        ref={chipRef}
        style={{ display: "none" }}
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      >
        <div className="h-10 w-10 animate-ping rounded-full border-2 border-white/70" style={{ position: "absolute" }} />
        <div className="h-3 w-3 rounded-full bg-white shadow-[0_0_18px_6px_rgba(255,255,255,0.7)]" />
      </div>
    </div>
  );
}

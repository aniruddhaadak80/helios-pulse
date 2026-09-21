"use client";

import { useEffect, useRef } from "react";

/** Fixed cosmic starfield with twinkle + occasional meteors. Pure canvas, zero deps. */
export default function Starfield({ density = 220 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    type Star = { x: number; y: number; r: number; p: number; s: number; hue: number };
    let stars: Star[] = [];
    type Meteor = { x: number; y: number; vx: number; vy: number; life: number };
    let meteors: Meteor[] = [];

    const seed = () => {
      stars = Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        p: Math.random() * Math.PI * 2,
        s: 0.5 + Math.random() * 1.5,
        hue: Math.random() < 0.12 ? 30 : Math.random() < 0.2 ? 200 : 0,
      }));
    };
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const tick = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * st.s + st.p));
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fillStyle =
          st.hue === 0
            ? `rgba(255,255,255,${(0.5 * tw).toFixed(3)})`
            : `hsla(${st.hue},90%,75%,${(0.55 * tw).toFixed(3)})`;
        ctx.fill();
      }
      if (Math.random() < 0.006 && meteors.length < 3) {
        meteors.push({
          x: Math.random() * w * 0.8 + w * 0.1,
          y: Math.random() * h * 0.3,
          vx: -(4 + Math.random() * 4),
          vy: 2 + Math.random() * 2,
          life: 1,
        });
      }
      meteors = meteors.filter((m) => m.life > 0);
      for (const m of meteors) {
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.02;
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 12, m.y - m.vy * 12);
        grad.addColorStop(0, `rgba(255,240,220,${(0.8 * m.life).toFixed(3)})`);
        grad.addColorStop(1, "rgba(255,240,220,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 12, m.y - m.vy * 12);
        ctx.stroke();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0 opacity-70" aria-hidden />;
}

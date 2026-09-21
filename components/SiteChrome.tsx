"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun } from "lucide-react";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/live", label: "Live" },
  { href: "/aurora", label: "Aurora" },
  { href: "/quakes", label: "Quakes" },
  { href: "/oracle", label: "Oracle" },
  { href: "/developers", label: "API" },
];

export function SiteNav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#030014]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-600 shadow-lg shadow-orange-500/30">
            <Sun className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-[0.2em]">HELIOS PULSE</div>
            <div className="font-mono text-[10px] text-emerald-300">● LIVE · SOLAR MAX 2026</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 transition ${
                  active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/oracle" className="rounded-full bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2 text-sm font-semibold shadow-lg shadow-orange-500/25 hover:brightness-110">
            Ask Oracle
          </Link>
          <a href="https://github.com/aniruddhaadak80/helios-pulse" target="_blank" rel="noreferrer" className="glass rounded-full px-4 py-2 text-sm hover:bg-white/10">
            ★ Star
          </a>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 text-center">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-orange-400" />
          <span className="font-display text-sm font-bold tracking-[0.2em]">HELIOS PULSE</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="max-w-2xl text-sm text-slate-400">
          Data: NOAA Space Weather Prediction Center · USGS Earthquake Hazards · Open science, MIT-licensed.
          Not an official alert feed — for life-safety decisions always follow NOAA SWPC + local authorities.
        </p>
        <p className="font-mono text-[11px] text-slate-600">Built for Solar Cycle 25 maximum · Sep 2026 · by aniruddhaadak80 · PRs welcome ★</p>
      </div>
    </footer>
  );
}

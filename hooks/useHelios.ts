"use client";

import { useCallback, useEffect, useState } from "react";
import { FALLBACK, gridRisk, stormLevel, xrayClass } from "@/lib/helio";

export type SWPoint = { t: string; [k: string]: string | number | null };
export type SW = {
  kp?: { latest: number | null; series: { t: string; kp: number }[]; time?: string | null; degraded?: boolean };
  xray?: { flux: number | null; series: { t: string; flux: number }[]; degraded?: boolean };
  solarWind?: { speed: number | null; density: number | null; series: { t: string; speed: number }[]; degraded?: boolean };
  mag?: { bz: number | null; bt?: number | null; series: { t: string; bz: number }[]; degraded?: boolean };
  ovation?: { observed: string | null; forecast: string | null; cells: number; maxProbability: number } | null;
  alerts?: { message?: string; issue_datetime?: string }[];
};

export type Quake = {
  id: string;
  mag: number;
  place: string;
  time: number;
  url: string;
  tsunami: number;
  alert?: string | null;
  coords: { lat: number; lon: number; depth: number };
};

export function useHelios() {
  const [sw, setSw] = useState<SW | null>(null);
  const [quakes, setQuakes] = useState<Quake[]>([]);
  const [updated, setUpdated] = useState("—");
  const [syncing, setSyncing] = useState(true);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch("/api/space-weather").then((r) => r.json()),
        fetch("/api/earthquakes?minmag=4.5&limit=30&hours=72").then((r) => r.json()),
      ]);
      setSw(a);
      setQuakes(b.quakes ?? []);
      setUpdated(new Date().toUTCString().slice(5, 22) + " UTC");
    } catch {
      /* keep last good / fallbacks */
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 120000);
    return () => clearInterval(t);
  }, [load]);

  const kp = sw?.kp?.latest ?? FALLBACK.kp;
  const wind = sw?.solarWind?.speed ?? FALLBACK.windSpeed;
  const bz = sw?.mag?.bz ?? FALLBACK.bz;
  const flux = sw?.xray?.flux ?? FALLBACK.xrayFlux;

  return {
    sw,
    quakes,
    updated,
    live: sw !== null,
    syncing,
    kp,
    wind,
    bz,
    flux,
    storm: stormLevel(kp),
    risk: gridRisk(kp, wind, bz),
    xr: xrayClass(flux),
    refresh: load,
  };
}

export type Helios = ReturnType<typeof useHelios>;

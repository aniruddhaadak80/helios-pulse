export type StormLevel =
  | { label: "Quiet"; color: "#34d399"; scale: "G0"; advice: string }
  | { label: "Active"; color: "#a3e635"; scale: "G0"; advice: string }
  | { label: "Minor storm"; color: "#facc15"; scale: "G1"; advice: string }
  | { label: "Moderate storm"; color: "#fb923c"; scale: "G2"; advice: string }
  | { label: "Strong storm"; color: "#f43f5e"; scale: "G3"; advice: string }
  | { label: "Severe storm"; color: "#e11d48"; scale: "G4"; advice: string }
  | { label: "Extreme storm"; color: "#a855f7"; scale: "G5"; advice: string };

export function stormLevel(kp: number): StormLevel {
  if (kp < 3)
    return { label: "Quiet", color: "#34d399", scale: "G0", advice: "All systems nominal. Great night for deep-sky imaging." };
  if (kp < 4)
    return { label: "Active", color: "#a3e635", scale: "G0", advice: "Aurora possible at high latitudes. GPS and HF mostly unaffected." };
  if (kp < 5)
    return { label: "Minor storm", color: "#facc15", scale: "G1", advice: "Aurora pushes to ~60° magnetic latitude. Watch migratory-bird and pigeon-race advisories; minor grid fluctuations possible." };
  if (kp < 6)
    return { label: "Moderate storm", color: "#fb923c", scale: "G2", advice: "Aurora visible mid-latitudes after dark. HF radio fades at high latitudes; satellite operators watch drag and charging." };
  if (kp < 7)
    return { label: "Strong storm", color: "#f43f5e", scale: "G3", advice: "Aurora widely visible ~50° latitude. GPS accuracy degrades, transformers hum — grid operators go on alert, aviation reroutes polar flights." };
  if (kp < 8)
    return { label: "Severe storm", color: "#e11d48", scale: "G4", advice: "Widespread aurora, possible power-grid protection trips, Starlink-style LEO drag spikes, HF blackouts. Charge devices, have backup comms." };
  return { label: "Extreme storm", color: "#a855f7", scale: "G5", advice: "Carrington-class territory. Grid-scale protection actions likely, aviation + GNSS heavily impacted. Follow official space-weather alerts." };
}

export function xrayClass(flux: number): { cls: string; color: string } {
  // flux in W/m^2 (GOES long channel)
  if (flux >= 1e-4) return { cls: "X", color: "#a855f7" };
  if (flux >= 1e-5) return { cls: "M", color: "#f43f5e" };
  if (flux >= 1e-6) return { cls: "C", color: "#fb923c" };
  if (flux >= 1e-7) return { cls: "B", color: "#facc15" };
  return { cls: "A", color: "#34d399" };
}

/** Minimum magnetic latitude of visible aurora for a Kp value (rough OVATION-style fit). */
export function auroraLatitude(kp: number): number {
  // equatorward boundary ≈ 67 - 3.2*kp degrees magnetic latitude
  return Math.max(38, 67 - 3.2 * kp);
}

export function auroraVerdict(kp: number, lat: number): { score: number; text: string } {
  const boundary = auroraLatitude(kp);
  const mlat = Math.abs(lat);
  if (mlat < boundary - 12) return { score: 2, text: `Unlikely at ${lat.toFixed(1)}° — oval sits near ${boundary.toFixed(0)}° magnetic latitude. Travel north or wait for Kp ≥ 6.` };
  if (mlat < boundary) return { score: 45, text: `Possible on the northern horizon at ${lat.toFixed(1)}° if skies are dark and clear. Kp ${kp.toFixed(1)} puts the oval edge near ${boundary.toFixed(0)}°.` };
  if (mlat < boundary + 8) return { score: 78, text: `Good chance overhead at ${lat.toFixed(1)}° tonight. Get away from city lights between 22:00–02:00 local.` };
  return { score: 94, text: `Excellent — you are under the oval at ${lat.toFixed(1)}°. Look up any time it is dark and clear.` };
}

export function gridRisk(kp: number, windSpeed: number, bz: number | null): { level: string; score: number; color: string } {
  let score = kp * 10;
  if (windSpeed > 600) score += 12;
  else if (windSpeed > 450) score += 5;
  if (bz !== null && bz < -10) score += 15;
  else if (bz !== null && bz < -5) score += 7;
  score = Math.min(100, Math.max(0, Math.round(score)));
  if (score < 25) return { level: "Low", score, color: "#34d399" };
  if (score < 50) return { level: "Guarded", score, color: "#facc15" };
  if (score < 75) return { level: "Elevated", score, color: "#fb923c" };
  return { level: "High", score, color: "#f43f5e" };
}

export const fmtTime = (iso: string) => {
  try {
    return new Date(iso).toUTCString().slice(5, 22) + " UTC";
  } catch {
    return iso;
  }
};

export const FALLBACK = {
  kp: 1.3,
  windSpeed: 412,
  density: 5.1,
  bz: -2.4,
  xrayFlux: 2.3e-6,
};

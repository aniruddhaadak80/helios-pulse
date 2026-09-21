"use client";

import dynamic from "next/dynamic";
import type { GlobeQuake, GlobeFocus } from "./GlobeCanvas";

export type { GlobeQuake, GlobeFocus };

const GlobeCanvas = dynamic(() => import("./GlobeCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div className="sun-rays absolute inset-[-20%] rounded-full opacity-50" />
        <div className="h-56 w-56 animate-pulse rounded-full bg-gradient-to-br from-orange-400/40 to-rose-600/30 blur-md" />
        <div className="font-display absolute font-mono text-xs tracking-widest text-slate-400">spinning up Earth…</div>
      </div>
    </div>
  ),
});

export default function Globe(props: {
  kp: number;
  quakes: GlobeQuake[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  focus?: GlobeFocus | null;
  spin?: boolean;
}) {
  return <GlobeCanvas {...props} />;
}

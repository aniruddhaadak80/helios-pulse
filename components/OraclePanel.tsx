"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";

type Msg = { role: "you" | "oracle"; text: string };

export default function OraclePanel({
  kp,
  wind,
  bz,
  lat,
  quakeCount,
  initialQ,
}: {
  kp: number;
  wind: number;
  bz: number | null;
  lat?: number | null;
  quakeCount?: number;
  initialQ?: string | null;
}) {
  const [chat, setChat] = useState<Msg[]>([
    { role: "oracle", text: "I am the HELIOS Oracle, running on Gemini 3.5 Flash. Ask me anything — try “Can I see aurora at 40° tonight?” or “Is the power grid at risk?”" },
  ]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<string>("gemini");
  const ctxRef = useRef({ kp, wind, bz, lat: lat ?? null, quakeCount: quakeCount ?? 0 });
  ctxRef.current = { kp, wind, bz, lat: lat ?? null, quakeCount: quakeCount ?? 0 };
  const askedRef = useRef<string | null>(null);

  const ask = useCallback(async (question: string) => {
    const clean = question.trim();
    if (!clean || busy) return;
    setBusy(true);
    setChat((c) => [...c, { role: "you", text: clean }]);
    setQ("");
    try {
      const ctx = ctxRef.current;
      const r = await fetch("/api/oracle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: clean, ...ctx }),
      });
      const j = await r.json();
      setChat((c) => [...c, { role: "oracle", text: j.answer }]);
      if (j.mode) setMode(j.mode);
    } catch {
      setChat((c) => [...c, { role: "oracle", text: "My link to the Sun flickered. Try again in a moment." }]);
    }
    setBusy(false);
  }, [busy]);

  // auto-ask a prefilled question once (e.g. arriving from /aurora)
  useEffect(() => {
    if (initialQ && askedRef.current !== initialQ) {
      askedRef.current = initialQ;
      ask(initialQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-600">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold md:text-3xl">HELIOS Oracle</h2>
          <p className="font-mono text-[11px] text-slate-400">
            <span className="text-emerald-300">● {mode === "gemini" ? "Gemini 3.5 Flash" : "physics engine"}</span>
            {" "}· live Kp {kp.toFixed(1)} · wind {wind.toFixed(0)} km/s attached
          </p>
        </div>
      </div>
      <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
        {chat.map((m, i) => (
          <div
            key={i}
            className={`max-w-3xl whitespace-pre-wrap rounded-2xl p-4 text-sm leading-relaxed ${
              m.role === "you" ? "ml-auto bg-orange-500/20 text-orange-50" : "bg-white/5 text-slate-200"
            }`}
          >
            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {m.role === "you" ? "you" : "✦ oracle"}
            </div>
            {m.text}
          </div>
        ))}
        {busy && <div className="font-mono text-xs text-slate-500">oracle consulting the Sun…</div>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Ask: "Is GPS at risk?" · "aurora at 40°?" · "should I worry about the grid?"'
          className="flex-1 rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-orange-400"
        />
        <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-3 text-sm font-bold disabled:opacity-50">
          <Send className="h-4 w-4" /> Ask
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Brief me in 3 bullets", "Is the power grid at risk right now?", "Can I see aurora at 40° tonight?", "I'm flying polar — any concern?", "Explain Kp like I'm 12"].map((s) => (
          <button key={s} onClick={() => ask(s)} className="glass rounded-full px-3 py-1.5 text-xs hover:bg-white/10">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

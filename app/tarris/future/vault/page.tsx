"use client";

import { useState } from "react";
import { TarrisPortalFrame } from "../portal-shell";

const TENANT = "tarris"; // TENANT_KEY: change for new athlete.
const vaultItems = [
  { id: "pregame", title: "Pre-Game Speech — First Bama Win", cover: "/images/tb3-official/OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png", locked: true },
  { id: "family-practice", title: "Family Practice — Inner Circle Only", cover: "/images/tb3-official/OFFICIAL_02_BENCH_YELLOW_KOBE.png", locked: true },
  { id: "drop-01", title: "Behind Drop 01", cover: "/tb3/merch/tb3-tee-red.png", locked: false },
  { id: "origin", title: "More Than A Game — Origin", cover: "/images/tb3-official/OFFICIAL_03_LOW_STANCE_ARENA.png", locked: false },
  { id: "road-game", title: "Road Game Prep", cover: "/tb3/merch/tb3-duffel-black.png", locked: true },
  { id: "future-message", title: "Future Message", cover: "/images/tb3-official/OFFICIAL_04_BALL_OVER_SHOULDER.png", locked: true },
];

export default function VaultPage() {
  const [items, setItems] = useState(vaultItems);
  // TODO: tenant ledger query tenant=TENANT contentType="vault" when table exists
  function toggleLock(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, locked: !item.locked } : item));
  }
  return <TarrisPortalFrame>
    <header className="mb-6"><p className="text-[10px] font-bold tracking-[0.24em] text-[#E2A8B2]">{TENANT.toUpperCase()} · PRIVATE ARCHIVE</p><h1 className="mt-2 text-3xl font-black">Vault 🔒 — Owned Content</h1><p className="mt-2 text-sm text-white/55">Family controls access to each piece.</p></header>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414]">
      <div className="relative aspect-[4/3] overflow-hidden bg-black"><img src={item.cover} alt={item.title} className={`h-full w-full object-cover transition ${item.locked ? "blur-sm" : ""}`} loading="lazy" />{item.locked && <span className="absolute inset-0 grid place-items-center bg-black/35 text-3xl" aria-label="Locked">🔒</span>}</div>
      <div className="space-y-3 p-4"><h2 className="text-[11px] font-bold uppercase tracking-widest">{item.title}</h2><div className="flex items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-[10px] font-bold ${item.locked ? "bg-white/10 text-white/70" : "bg-[#C41E3A]/20 text-[#F2B7C0]"}`}>{item.locked ? "🔒 Locked" : "👁️ Unlocked"}</span>{!item.locked && <span className="text-[10px] text-white/45">0 views</span>}</div><button type="button" onClick={() => toggleLock(item.id)} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold hover:bg-white/10">Toggle Lock</button></div>
    </article>)}</div>
  </TarrisPortalFrame>;
}

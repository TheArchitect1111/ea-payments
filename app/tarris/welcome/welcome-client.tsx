"use client";

import { useEffect, useState } from "react";

const wallpapers = [
  ["/images/tb3-official/OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png", "TB3 Wallpaper 1"],
  ["/images/tb3-official/OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png", "TB3 Wallpaper 2"],
  ["/images/tb3-official/OFFICIAL_02_BENCH_YELLOW_KOBE.png", "TB3 Wallpaper 3"],
] as const;
export default function WelcomePage({ member: memberParam, code: codeParam }: { member: string; code?: string }) {
  const member = Math.max(1, Number.parseInt(memberParam || "1", 10) || 1);
  const code = codeParam || `TB3-IC-${String(member).padStart(3, "0")}`;
  const [copied, setCopied] = useState(false);
  const [publicUrl, setPublicUrl] = useState("/tarris");
  useEffect(() => setPublicUrl(new URL("/tarris", window.location.origin).toString()), []);
  const shareText = `I'm #${member} in TB3 Inner Circle — ${publicUrl}`;
  async function copyCode() {
    try { await navigator.clipboard.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); }
  }
  return <main className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-[#F7F5F2] sm:px-8"><div className="mx-auto max-w-5xl space-y-6">
    <header className="rounded-3xl border border-[#C41E3A]/50 bg-gradient-to-br from-[#260d12] to-[#101010] p-6 sm:p-10"><p className="text-[10px] font-bold tracking-[0.25em] text-[#E2A8B2]">TB3 · DROP 01</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">Welcome — Inner Circle #{member} — TB3</h1><p className="mt-3 text-sm text-white/65">Your place in the family community is saved.</p></header>
    <section className="rounded-2xl border-2 border-[#C41E3A] bg-black p-6 text-center sm:p-10"><p className="text-[10px] tracking-[0.3em] text-white/50">CERTIFICATE</p><h2 className="mt-4 text-2xl font-black text-[#E2A8B2]">INNER CIRCLE MEMBER #{member}</h2><p className="mt-2 text-xs font-bold tracking-[0.18em]">TB3 FUNDAMENTALS — DROP 01</p><p className="mt-6 text-4xl font-black tracking-[-0.1em] text-[#C41E3A]">TB3</p><p className="mt-5 font-serif text-xl italic">Tarris Bouie</p><p className="mt-2 text-xs text-white/45">{new Date().toLocaleDateString()}</p><button type="button" onClick={() => window.print()} className="mt-6 rounded-lg bg-white px-5 py-3 text-xs font-black text-black print:hidden">Download Certificate</button></section>
    <section className="rounded-2xl border border-white/10 bg-[#141414] p-6"><p className="text-[10px] font-bold tracking-widest text-white/50">MEMBER CODE</p><div className="mt-3 flex flex-wrap items-center justify-between gap-4"><code className="text-2xl font-black tracking-widest text-[#E2A8B2]">{code}</code><button type="button" onClick={copyCode} className="rounded-lg border border-white/20 px-4 py-2 text-xs font-bold">{copied ? "Copied ✓" : "Copy Code"}</button></div></section>
    <a href="/tarris/future/vault" className="block rounded-2xl border border-[#C41E3A]/40 bg-[#141414] p-6"><p className="text-[10px] font-bold tracking-widest text-[#E2A8B2]">VAULT ACCESS</p><h2 className="mt-2 text-xl font-black">UNLOCKED: More Than A Game — Origin</h2><p className="mt-2 text-xs text-white/55">Open the TB3 vault →</p><img src="/images/tb3-official/OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png" alt="TB3 More Than A Game" className="mt-4 aspect-[16/9] w-full rounded-lg bg-black object-contain" /></a>
    <section className="rounded-2xl border border-white/10 bg-[#141414] p-6"><h2 className="text-xl font-black">TB3 Wallpapers</h2><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">{wallpapers.map(([href, label]) => <a key={href} href={href} download className="rounded-lg border border-white/15 px-4 py-3 text-center text-xs font-bold">Download {label}</a>)}</div></section>
    <section className="rounded-2xl border border-white/10 bg-[#141414] p-6"><label htmlFor="share-inner-circle" className="text-[10px] font-bold tracking-widest text-white/50">SHARE YOUR SPOT</label><textarea id="share-inner-circle" readOnly value={shareText} className="mt-3 min-h-24 w-full rounded-lg border border-white/15 bg-black p-3 text-sm text-white" /></section>
  </div></main>;
}

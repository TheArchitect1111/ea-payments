"use client";

import { useEffect, useState, type MouseEvent } from "react";
import EA_Form from "./EA_Form";
import { TB3_PRODUCTS } from "./data/products";

type PublicStats = {
  innerCircleCount: number;
  pageViews: number;
  viewsAreEstimate: boolean;
  nilCount: number;
  topProduct: { id: string; name: string; count: number } | null;
  demand: { id: string; name: string; count: number }[];
  wall: { number: number; fan: string; product: string; createdAt: string }[];
};
const EMPTY: PublicStats = { innerCircleCount: 0, pageViews: 0, viewsAreEstimate: true, nilCount: 0, topProduct: null, demand: [], wall: [] };

function usePublicStats() {
  const [stats, setStats] = useState<PublicStats>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/tarris/public-stats", { cache: "no-store" })
      .then(async (response) => { const result = await response.json(); if (!response.ok || !result.ok) throw new Error("Live counts unavailable"); return result as PublicStats; })
      .then((result) => { if (active) setStats(result); })
      .catch(() => undefined)
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);
  return { stats, loaded };
}

export function PublicCountsBar() {
  const { stats, loaded } = usePublicStats();
  return <div className="overflow-hidden border-y border-black/10 bg-[#141414] px-4 py-2 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-white sm:text-[10px]">
    {loaded ? `${stats.innerCircleCount} Inner Circle • ${stats.pageViews} views${stats.viewsAreEstimate ? " est." : ""} • ${stats.nilCount} NIL inquiries` : <span className="inline-block h-3 w-64 animate-pulse rounded bg-white/15" aria-label="Loading community counts" />}
  </div>;
}

function setTilt(event: MouseEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width - 0.5;
  const y = (event.clientY - box.top) / box.height - 0.5;
  event.currentTarget.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) scale(1.02)`;
}

export function PublicTb3Store() {
  const { stats, loaded } = usePublicStats();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return <>
    <section id="merch" aria-labelledby="store-title" className="scroll-mt-5 border-b border-black/20 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[9px] tracking-[0.25em] text-[#A51C30]">TB3 STORE</p><h2 id="store-title" className="mt-2 text-3xl font-black tracking-tight">WEAR THE VISION.</h2></div><p className="text-xs text-black/60">Drop 01 · Join the waitlist</p></div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
        {TB3_PRODUCTS.map((product) => {
          const count = stats.demand.find((item) => item.id === product.id)?.count || 0;
          const productPath = `/tarris?product=${encodeURIComponent(product.id)}`;
          const qrTarget = origin ? new URL(productPath, origin).toString() : "";
          const qr = qrTarget ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrTarget)}` : "";
          return <article key={product.id} onMouseMove={setTilt} onMouseLeave={(event) => { event.currentTarget.style.transform = ""; }} className="group relative flex min-w-0 flex-col gap-2 rounded-xl border border-black/10 bg-white p-2 transition-transform duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(165,0,20,0.3)]">
            <span className="absolute right-3 top-3 z-10 rounded bg-[#A51C30] px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-white">Drop 01 — 100</span>
            <img src={product.image} alt={product.name} className="aspect-square w-full bg-[#f0f0f0] object-contain" loading="lazy" />
            <p className="text-[11px] font-bold uppercase tracking-widest">{product.name}</p>
            <EA_Form tenant="tarris" formType="merch-waitlist" productId={product.id} cta="Join Waitlist" placeholder="Email for Drop 01" />
            <div className="flex items-center justify-between gap-2"><a href={productPath} className="text-[9px] font-semibold text-[#A51C30] underline underline-offset-2">Open product link</a>{qrTarget ? <a href={productPath} aria-label={`Open ${product.name} waitlist link`}><img src={qr} alt={`QR code for ${product.name}`} width="48" height="48" loading="lazy" className="h-12 w-12 border border-black/10 bg-white p-1" /></a> : <span className="h-12 w-12" aria-hidden="true" />}</div>
            <p className="border-t border-black/10 pt-2 text-[9px] font-semibold text-black/60">{loaded ? count : "—"} want this — Drop 01</p>
          </article>;
        })}
      </div>
    </section>
    <section id="inner-circle-wall" aria-labelledby="wall-title" className="border-b border-black/20 py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[9px] tracking-[0.25em] text-[#A51C30]">COMMUNITY · DROP 01</p><h2 id="wall-title" className="mt-2 text-3xl font-black tracking-tight">INNER CIRCLE WALL.</h2></div><p className="text-xs text-black/55">Names are shown without email addresses.</p></div>
      {stats.wall.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{stats.wall.map((member) => <article key={member.number} className="rounded-lg border border-black/10 bg-white p-4"><p className="text-lg font-black text-[#A51C30]">#{member.number}</p><p className="mt-1 text-sm font-bold">{member.fan}</p><p className="mt-1 text-[10px] text-black/55">{member.product}</p></article>)}</div> : <p className="rounded-lg border border-dashed border-black/20 p-5 text-sm text-black/55">No Inner Circle members yet — join the Drop 01 waitlist.</p>}
    </section>
  </>;
}

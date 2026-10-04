// app/tarris/future/page.tsx - TB3 HQ PORTAL - approved official assets
// WIRING: Public (app/tarris/page.tsx) -> ENTER TB3 HQ -> this file -> /tarris/future/agreement
// This is what www.tb3.online/hq shows via rewrite /hq/:path* -> /tarris/future/:path*

import React from "react";
import Link from "next/link";

const portalModules = [
  { title: "ACADEMICS", images: [
    { id: "hq-academics-primary", asset: "OFFICIAL_09_LIBRARY_STUDYING.png", alt: "Tarris studying in the library" },
    { id: "hq-academics-film", asset: "OFFICIAL_07_FILM_TABLET.png", alt: "Tarris reviewing game film" },
  ]},
  { title: "TRAINING", images: [
    { id: "hq-training-primary", asset: "OFFICIAL_06_CABLE_MACHINE.png", alt: "Tarris training on a cable machine" },
    { id: "hq-training-secondary", asset: "OFFICIAL_02_BENCH_YELLOW_KOBE.png", alt: "Tarris seated on the bench" },
    { id: "hq-nutrition", asset: "OFFICIAL_11_KITCHEN_NUTRITION.png", alt: "Tarris preparing nutrition at home" },
  ]},
  { title: "NIL & BRAND", images: [
    { id: "hq-nil-brand", asset: "OFFICIAL_13_BLAZER_CHAIR.png", alt: "Tarris in a blazer in a professional setting" },
  ]},
  { title: "OPPORTUNITIES", images: [
    { id: "hq-opportunities-enterprise", asset: "OFFICIAL_15_PODIUM_SPEAKING.png", alt: "Tarris speaking at a podium" },
  ]},
  { title: "MEDIA LIBRARY", images: []},
  { title: "COMMUNITY", images: [
    { id: "hq-community-youth", asset: "OFFICIAL_14_YOUTH_HUDDLE.png", alt: "Tarris coaching a youth huddle" },
    { id: "hq-community-education", asset: "OFFICIAL_12_KIDS_ART.png", alt: "Young people working on art together" },
  ]},
];
function PortalImage({ id, asset, alt, className = "" }: { id: string; asset: string; alt: string; className?: string }) {
  const objectPosition = asset.includes("HEADSHOT") ? "50% 15%" : asset.includes("BENCH_YELLOW_KOBE") ? "50% 30%" : asset.includes("BLAZER_CHAIR") ? "55% 20%" : "50% 50%";
  return <img id={id} src={`/images/tb3-official/${asset}`} alt={alt} style={{ objectPosition }} className={`h-full w-full object-cover ${className}`} loading="lazy" />;
}

export default function TarrisFuturePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col lg:flex-row">
      <aside className="relative w-full lg:fixed lg:left-0 lg:top-0 lg:w-64 lg:h-screen bg-[#111] border-r border-[#222] p-6">
        <h2 className="font-black text-2xl mb-1 tracking-tight">TB3 HQ</h2>
        <p className="text-[10px] tracking-[0.3em] opacity-60 mb-4">MORE THAN A GAME</p>
        <div className="mb-8 flex items-center gap-3">
          <img id="hq-profile-avatar" src="/images/tb3-official/OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png" alt="Tarris Bouie profile" style={{ aspectRatio: "1 / 1" }} className="h-14 w-14 shrink-0 rounded-full object-cover object-center" loading="eager" />
          <span className="text-sm font-semibold">Tarris Bouie</span>
        </div>
        <nav className="grid grid-cols-2 gap-2 lg:block lg:space-y-2 text-sm">
          <Link href="/tarris/future" className="block bg-white text-black px-3 py-2 rounded font-bold">Home</Link>
          <a className="block opacity-70 px-3 py-2">My Journey</a>
          <a className="block opacity-70 px-3 py-2">Academics</a>
          <a className="block opacity-70 px-3 py-2">Training</a>
          <a className="block opacity-70 px-3 py-2">NIL & Brand</a>
          <a className="block opacity-70 px-3 py-2">Opportunities</a>
          <a className="block opacity-70 px-3 py-2">Media Library</a>
          <a className="block opacity-70 px-3 py-2">Community</a>
          <a className="block opacity-70 px-3 py-2">Calendar</a>
          <a className="block opacity-70 px-3 py-2">Earnings</a>
          <a className="block opacity-70 px-3 py-2">Analytics</a>
          <a className="block opacity-70 px-3 py-2">Documents</a>
          <a className="block opacity-70 px-3 py-2">EVA</a>
        </nav>
        <div className="mt-8 text-[10px] opacity-40 leading-relaxed">
          DISCIPLINE<br/>DETERMINATION<br/>DEVELOPMENT<br/>DESTINY
        </div>
      </aside>

      <main className="min-w-0 ml-0 lg:ml-64 flex-1 p-4 sm:p-8 bg-[#0a0a0a]">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-0 justify-between items-start mb-8 bg-[#111] rounded-2xl p-6 border border-[#222]">
          <div>
            <p className="text-xs tracking-widest opacity-60">WELCOME TO</p>
            <h1 className="text-6xl font-black mt-1">TB3 <span className="text-[#c41e3a]">HQ</span></h1>
            <p className="text-xs tracking-[0.3em] opacity-60 mt-1">PLAN. PREPARE. PERFORM. BUILD.</p>
            <p className="mt-6 text-lg italic opacity-80">&quot;A bigger purpose than basketball.&quot;<br/><span className="text-xs not-italic opacity-60">— TARRIS BOUIE III</span></p>
            {/* WIRED FUNCTIONAL BUTTON - NOT JUST COMMENT */}
            <Link href="/tarris/future/agreement" className="mt-6 inline-block bg-white text-black px-6 py-3 rounded-full font-bold text-sm hover:bg-zinc-200 transition">
              LET&apos;S GET TO WORK →
            </Link>
          </div>
          <div className="w-full sm:w-72 h-72 shrink-0 overflow-hidden rounded-2xl bg-[#0A0A0A]">
            <img id="hq-hero" src="/images/tb3-official/OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png" alt="TB3: More Than a Game" className="h-full w-full object-contain" loading="eager" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {portalModules.map(({ title, images }) => (
            <div key={title} className="bg-[#1a1a1a] p-4 rounded-xl border border-[#222] text-xs font-bold">
              {images.length > 0 && <div className={`mb-3 grid gap-1 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                {images.map(({ id, asset, alt }) => <div key={id} className="aspect-square overflow-hidden rounded-md"><PortalImage id={id} asset={asset} alt={alt} /></div>)}
              </div>}
              {title}<br/><span className="font-normal opacity-60 text-[11px]">Approved module</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#222]">
            <p className="text-[10px] tracking-widest opacity-60">FEATURED VIDEO</p>
            <h3 className="font-black text-2xl mt-2 leading-tight">THE JOURNEY<br/>CONTINUES.</h3>
            <div id="hq-media-library" className="mt-4 grid grid-cols-2 gap-2">
              <div className="aspect-video overflow-hidden rounded-lg"><PortalImage id="hq-media-thumb-1" asset="OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png" alt="Tarris headshot in Alabama gear" /></div>
              <div className="aspect-video overflow-hidden rounded-lg"><PortalImage id="hq-media-thumb-2" asset="OFFICIAL_08_HEADSHOT_RED_BG.png" alt="Tarris headshot on red and black background" /></div>
              <div className="aspect-video overflow-hidden rounded-lg"><PortalImage id="hq-media-thumb-3" asset="OFFICIAL_03_LOW_STANCE_ARENA.png" alt="Tarris in a low dribble stance on court" /></div>
              <div className="aspect-video overflow-hidden rounded-lg"><PortalImage id="hq-media-thumb-4" asset="OFFICIAL_04_BALL_OVER_SHOULDER.png" alt="Tarris holding the ball over his shoulder" /></div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#222]">
            <h3 className="font-bold">MY FOCUS</h3>
            <div className="mt-4 space-y-3 text-xs"><div>85% Training Plan - On Track</div><div>72% Academic Goals - On Track</div><div>60% NIL / Brand - In Progress</div><div>90% Personal Growth - On Track</div></div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#222]">
            <h3 className="font-bold">UPCOMING</h3>
            <div className="mt-4 space-y-3 text-xs opacity-70"><div>SEP 14 - Training</div><div>SEP 16 - Academic Check-In</div><div>SEP 18 - NIL Meeting</div><div>SEP 20 - Community Event</div></div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-[11px]">
          <Link href="/tarris/future/agreement" className="underline opacity-60 hover:opacity-100">View Agreement →</Link>
          <span className="opacity-20">|</span>
          <span className="opacity-30">WIRED: app/tarris/page.tsx → ENTER TB3 HQ → app/tarris/future/page.tsx → app/tarris/future/agreement/page.tsx</span>
        </div>
      </main>
    </div>
  );
}

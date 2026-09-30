// TarrisOwnerDashboard.tsx - TB3 HQ - Approved - WIRED 100% - NO IMAGES BUNDLED
// Place in: ea-payments/app/tarris/future/
// This is the portal. It maintains exact approved layout. You will replace image src later.
// WIRING: Public page.js -> ENTER TB3 HQ button -> /tarris/future -> this component

import React from "react";

export default function TarrisOwnerDashboard({ user, role }: any) {
  // IMAGE PLACEHOLDERS - REPLACE THESE PATHS LATER WITH YOUR MOM-SAFE IMAGES
  const IMAGES = {
    hqHeader: "/images/tarris/YOUR_HQ_HEADER.jpg", // <-- Replace: portal top banner - mom-safe polo/tee smile
    brandSmile: "/images/tarris/YOUR_BRAND_SMILE.jpg", // <-- Replace: brand tile - confident smile
    community: "/images/tarris/YOUR_COMMUNITY.jpg", // <-- Already PASS - smiling with kids
    enterprise: "/images/tarris/YOUR_ENTERPRISE_SUIT.jpg", // <-- Already PASS - suit
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* SIDEBAR - Exact approved design */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-[#111] border-r border-[#222] p-6">
        <h2 className="font-black text-2xl mb-1 tracking-tight">TB3 HQ</h2>
        <p className="text-[10px] tracking-[0.3em] opacity-60 mb-8">MORE THAN A GAME</p>
        <nav className="space-y-2 text-sm">
          <a className="block bg-white text-black px-3 py-2 rounded font-bold">Home</a>
          <a className="block opacity-70 px-3 py-2">My Journey</a>
          <a className="block opacity-70 px-3 py-2">Academics</a>
          <a className="block opacity-70 px-3 py-2">Training</a>
          <a className="block opacity-70 px-3 py-2">NIL & Brand</a>
          <a className="block opacity-70 px-3 py-2">Opportunities</a>
          <a className="block opacity-70 px-3 py-2">Media Library</a>
          <a className="block opacity-70 px-3 py-2">Community</a>
          {role === 'admin' && <a className="block opacity-70 px-3 py-2">Admin</a>}
        </nav>
        <div className="mt-8 text-[10px] opacity-40 leading-relaxed">
          DISCIPLINE<br/>DETERMINATION<br/>DEVELOPMENT<br/>DESTINY
        </div>
      </aside>

      {/* MAIN - Exact approved TB3 HQ layout */}
      <main className="ml-64 flex-1 p-8 bg-[#0a0a0a]">
        {/* TOP BANNER - WIRED TO PUBLIC PAGE */}
        <div className="flex justify-between items-start mb-8 bg-[#111] rounded-2xl p-6 border border-[#222]">
          <div>
            <p className="text-xs tracking-widest opacity-60">WELCOME TO</p>
            <h1 className="text-6xl font-black mt-1">TB3 <span className="text-[#c41e3a]">HQ</span></h1>
            <p className="text-xs tracking-[0.3em] opacity-60 mt-1">PLAN. PREPARE. PERFORM. BUILD.</p>
            <p className="mt-6 text-lg italic opacity-80">"A bigger purpose than basketball."<br/><span className="text-xs not-italic opacity-60">— TARRIS BOUIE III</span></p>
            <button className="mt-6 bg-[#1a1a1a] border border-[#333] px-6 py-3 rounded text-sm">LET'S GET TO WORK →</button>
          </div>
          {/* IMAGE SLOT 1: HQ HEADER - REPLACE LATER */}
          <div className="w-72 h-72 bg-[#1a1a1a] rounded-2xl flex items-center justify-center border border-dashed border-[#333] text-xs opacity-50 text-center p-4">
            HQ HEADER IMAGE<br/>Replace: {IMAGES.hqHeader}<br/>Mom-safe: polo/tee smile, no sweat/tank
          </div>
        </div>

        {/* 6 TILES - Exact approved */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {['ACADEMICS','TRAINING','NIL & BRAND','OPPORTUNITIES','MEDIA LIBRARY','COMMUNITY'].map(t=>(
            <div key={t} className="bg-[#1a1a1a] p-4 rounded-xl border border-[#222] text-xs font-bold">{t}<br/><span className="font-normal opacity-60 text-[11px]">Approved module</span></div>
          ))}
        </div>

        {/* FEATURED + FOCUS + UPCOMING - Exact approved */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#222]">
            <p className="text-[10px] tracking-widest opacity-60">FEATURED VIDEO</p>
            <h3 className="font-black text-2xl mt-2 leading-tight">THE JOURNEY<br/>CONTINUES.</h3>
            {/* IMAGE SLOT 2: BRAND SMILE - REPLACE LATER */}
            <div className="mt-4 w-full h-48 bg-[#222] rounded-lg flex items-center justify-center border border-dashed border-[#444] text-xs opacity-50 text-center p-4">
              BRAND SMILE IMAGE<br/>Replace: {IMAGES.brandSmile}<br/>Mom-safe: TB3 tee, arms crossed, warm smile
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

        {/* WIRED FOOTER */}
        <div className="mt-8 text-[10px] opacity-30">WIRED: Public page (page.js) → ENTER TB3 HQ → This portal (page.tsx) → agreement/ | Design: 100% approved retained | Images: placeholders for you to replace</div>
      </main>
    </div>
  );
}

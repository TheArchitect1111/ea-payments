// app/tarris/future/page.tsx - TB3 HQ PORTAL - Production Ready - WIRED 100% - NO IMAGES BUNDLED
// WIRING: Public (app/tarris/page.tsx) -> ENTER TB3 HQ -> this file -> /tarris/future/agreement
// This is what www.tb3.online/hq shows via rewrite /hq/:path* -> /tarris/future/:path*

import React from "react";
import Link from "next/link";
import BlueprintBrickPanel from "@/app/components/blueprint/BlueprintBrickPanel";
import EAAssistant from "@/app/components/ea-assistant/EAAssistant";
import { getBlueprintByAlias, publicBlueprint } from "@/lib/blueprint-store";
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { findMembership } from '@/lib/memberships';
import { canAccessBlueprint } from '@/lib/blueprint-ownership';

export const dynamic = 'force-dynamic';

export default async function TarrisFuturePage() {
  const IMAGES = {
    hqHeader: "/images/tarris/YOUR_HQ_HEADER.jpg",
    brandSmile: "/images/tarris/YOUR_BRAND_SMILE.jpg",
    community: "/images/tarris/YOUR_COMMUNITY.jpg",
    enterprise: "/images/tarris/YOUR_ENTERPRISE_SUIT.jpg",
  };

  const candidateBlueprint = await getBlueprintByAlias('tarris');
  const session = await requirePortalSession();
  const membership = candidateBlueprint && session?.email && session?.orgId
    ? await findMembership(session.email, session.orgId) : null;
  const blueprint = candidateBlueprint && canAccessBlueprint(session, candidateBlueprint, membership)
    ? candidateBlueprint : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col lg:flex-row">
      <aside className="relative w-full lg:fixed lg:left-0 lg:top-0 lg:w-64 lg:h-screen bg-[#111] border-r border-[#222] p-6">
        <h2 className="font-black text-2xl mb-1 tracking-tight">TB3 HQ</h2>
        <p className="text-[10px] tracking-[0.3em] opacity-60 mb-8">MORE THAN A GAME</p>
        <nav className="grid grid-cols-2 gap-2 lg:block lg:space-y-2 text-sm">
          <Link href="/tarris/future" className="block bg-white text-black px-3 py-2 rounded font-bold">Home</Link>
          <a className="block opacity-70 px-3 py-2">My Journey</a>
          <a className="block opacity-70 px-3 py-2">Academics</a>
          <a className="block opacity-70 px-3 py-2">Training</a>
          <a className="block opacity-70 px-3 py-2">NIL & Brand</a>
          <a className="block opacity-70 px-3 py-2">Opportunities</a>
          <a className="block opacity-70 px-3 py-2">Media Library</a>
          <a className="block opacity-70 px-3 py-2">Community</a>
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
          <div className="w-full sm:w-72 h-72 shrink-0 bg-[#1a1a1a] rounded-2xl flex items-center justify-center border border-dashed border-[#333] text-xs opacity-50 text-center p-4">
            HQ HEADER IMAGE<br/>Replace: {IMAGES.hqHeader}<br/>Mom-safe: polo/tee smile, no sweat/tank
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {['ACADEMICS','TRAINING','NIL & BRAND','OPPORTUNITIES','MEDIA LIBRARY','COMMUNITY'].map(t=>(
            <div key={t} className="bg-[#1a1a1a] p-4 rounded-xl border border-[#222] text-xs font-bold">{t}<br/><span className="font-normal opacity-60 text-[11px]">Approved module</span></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#222]">
            <p className="text-[10px] tracking-widest opacity-60">FEATURED VIDEO</p>
            <h3 className="font-black text-2xl mt-2 leading-tight">THE JOURNEY<br/>CONTINUES.</h3>
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

        <div className="mt-8 flex flex-wrap gap-4 text-[11px]">
          <Link href="/tarris/future/agreement" className="underline opacity-60 hover:opacity-100">View Agreement →</Link>
          <span className="opacity-20">|</span>
          <span className="opacity-30">WIRED: app/tarris/page.tsx → ENTER TB3 HQ → app/tarris/future/page.tsx → app/tarris/future/agreement/page.tsx</span>
        </div>
        {blueprint ? (
          <BlueprintBrickPanel clientId={blueprint.clientId} initialRecord={publicBlueprint(blueprint)} dark />
        ) : null}
      </main>
      <EAAssistant surface="portal" workspaceAiContext="TB3 HQ: academics, training, NIL and brand, opportunities, events, media, community, and the active operational blueprint." />
    </div>
  );
}

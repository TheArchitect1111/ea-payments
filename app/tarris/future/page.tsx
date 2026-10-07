"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { HqWorkspaceProvider, useHq, HqDialog, ModuleActions, ModuleTools, ProactiveEva, HqFocus, Upcoming, OpportunitySummary, OpportunityPipeline, EarningsValue, EarningsBreakdown, DocumentVault, OpportunityInbox, CalendarModule, EvaPanel, EvaFab, EvaCommandBar } from "./hq-workspace";
import { TarrisPortalNav } from "./portal-shell";
import { OverviewAnalytics } from "./analytics-client";

type AssetCategory = "Athlete" | "Academics" | "Brand" | "Community" | "Future";
type OfficialAsset = { filename: string; label: string; category: AssetCategory; alt: string };

const officialAssets: OfficialAsset[] = [
  { filename: "OFFICIAL_03_LOW_STANCE_ARENA.png", label: "LOW STANCE · ARENA", category: "Athlete", alt: "Tarris in a low dribble stance on court" },
  { filename: "OFFICIAL_04_BALL_OVER_SHOULDER.png", label: "BALL OVER SHOULDER", category: "Athlete", alt: "Tarris holding a basketball over his shoulder" },
  { filename: "OFFICIAL_02_BENCH_YELLOW_KOBE.png", label: "BENCH · YELLOW KOBE", category: "Athlete", alt: "Tarris seated on the bench wearing yellow Kobe shoes" },
  { filename: "OFFICIAL_06_CABLE_MACHINE.png", label: "CABLE MACHINE", category: "Athlete", alt: "Tarris training on a cable machine" },
  { filename: "OFFICIAL_09_LIBRARY_STUDYING.png", label: "LIBRARY · STUDYING", category: "Academics", alt: "Tarris studying in a library" },
  { filename: "OFFICIAL_07_FILM_TABLET.png", label: "FILM TABLET", category: "Academics", alt: "Tarris reviewing game film on a tablet" },
  { filename: "OFFICIAL_11_KITCHEN_NUTRITION.png", label: "KITCHEN · NUTRITION", category: "Academics", alt: "Nutrition and wellness preparation" },
  { filename: "OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png", label: "HEADSHOT · WHITE JERSEY", category: "Brand", alt: "Tarris headshot in a white Alabama jersey" },
  { filename: "OFFICIAL_08_HEADSHOT_RED_BG.png", label: "HEADSHOT · RED BACKGROUND", category: "Brand", alt: "Tarris headshot on a red and black background" },
  { filename: "OFFICIAL_13_BLAZER_CHAIR.png", label: "BLAZER · PROFESSIONAL", category: "Brand", alt: "Tarris in a blazer in a professional setting" },
  { filename: "OFFICIAL_10_CASUAL_LEAN.png", label: "CASUAL · OUTDOOR", category: "Brand", alt: "Tarris in a casual outdoor portrait" },
  { filename: "OFFICIAL_14_YOUTH_HUDDLE.png", label: "YOUTH HUDDLE", category: "Community", alt: "Tarris coaching a youth huddle" },
  { filename: "OFFICIAL_12_KIDS_ART.png", label: "KIDS · ART", category: "Community", alt: "Children creating art together" },
  { filename: "OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png", label: "TUNNEL · BOUIE 4", category: "Future", alt: "Tarris in the tunnel with BOUIE and number 4 visible" },
  { filename: "OFFICIAL_15_PODIUM_SPEAKING.png", label: "PODIUM · SPEAKING", category: "Future", alt: "Tarris speaking at a podium" },
  { filename: "OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png", label: "TB3 · MORE THAN A GAME", category: "Future", alt: "TB3 More Than a Game hero graphic" },
];

const filterOptions = ["All", "Athlete", "Academics", "Brand", "Community", "Future"] as const;

function PortalImage({
  id,
  asset,
  alt,
  position = "center",
  className = "",
  contain = false,
}: {
  id: string;
  asset: string;
  alt: string;
  position?: string;
  className?: string;
  contain?: boolean;
}) {
  return (
    <img
      id={id}
      src={"/images/tb3-official/" + asset}
      alt={alt}
      style={{ objectPosition: position }}
      className={"h-full w-full " + (contain ? "object-contain" : "object-cover") + " " + className}
      loading={id === "hq-hero" ? "eager" : "lazy"}
    />
  );
}

function WorkspaceIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    Academics: "M2 8 12 3l10 5-10 5-10-5m4 3v6l6 3 6-3v-6M22 8v9",
    Training: "M3 8v8m3-10v12m12-12v12m3-10v8M6 12h12",
    "NIL & Brand": "M4 19V5m0 14h16M8 15l4-5 4 2 5-7",
    Opportunities: "M2 8l5-4 5 2 5-2 5 4-4 10-4 3-5-3-7-10m7 0 4-2 4 4-3 3-3-2m3 2 6 5",
    Calendar: "M3 5h18v16H3V5m0 5h18M7 2v6m10-6v6M7 14h3m4 0h3M7 17h3",
    Community: "M9 7a3 3 0 1 0 6 0a3 3 0 1 0-6 0m-5 14v-3a8 8 0 0 1 16 0v3M3 7v5m18-5v5",
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 text-[#C41E3A]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

function ActionButton({ children }: { children: string }) {
  return (
    <button
      type="button"
      disabled
      className="cursor-not-allowed rounded border border-white/20 px-4 py-2 text-left text-xs font-semibold text-white/80 opacity-80"
    >
      {children}
    </button>
  );
}

export default function TarrisFuturePage() { return <HqWorkspaceProvider><TarrisHqContent /></HqWorkspaceProvider>; }

function TarrisHqContent() {
  const {setAssetOpener,setModule}=useHq();
  const [selectedAsset, setSelectedAsset]=useState<OfficialAsset|null>(null);
  const [copyNotice, setCopyNotice]=useState("");
  const rootRef=useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]>("All");
  const [copiedAsset, setCopiedAsset] = useState("");

  useEffect(()=>{setAssetOpener(category=>setActiveFilter(filterOptions.includes(category as typeof filterOptions[number])?category as typeof filterOptions[number]:"All"));return()=>setAssetOpener(null);},[setAssetOpener]);
  useEffect(()=>{const root=rootRef.current;if(!root)return;const names:Record<string,string>={"hq-home":"Home","my-journey-module":"My Journey","academics-module":"Academics","training-module":"Training","nil-brand-module":"NIL & Brand","opportunities-module":"Opportunities","community-module":"Community","calendar-module":"Calendar","media-library":"Media Library"};const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);if(visible[0])setModule(names[visible[0].target.id]);},{root,rootMargin:"-10% 0px -50% 0px",threshold:0});Object.keys(names).forEach(id=>{const node=document.getElementById(id);if(node)observer.observe(node);});return()=>observer.disconnect();},[setModule]);
  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return officialAssets.filter(({ label, category }) => {
      const categoryMatches = activeFilter === "All" || category === activeFilter;
      const queryMatches = !query || (label + " " + category).toLowerCase().includes(query);
      return categoryMatches && queryMatches;
    });
  }, [search, activeFilter]);

  async function copyAssetLink(filename: string) {
    const link = window.location.origin + "/images/tb3-official/" + filename;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedAsset(filename);setCopyNotice("Link copied");
      window.setTimeout(() => setCopiedAsset(""), 1600);
    } catch {
      setCopiedAsset("");setCopyNotice("Could not copy. Use Download HD or your browser’s copy-link action.");
    }
  }

  return (
    <div ref={rootRef} id="hq-scroll" className="h-[calc(100dvh-96px)] overflow-y-auto xl:h-dvh bg-[#0A0A0A] text-[#F7F5F2] lg:flex">
      <TarrisPortalNav />

      <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-8 lg:ml-64 lg:px-8 xl:mr-80">
        <EvaCommandBar />
        <section id="hq-home" className="scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-8">
          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-center">
            <div className="max-w-2xl">
              <p className="text-xs tracking-[0.25em] text-white/60">WELCOME TO</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">TB3 <span className="text-[#C41E3A]">HQ</span></h1>
              <p className="mt-3 text-xs tracking-[0.25em] text-white/60">PLAN. PREPARE. PERFORM. BUILD.</p>
              <p className="mt-6 max-w-xl text-lg italic text-white/80">“A bigger purpose than basketball.”</p><p className="mt-2 text-xs tracking-widest text-white/50">TARRIS BOUIE III</p>
              <a href="#training-module" className="mt-5 inline-block text-xs font-bold uppercase tracking-[0.18em] text-[#E2A8B2] underline underline-offset-4">LET’S GET TO WORK →</a>
            </div>
            <div className="aspect-video w-full max-w-lg overflow-hidden rounded-xl bg-[#0A0A0A]">
              <PortalImage id="hq-hero" asset="OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png" alt="TB3 More Than a Game hero graphic" contain />
            </div>
          </div>
        </section>

        <OverviewAnalytics />

        <section aria-label="Your workspace" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[["Academics", "academics-module", "♧"], ["Training", "training-module", "↔"], ["NIL & Brand", "nil-brand-module", "↗"], ["Opportunities", "opportunities-module", "◇"], ["Community", "community-module", "◎"], ["Calendar", "calendar-module", "▦"]].map(([label, target]) => <a key={target} href={"#" + target} className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-5 transition hover:border-[#C41E3A]"><WorkspaceIcon name={label} /><h2 className="mt-4 text-xs font-bold uppercase tracking-wider">{label}</h2></a>)}
        </section>

        <section id="my-journey-module" aria-labelledby="journey-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.24em] text-[#C41E3A]">MY JOURNEY</p>
          <h2 id="journey-title" className="mt-2 text-2xl font-black sm:text-3xl">THE JOURNEY CONTINUES.</h2>
          <p className="mt-2 text-sm text-white/65">Charlotte. Spire. Alabama. Next. Every stop added something.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-black"><PortalImage id="my-journey-1" asset="OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png" alt="Tarris headshot in a white Alabama jersey" position="50% 15%" /></div>
            <div className="aspect-square overflow-hidden rounded-xl bg-black"><PortalImage id="my-journey-2" asset="OFFICIAL_08_HEADSHOT_RED_BG.png" alt="Tarris headshot on a red and black background" position="50% 15%" /></div>
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-black"><PortalImage id="my-journey-3" asset="OFFICIAL_03_LOW_STANCE_ARENA.png" alt="Tarris in a low stance on court" position="center" /></div>
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-black"><PortalImage id="my-journey-4" asset="OFFICIAL_04_BALL_OVER_SHOULDER.png" alt="Tarris with a basketball over his shoulder" position="center top" /></div>
          </div>
          <div className="mt-5 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
            <details className="group rounded-xl border border-white/10 bg-white/[0.035] p-4"><summary className="cursor-pointer list-none font-bold">CHARLOTTE <span className="ml-2 text-white/45">Foundation +</span></summary><p className="mt-3 leading-5 text-white/65">Family, community, and the values that set the foundation for the journey.</p></details>
            <details className="group rounded-xl border border-white/10 bg-white/[0.035] p-4"><summary className="cursor-pointer list-none font-bold">SPIRE <span className="ml-2 text-white/45">Development +</span></summary><p className="mt-3 leading-5 text-white/65">Continued development as a student and athlete.</p></details>
            <details className="group rounded-xl border border-white/10 bg-white/[0.035] p-4"><summary className="cursor-pointer list-none font-bold">ALABAMA <span className="ml-2 text-white/45">Visibility +</span></summary><p className="mt-3 leading-5 text-white/65">Competition on a national stage and growth as a college athlete.</p></details>
            <details className="group rounded-xl border border-white/10 bg-white/[0.035] p-4"><summary className="cursor-pointer list-none font-bold">NEXT <span className="ml-2 text-white/45">Possibility +</span></summary><p className="mt-3 leading-5 text-white/65">New opportunities to build beyond basketball.</p></details>
          </div>
        </section>

        <HqFocus />
        <Upcoming />
        <OpportunitySummary />
        <section id="home-messages" className="mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7"><h2 className="text-xl font-black">MESSAGES / OPPORTUNITY INBOX</h2><OpportunityInbox /><a href="#opportunity-inbox" className="mt-3 inline-block text-xs underline">View All →</a></section>
        <section id="recent-media" className="mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7"><h2 className="text-xl font-black">RECENT MEDIA</h2><p className="mt-3 text-sm text-white/60">No videos uploaded.</p><a href="#media-library" className="mt-3 inline-block text-xs underline">Browse approved brand assets →</a></section>

        <section id="academics-module" aria-labelledby="academics-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">STUDENT FIRST</p>
          <h2 id="academics-title" className="mt-2 text-2xl font-black">ACADEMICS</h2>
          <p className="mt-1 text-sm text-white/65">Student. First. Athlete. Discipline in the classroom.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="h-[400px] overflow-hidden rounded-2xl"><PortalImage id="academics-1" asset="OFFICIAL_09_LIBRARY_STUDYING.png" alt="Tarris studying in the library" position="center" /></div>
            <div className="h-[400px] overflow-hidden rounded-2xl"><PortalImage id="academics-2" asset="OFFICIAL_07_FILM_TABLET.png" alt="Tarris reviewing film on a tablet" position="center" /></div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Focus on academic excellence, eligibility, and degree progress. Study hall tracking, tutor contacts, transcript vault live here.</p>
          <ModuleTools module="Academics" />
          <ModuleActions module="Academics" />
          <ProactiveEva module="Academics" />
        </section>

        <section id="training-module" aria-labelledby="training-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">PREPARE THE WORK</p>
          <h2 id="training-title" className="mt-2 text-2xl font-black">TRAINING</h2>
          <p className="mt-1 text-sm text-white/65">Prepare The Work. Determination on the court.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="h-[400px] overflow-hidden rounded-2xl"><PortalImage id="training-1" contain asset="OFFICIAL_06_CABLE_MACHINE.png" alt="Tarris training on a cable machine" position="center" /></div>
            <div className="h-[400px] overflow-hidden rounded-2xl"><PortalImage id="training-2" contain asset="OFFICIAL_02_BENCH_YELLOW_KOBE.png" alt="Tarris seated on the bench with yellow shoes visible" position="50% 30%" /></div>
          </div>
          <div className="mt-4 mx-auto aspect-[4/5] w-[400px] max-w-full overflow-hidden rounded-2xl"><PortalImage id="training-3" asset="OFFICIAL_11_KITCHEN_NUTRITION.png" alt="Tarris preparing nutrition in the kitchen, full head and face visible" position="50% 15%" /></div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Strength, conditioning, nutrition, recovery, film.</p>
          <ModuleTools module="Training" />
          <ModuleActions module="Training" />
          <ProactiveEva module="Training" />
        </section>

        <section id="nil-brand-module" aria-labelledby="nil-brand-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">SAME VISION · HIGHER PURPOSE</p>
          <h2 id="nil-brand-title" className="mt-2 text-2xl font-black">NIL &amp; BRAND</h2>
          <p className="mt-1 text-sm text-white/65">Meaningful Partnerships Around A Shared Vision.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="h-[500px] overflow-hidden rounded-2xl"><PortalImage id="nil-brand-1" asset="OFFICIAL_13_BLAZER_CHAIR.png" alt="Tarris in a blazer in a professional setting" position="55% 20%" /></div>
            <div className="h-[400px] overflow-hidden rounded-2xl"><PortalImage id="nil-brand-2" asset="OFFICIAL_10_CASUAL_LEAN.png" alt="Tarris in a casual outdoor portrait" position="center" /></div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Same vision. Higher purpose. Different on purpose. Brand guide, values, partnership criteria.</p>
          <div className="mt-4 flex flex-wrap gap-2"><ActionButton>Brand Deck PDF</ActionButton><ActionButton>Rate Card</ActionButton><ActionButton>Partnership Criteria</ActionButton><ActionButton>Inquiry Pipeline</ActionButton></div>
          <ModuleActions module="Brand" />
        </section>

        <section id="opportunities-module" aria-labelledby="opportunities-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">BUILD THE ENTERPRISE</p>
          <h2 id="opportunities-title" className="mt-2 text-2xl font-black">OPPORTUNITIES</h2>
          <p className="mt-1 text-sm text-white/65">Build The Enterprise. Turn attention into durable opportunity.</p>
          <div className="mx-auto mt-5 h-[400px] w-full max-w-[560px] overflow-hidden rounded-2xl"><PortalImage id="opportunities-hero" contain asset="OFFICIAL_15_PODIUM_SPEAKING.png" alt="Tarris speaking at a podium with the audience in view" position="50% 20%" /></div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Appearances, speaking, partnerships, earnings, and future enterprise.</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <article id="earnings-tracker" className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-5">
              <div className="flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Earnings Tracker</p><EarningsValue /></div><span aria-hidden="true" className="text-xl text-[#C41E3A]">↗</span></div>
              <EarningsBreakdown />
            </article>
            <article id="contracts-vault" className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Contracts Vault</p>
              <DocumentVault />
            </article>
            <OpportunityPipeline />
            <article id="opportunity-inbox" className="rounded-2xl bg-[#1A1A1A] p-5 lg:col-span-2"><h3 className="font-bold">OPPORTUNITY INBOX</h3><OpportunityInbox /></article>
          </div>
          <ProactiveEva module="Opportunity" />
        </section>

        <section id="future-module" aria-labelledby="future-title" className="mt-6 scroll-mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
          <div className="h-[500px] w-full overflow-hidden bg-black"><PortalImage id="future-tunnel" contain asset="OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png" alt="Tarris in the tunnel, BOUIE 4 jersey text and number visible" position="80% center" /></div>
          <div className="p-5 sm:p-7"><p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">THE NEXT CHAPTER</p><h2 id="future-title" className="mt-2 text-2xl font-black">FUTURE</h2><p className="mt-2 text-sm tracking-[0.18em] text-white/65">PLAN. PREPARE. PERFORM. BUILD.</p></div>
        </section>

        <section id="community-module" aria-labelledby="community-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">IMPACT BEYOND THE GAME</p>
          <h2 id="community-title" className="mt-2 text-2xl font-black">COMMUNITY</h2>
          <p className="mt-1 text-sm text-white/65">An Impact Beyond The Game.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="h-[400px] overflow-hidden rounded-2xl"><PortalImage id="community-1" asset="OFFICIAL_14_YOUTH_HUDDLE.png" alt="Tarris coaching a youth huddle" position="center" /></div>
            <div className="h-[400px] overflow-hidden rounded-2xl"><PortalImage id="community-2" asset="OFFICIAL_12_KIDS_ART.png" alt="Children creating art together" position="center" /></div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Youth clinics, mentorship, education initiatives.</p>
          <ModuleTools module="Community" />
          <ModuleActions module="Community" />
          <ProactiveEva module="Community" />
        </section>

        <CalendarModule />
        <section id="media-library" aria-labelledby="vault-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">TB3 HQ · MEDIA</p><h2 id="vault-title" className="mt-2 text-2xl font-black">BRAND ASSETS / Click to pull</h2><p className="mt-2 text-sm leading-6 text-white/65">Official high-resolution library. Click View Asset to load.</p></div><details id="vault-tooltip" className="relative"><summary aria-label="How vault works" className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full border border-white/30 text-sm font-bold">i</summary><p className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-white/15 bg-[#202020] p-4 text-xs leading-5 text-white/75">Click View Asset to pull the original image. These are the approved assets used on the public site. Vault previews do not auto-load.</p></details></div>
          <div className="mt-5 flex flex-col gap-3"><label><span className="sr-only">Search assets</span><input id="asset-search" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search assets..." className="w-full rounded-xl border border-white/15 bg-[#080808] px-4 py-3 text-sm text-white" /></label><div id="asset-filter" aria-label="Filter assets" className="flex flex-wrap gap-2">{filterOptions.map(category=><button key={category} type="button" aria-pressed={activeFilter===category} onClick={()=>setActiveFilter(category)} className={"rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider "+(activeFilter===category?"border-[#C41E3A] bg-[#C41E3A] text-white":"border-white/15 bg-white/5 text-white/70")}>{category} {category==="All"?officialAssets.length:officialAssets.filter(asset=>asset.category===category).length}</button>)}</div></div>
          <div id="asset-grid" className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">{filteredAssets.map(asset=><article key={asset.filename} className="flex min-h-[220px] flex-col rounded-xl border border-[#E5E5E5] bg-[#F5F5F0] p-4 text-[#111]"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-12 w-12 text-[#999]" fill="none" stroke="currentColor"><path d="M3 3h18v18H3V3m1 16 6-7 4 4 3-3 4 6M8 8h.01"/></svg><h3 className="mt-3 text-sm font-black uppercase">{asset.label}</h3><span className="mt-2 w-fit rounded-full bg-[#E5E5E5] px-3 py-1 text-[10px] font-bold uppercase">{asset.category}</span><p className="mt-3 text-xs text-[#666]">Click to view high-res</p><button type="button" onClick={()=>{setCopyNotice("");setSelectedAsset(asset);}} className="mt-4 w-fit rounded-lg bg-[#C41E3A] px-4 py-2 text-xs font-bold text-white" aria-label={"View Asset: "+asset.label}>View Asset →</button></article>)}</div>
          {!filteredAssets.length&&<p className="mt-5 text-sm text-white/60">No matching approved assets.</p>}
        </section>
        {selectedAsset&&<HqDialog id="asset-lightbox" title={selectedAsset.label} onClose={()=>setSelectedAsset(null)}><img id="asset-lightbox-image" src={"/images/tb3-official/"+selectedAsset.filename} alt={selectedAsset.alt} className="max-h-[65vh] w-full rounded-2xl object-contain"/><div className="mt-4 flex flex-wrap items-center gap-3"><span className="rounded-full bg-[#E5E5E5] px-3 py-1 text-[10px] font-bold uppercase">{selectedAsset.category}</span><p className="text-xs text-[#666]">Usage: Approved for NIL, social, editorial</p></div><div className="mt-4 flex gap-3"><a href={"/images/tb3-official/"+selectedAsset.filename} download={selectedAsset.filename} className="rounded-lg border border-black px-4 py-2 text-xs font-bold">Download HD</a><button type="button" onClick={()=>copyAssetLink(selectedAsset.filename)} className="rounded-lg border border-black px-4 py-2 text-xs font-bold">{copiedAsset===selectedAsset.filename?"Copied ✓":"Copy Link ⧉"}</button></div>{copyNotice&&<p role="status" className="mt-3 text-xs">{copyNotice}</p>}</HqDialog>}

        <section id="greater-tomorrow" className="mt-6 rounded-2xl border border-white/10 bg-[#111111] p-7"><p className="text-xs tracking-widest text-[#C41E3A]">A GREATER TOMORROW</p><h2 className="mt-3 text-3xl font-black">BUILD BEYOND THE GAME.</h2><a href="#future-module" className="mt-4 inline-block text-sm underline">Explore the next chapter →</a></section>
        <section id="tb3-store" className="mt-6 rounded-2xl bg-[#F5F5F0] p-5 text-[#111] sm:p-7"><p className="text-xs font-bold tracking-widest">TB3 STORE</p><h2 className="mt-2 text-3xl font-black">Rep the Vision.</h2><p className="mt-2 text-xs text-black/60">Product concepts. Store opening soon.</p><div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-5">{[
          ["MOCK_TEE_SHORT_RED.jpg", "TEE · RED"], ["MOCK_TEE_SHORT_WHITE.jpg", "TEE · WHITE"], ["MOCK_TEE_LONG_RED.jpg", "LONG SLEEVE · RED"], ["MOCK_TEE_LONG_WHITE.jpg", "LONG SLEEVE · WHITE"], ["MOCK_HAT_RED.jpg", "CAP · RED"], ["MOCK_HAT_WHITE.jpg", "CAP · WHITE"], ["MOCK_HOODIE_RED.jpg", "HOODIE · RED"], ["MOCK_HOODIE_WHITE.jpg", "HOODIE · WHITE"], ["MOCK_HOODIE_WHITE_LOGO_DETAIL_1.jpg", "HOODIE · SIGNATURE"], ["MOCK_SWEATSHIRT_WHITE_LOGO_DETAIL.jpg", "SWEATSHIRT · SIGNATURE"]
        ].map(([file, label]) => <article key={file}><div className="aspect-square rounded-2xl bg-white p-3"><img src={"/merch/" + file} alt={"TB3 " + label} loading="lazy" className="h-full w-full object-contain" /></div><h3 className="mt-3 text-xs font-bold">{label}</h3></article>)}</div><button disabled className="mt-5 rounded-lg border border-black px-5 py-3 text-xs font-bold">SHOP NOW · COMING SOON</button></section>

        <footer className="mt-8 border-t border-white/10 py-7">
          <p className="text-[10px] font-bold tracking-[0.18em] text-white/70">DISCIPLINE. DETERMINATION. DEVELOPMENT. DESTINY.</p>
          <p className="mt-2 text-[10px] tracking-[0.2em] text-[#C41E3A]">SAME VISION HIGHER PURPOSE</p>
        </footer>
      </main>

      <EvaPanel />
      <EvaFab />
    </div>
  );
}

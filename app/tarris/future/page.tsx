"use client";

import { useMemo, useState } from "react";

type AssetCategory = "Athlete" | "Academics" | "Brand" | "Community" | "Future";
type OfficialAsset = { filename: string; label: string; category: AssetCategory; alt: string };

const officialAssets: OfficialAsset[] = [
  { filename: "OFFICIAL_03_LOW_STANCE_ARENA.png", label: "LOW STANCE · ARENA", category: "Athlete", alt: "Tarris in a low dribble stance on court" },
  { filename: "OFFICIAL_04_BALL_OVER_SHOULDER.png", label: "BALL OVER SHOULDER", category: "Athlete", alt: "Tarris holding a basketball over his shoulder" },
  { filename: "OFFICIAL_02_BENCH_YELLOW_KOBE.png", label: "BENCH · YELLOW KOBE", category: "Athlete", alt: "Tarris seated on the bench wearing yellow Kobe shoes" },
  { filename: "OFFICIAL_06_CABLE_MACHINE.png", label: "CABLE MACHINE", category: "Athlete", alt: "Tarris training on a cable machine" },
  { filename: "OFFICIAL_09_LIBRARY_STUDYING.png", label: "LIBRARY · STUDYING", category: "Academics", alt: "Tarris studying in a library" },
  { filename: "OFFICIAL_07_FILM_TABLET.png", label: "FILM TABLET", category: "Academics", alt: "Tarris reviewing game film on a tablet" },
  { filename: "OFFICIAL_11_KITCHEN_NUTRITION.png", label: "KITCHEN · NUTRITION", category: "Athlete", alt: "Nutrition and wellness preparation" },
  { filename: "OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png", label: "HEADSHOT · WHITE JERSEY", category: "Brand", alt: "Tarris headshot in a white Alabama jersey" },
  { filename: "OFFICIAL_08_HEADSHOT_RED_BG.png", label: "HEADSHOT · RED BACKGROUND", category: "Brand", alt: "Tarris headshot on a red and black background" },
  { filename: "OFFICIAL_13_BLAZER_CHAIR.png", label: "BLAZER · PROFESSIONAL", category: "Brand", alt: "Tarris in a blazer in a professional setting" },
  { filename: "OFFICIAL_10_CASUAL_LEAN.png", label: "CASUAL · OUTDOOR", category: "Brand", alt: "Tarris in a casual outdoor portrait" },
  { filename: "OFFICIAL_14_YOUTH_HUDDLE.png", label: "YOUTH HUDDLE", category: "Community", alt: "Tarris coaching a youth huddle" },
  { filename: "OFFICIAL_12_KIDS_ART.png", label: "KIDS · ART", category: "Community", alt: "Children creating art together" },
  { filename: "OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png", label: "TUNNEL · BOUIE 4", category: "Future", alt: "Tarris in the tunnel with BOUIE and number 4 visible" },
  { filename: "OFFICIAL_15_PODIUM_SPEAKING.png", label: "PODIUM · SPEAKING", category: "Future", alt: "Tarris speaking at a podium" },
  { filename: "OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png", label: "TB3 · MORE THAN A GAME", category: "Brand", alt: "TB3 More Than a Game hero graphic" },
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

function FocusCard({
  id,
  title,
  status,
  detail,
  href,
}: {
  id: string;
  title: string;
  status: string;
  detail: string;
  href: string;
}) {
  return (
    <article id={id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-xs font-bold tracking-wider">{title}</h3>
      <p className="mt-3 text-sm font-semibold text-[#D6B76A]">{status}</p>
      <p className="mt-1 text-xs text-white/60">{detail}</p>
      <a href={href} className="mt-3 inline-block text-xs font-semibold text-white/75 underline underline-offset-4">→ {title === "NIL PIPELINE" ? "Opportunities" : title[0] + title.slice(1).toLowerCase()}</a>
    </article>
  );
}

export default function TarrisFuturePage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]>("All");
  const [copiedAsset, setCopiedAsset] = useState("");

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return officialAssets.filter(({ filename, label, category }) => {
      const categoryMatches = activeFilter === "All" || category === activeFilter;
      const queryMatches = !query || (filename + " " + label + " " + category).toLowerCase().includes(query);
      return categoryMatches && queryMatches;
    });
  }, [search, activeFilter]);

  async function copyAssetLink(filename: string) {
    const link = window.location.origin + "/images/tb3-official/" + filename;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedAsset(filename);
      window.setTimeout(() => setCopiedAsset(""), 1600);
    } catch {
      setCopiedAsset("");
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F7F5F2] lg:flex">
      <aside className="border-b border-white/10 bg-[#111111] p-5 lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4">
          <a href="#hq-home" aria-label="TB3 HQ Home" className="flex items-center gap-2">
            <span className="text-3xl font-black leading-none tracking-[-0.1em] text-[#A51C30]">TB3</span>
            <span className="border-l border-white/20 pl-2 text-xs font-black tracking-[0.18em]">HQ</span>
          </a>
          <div className="h-12 w-12 overflow-hidden rounded-full border border-white/20">
            <PortalImage id="hq-profile-avatar" asset="OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png" alt="Tarris Bouie profile photo" position="50% 15%" />
          </div>
        </div>
        <p className="mt-3 text-[9px] tracking-[0.28em] text-white/50">TARRIS BOUIE</p>
        <nav aria-label="TB3 HQ navigation" className="mt-6 grid grid-cols-2 gap-1 text-sm sm:grid-cols-4 lg:block lg:space-y-1">
          <a href="#hq-home" className="rounded bg-white px-3 py-2 font-bold text-black">Home</a>
          <a href="#my-journey-module" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">My Journey</a>
          <a href="#academics-module" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">Academics</a>
          <a href="#training-module" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">Training</a>
          <a href="#nil-brand-module" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">NIL &amp; Brand</a>
          <a href="#opportunities-module" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">Opportunities</a>
          <a href="#media-library-vault" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">Media Library</a>
          <a href="#community-module" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">Community</a>
        </nav>
        <div className="mt-8 hidden text-[10px] leading-6 tracking-[0.16em] text-white/45 lg:block">
          DISCIPLINE.<br />DETERMINATION.<br />DEVELOPMENT.<br />DESTINY.
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-8 lg:ml-64 lg:px-10">
        <section id="hq-home" className="scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-8">
          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-center">
            <div className="max-w-2xl">
              <p className="text-xs tracking-[0.25em] text-white/60">WELCOME TO</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">TB3 <span className="text-[#C41E3A]">HQ</span></h1>
              <p className="mt-3 text-xs tracking-[0.25em] text-white/60">PLAN. PREPARE. PERFORM. BUILD.</p>
              <p className="mt-6 max-w-xl text-lg italic text-white/80">“A bigger purpose than basketball.”</p>
              <a href="#future-module" className="mt-5 inline-block text-xs font-bold uppercase tracking-[0.18em] text-[#E2A8B2] underline underline-offset-4">Explore the next chapter →</a>
            </div>
            <div className="aspect-video w-full max-w-lg overflow-hidden rounded-xl bg-[#0A0A0A]">
              <PortalImage id="hq-hero" asset="OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png" alt="TB3 More Than a Game hero graphic" contain />
            </div>
          </div>
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

        <section aria-labelledby="focus-title" className="mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <h2 id="focus-title" className="text-xl font-black">MY FOCUS</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FocusCard id="focus-academics" title="ACADEMICS" status="On Track" detail="Study hall + Film" href="#academics-module" />
            <FocusCard id="focus-training" title="TRAINING" status="In Season" detail="Strength + Recovery" href="#training-module" />
            <FocusCard id="focus-nil" title="NIL PIPELINE" status="3 Active" detail="View Opportunities" href="#opportunities-module" />
            <FocusCard id="focus-community" title="COMMUNITY" status="Next Clinic TBA" detail="Impact beyond game" href="#community-module" />
          </div>
        </section>

        <section id="upcoming-calendar" aria-labelledby="upcoming-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <h2 id="upcoming-title" className="text-xl font-black">UPCOMING</h2>
          <div className="mt-4 rounded-xl border border-dashed border-white/20 p-5">
            <p className="text-xs tracking-wider text-white/60">CALENDAR PLACEHOLDER · CONNECT GOOGLE CALENDAR</p>
            <p className="mt-3 text-sm">No events scheduled - Add appearance in Opportunities</p>
            <a href="#opportunities-module" className="mt-4 inline-flex rounded bg-[#A51C30] px-4 py-2 text-xs font-bold text-white">Add Appearance</a>
          </div>
        </section>

        <section id="academics-module" aria-labelledby="academics-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">STUDENT FIRST</p>
          <h2 id="academics-title" className="mt-2 text-2xl font-black">ACADEMICS</h2>
          <p className="mt-1 text-sm text-white/65">Student. First. Athlete. Discipline in the classroom.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="h-[400px] overflow-hidden rounded-2xl"><PortalImage id="academics-1" asset="OFFICIAL_09_LIBRARY_STUDYING.png" alt="Tarris studying in the library" position="center" /></div>
            <div className="h-[400px] overflow-hidden rounded-2xl"><PortalImage id="academics-2" asset="OFFICIAL_07_FILM_TABLET.png" alt="Tarris reviewing film on a tablet" position="center" /></div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Focus on academic excellence, eligibility, and degree progress. Study hall tracking, tutor contacts, transcript vault live here.</p>
          <div className="mt-4 flex flex-wrap gap-2"><ActionButton>Study Hall Log</ActionButton><ActionButton>Tutor Contacts</ActionButton><ActionButton>Transcript Vault</ActionButton></div>
        </section>

        <section id="training-module" aria-labelledby="training-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">PREPARE THE WORK</p>
          <h2 id="training-title" className="mt-2 text-2xl font-black">TRAINING</h2>
          <p className="mt-1 text-sm text-white/65">Prepare The Work. Determination on the court.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="h-[400px] overflow-hidden rounded-2xl"><PortalImage id="training-1" asset="OFFICIAL_06_CABLE_MACHINE.png" alt="Tarris training on a cable machine with yellow shoes visible" position="50% 30%" /></div>
            <div className="h-[400px] overflow-hidden rounded-2xl"><PortalImage id="training-2" asset="OFFICIAL_02_BENCH_YELLOW_KOBE.png" alt="Tarris seated on the bench with yellow shoes visible" position="50% 30%" /></div>
          </div>
          <div className="mt-4 h-[300px] max-w-2xl overflow-hidden rounded-2xl"><PortalImage id="training-3" asset="OFFICIAL_11_KITCHEN_NUTRITION.png" alt="Nutrition and wellness preparation" position="center" /></div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Strength, conditioning, nutrition, recovery, film.</p>
          <div className="mt-4 flex flex-wrap gap-2"><ActionButton>Weekly Plan</ActionButton><ActionButton>Nutrition Log</ActionButton><ActionButton>Film Notes - EVA</ActionButton></div>
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
          <div className="mt-4 flex flex-wrap gap-2"><ActionButton>Brand Deck PDF</ActionButton><ActionButton>Rate Card</ActionButton><ActionButton>Inquiry Pipeline</ActionButton></div>
        </section>

        <section id="opportunities-module" aria-labelledby="opportunities-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">BUILD THE ENTERPRISE</p>
          <h2 id="opportunities-title" className="mt-2 text-2xl font-black">OPPORTUNITIES</h2>
          <p className="mt-1 text-sm text-white/65">Build The Enterprise. Turn attention into durable opportunity.</p>
          <div className="mt-5 h-[400px] overflow-hidden rounded-2xl"><PortalImage id="opportunities-hero" asset="OFFICIAL_15_PODIUM_SPEAKING.png" alt="Tarris speaking at a podium with the audience in view" position="50% 20%" /></div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Appearances, speaking, partnerships, earnings, and future enterprise.</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <article id="earnings-tracker" className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-5">
              <div className="flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Earnings Tracker</p><p className="mt-3 text-2xl font-black">$0 Tracked</p><p className="mt-1 text-xs text-white/60">0 Opportunities</p></div><span aria-hidden="true" className="text-xl text-[#C41E3A]">↗</span></div>
              <div aria-label="Chart placeholder" className="mt-5 flex h-24 items-end gap-2 border-b border-white/10 px-1"><span className="h-5 flex-1 rounded-t bg-white/15"></span><span className="h-8 flex-1 rounded-t bg-white/15"></span><span className="h-6 flex-1 rounded-t bg-white/15"></span><span className="h-12 flex-1 rounded-t bg-white/15"></span><span className="h-10 flex-1 rounded-t bg-white/15"></span><span className="h-16 flex-1 rounded-t bg-white/15"></span><span className="h-9 flex-1 rounded-t bg-white/15"></span></div>
              <button type="button" disabled className="mt-4 rounded border border-white/25 px-4 py-2 text-xs font-semibold text-white/80 opacity-80">View Breakdown</button>
            </article>
            <article id="contracts-vault" className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Contracts Vault</p>
              <p className="mt-2 text-sm">Organize partnership agreements here.</p>
              <ul className="mt-4 space-y-3 text-xs text-white/70">
                <li className="flex items-center gap-3"><span aria-hidden="true" className="text-lg text-[#C41E3A]">▱</span>Partnership agreements</li>
                <li className="flex items-center gap-3"><span aria-hidden="true" className="text-lg text-[#C41E3A]">▱</span>Appearance contracts</li>
                <li className="flex items-center gap-3"><span aria-hidden="true" className="text-lg text-[#C41E3A]">▱</span>Brand documents</li>
              </ul>
              <button type="button" disabled className="mt-4 rounded border border-white/25 px-4 py-2 text-xs font-semibold text-white/80 opacity-80">Upload Agreement</button>
            </article>
            <article id="appearance-calendar" className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-5 lg:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Appearance Calendar</p>
              <p className="mt-2 text-sm">Calendar widget placeholder</p>
              <div className="mt-4 grid min-h-24 place-items-center rounded-xl border border-dashed border-white/20 text-xs text-white/50">Calendar connection placeholder</div>
            </article>
          </div>
        </section>

        <section id="future-module" aria-labelledby="future-title" className="mt-6 scroll-mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
          <div className="h-[500px] w-full overflow-hidden bg-black"><PortalImage id="future-tunnel" asset="OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png" alt="Tarris in the tunnel, BOUIE 4 jersey text and number visible" position="80% center" /></div>
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
          <div className="mt-4 flex flex-wrap gap-2"><ActionButton>Past Events</ActionButton><ActionButton>Upcoming Clinic</ActionButton><ActionButton>Impact Metrics</ActionButton></div>
        </section>

        <section id="media-library-vault" aria-labelledby="vault-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">TB3 HQ · MEDIA</p><h2 id="vault-title" className="mt-2 text-2xl font-black">BRAND ASSETS</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">Official high-resolution library. Public site /tarris pulls from here. Partners download from this vault.</p></div>
            <details id="vault-tooltip" className="relative">
              <summary aria-label="How this vault works" className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full border border-white/30 text-sm font-bold">i</summary>
              <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-white/15 bg-[#202020] p-4 text-xs leading-5 text-white/75 shadow-xl">How this works: This vault is the master. Public site pulls images from here. When you update here, it updates everywhere. Partners click Download HD to get high-res with usage rights.</div>
            </details>
          </div>
          <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <label className="block min-w-0 flex-1">
              <span className="sr-only">Search assets</span>
              <input id="asset-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assets..." className="w-full rounded-xl border border-white/15 bg-[#080808] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#C41E3A] focus:outline-none" />
            </label>
            <div id="asset-filter" aria-label="Filter assets" className="flex flex-wrap gap-2">
              {filterOptions.map((category) => <button key={category} type="button" aria-pressed={activeFilter === category} onClick={() => setActiveFilter(category)} className={"rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition " + (activeFilter === category ? "border-[#A51C30] bg-[#A51C30] text-white" : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10")}>{category}</button>)}
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredAssets.map(({ filename, label, category, alt }, index) => {
              const assetPath = "/images/tb3-official/" + filename;
              const isHero = filename.startsWith("OFFICIAL_00_");
              const isHeadshot = filename.includes("HEADSHOT");
              const position = isHeadshot ? "50% 15%" : filename.includes("TUNNEL") ? "80% center" : "center";
              return (
                <article key={filename} className="overflow-hidden rounded-xl border border-black/10 bg-[#F5F5F0] text-[#111111] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                  <div className="h-[280px] overflow-hidden bg-[#E5E5E0]">
                    <PortalImage id={"vault-image-" + (index + 1)} asset={filename} alt={alt} position={position} contain={isHero} className={isHero ? "bg-[#0A0A0A]" : ""} />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-black uppercase tracking-wide">{label}</h3>
                    <span className="mt-2 inline-flex rounded-full bg-[#E5E5E5] px-3 py-1 text-[10px] font-bold uppercase tracking-wider">{category}</span>
                    <p className="mt-3 text-xs text-[#666666]">Usage: Approved for NIL, social, editorial</p>
                    <div className="mt-4 flex items-center gap-2">
                      <a href={assetPath} download={filename} className="inline-flex rounded-lg border border-black px-3 py-2 text-[10px] font-bold text-black hover:bg-black hover:text-white">Download HD</a>
                      <button type="button" aria-label={"Copy link for " + label} onClick={() => copyAssetLink(filename)} className="grid h-9 w-9 place-items-center rounded-lg border border-black text-sm hover:bg-black hover:text-white" title={copiedAsset === filename ? "Link copied" : "Copy link"}>{copiedAsset === filename ? "✓" : "⧉"}</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {filteredAssets.length === 0 && <p className="mt-5 rounded-xl bg-white/5 p-4 text-sm text-white/60">No matching approved assets.</p>}
        </section>

        <footer className="mt-8 border-t border-white/10 py-7">
          <p className="text-[10px] font-bold tracking-[0.18em] text-white/70">DISCIPLINE. DETERMINATION. DEVELOPMENT. DESTINY.</p>
          <p className="mt-2 text-[10px] tracking-[0.2em] text-[#C41E3A]">SAME VISION HIGHER PURPOSE</p>
        </footer>
      </main>

      <details id="eva-bubble" className="fixed bottom-5 right-5 z-[100]">
        <summary aria-label="Open EVA assistant" className="grid h-12 w-12 cursor-pointer list-none place-items-center rounded-full border border-[#C41E3A] bg-[#A51C30] text-[10px] font-black shadow-xl">EVA</summary>
        <div className="absolute bottom-14 right-0 w-64 rounded-2xl border border-white/15 bg-[#171717] p-4 text-xs leading-5 text-white/80 shadow-2xl">Ask EVA about your brand, calendar, or opportunities.</div>
      </details>
    </div>
  );
}

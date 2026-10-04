"use client";

import { useMemo, useState } from "react";

const officialAssets = [
  { filename: "OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png", category: "Brand" },
  { filename: "OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png", category: "Brand" },
  { filename: "OFFICIAL_02_BENCH_YELLOW_KOBE.png", category: "Training" },
  { filename: "OFFICIAL_03_LOW_STANCE_ARENA.png", category: "Athlete" },
  { filename: "OFFICIAL_04_BALL_OVER_SHOULDER.png", category: "Athlete" },
  { filename: "OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png", category: "Future" },
  { filename: "OFFICIAL_06_CABLE_MACHINE.png", category: "Training" },
  { filename: "OFFICIAL_07_FILM_TABLET.png", category: "Academics" },
  { filename: "OFFICIAL_08_HEADSHOT_RED_BG.png", category: "Brand" },
  { filename: "OFFICIAL_09_LIBRARY_STUDYING.png", category: "Academics" },
  { filename: "OFFICIAL_10_CASUAL_LEAN.png", category: "Brand" },
  { filename: "OFFICIAL_11_KITCHEN_NUTRITION.png", category: "Training" },
  { filename: "OFFICIAL_12_KIDS_ART.png", category: "Community" },
  { filename: "OFFICIAL_13_BLAZER_CHAIR.png", category: "Brand" },
  { filename: "OFFICIAL_14_YOUTH_HUDDLE.png", category: "Community" },
  { filename: "OFFICIAL_15_PODIUM_SPEAKING.png", category: "Enterprise" },
];

function PortalImage({
  id,
  asset,
  alt,
  position = "50% 50%",
  className = "",
  contain = false,
  slotId,
}: {
  id: string;
  asset: string;
  alt: string;
  position?: string;
  className?: string;
  contain?: boolean;
  slotId?: string;
}) {
  return (
    <img
      id={id}
      data-asset-slot={slotId}
      src={`/images/tb3-official/${asset}`}
      alt={alt}
      style={{ objectPosition: position }}
      className={`h-full w-full ${contain ? "object-contain" : "object-cover"} ${className}`}
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

export default function TarrisFuturePage() {
  const [search, setSearch] = useState("");
  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return officialAssets;
    return officialAssets.filter(({ filename, category }) => `${filename} ${category}`.toLowerCase().includes(query));
  }, [search]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F7F5F2] lg:flex">
      <aside className="border-b border-white/10 bg-[#111111] p-5 lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4">
          <a href="#hq-home" aria-label="TB3 HQ Home" className="flex items-center gap-2">
            <span className="text-3xl font-black leading-none tracking-[-0.1em] text-[#A51C30]">TB3</span>
            <span className="border-l border-white/20 pl-2 text-xs font-black tracking-[0.18em]">HQ</span>
          </a>
          <PortalImage
            id="hq-profile-avatar"
            asset="OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png"
            alt="Tarris Bouie profile photo"
            position="50% 15%"
            className="h-12 w-12 rounded-full border border-white/20"
          />
        </div>
        <p className="mt-3 text-[9px] tracking-[0.28em] text-white/50">TARRIS BOUIE</p>
        <nav aria-label="TB3 HQ navigation" className="mt-6 grid grid-cols-2 gap-1 text-sm sm:grid-cols-4 lg:block lg:space-y-1">
          <a href="#hq-home" className="rounded bg-white px-3 py-2 font-bold text-black">Home</a>
          <a href="#hq-journey" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">My Journey</a>
          <a href="#hq-academics" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">Academics</a>
          <a href="#hq-training" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">Training</a>
          <a href="#hq-nil-brand" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">NIL &amp; Brand</a>
          <a href="#hq-opportunities" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">Opportunities</a>
          <a href="#hq-media-library" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">Media Library</a>
          <a href="#hq-community" className="block rounded px-3 py-2 text-white/70 hover:bg-white/10">Community</a>
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
            </div>
            <div className="aspect-video w-full max-w-lg overflow-hidden bg-[#0A0A0A]">
              <PortalImage id="hq-hero" asset="OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png" alt="TB3 More Than a Game hero graphic" contain />
            </div>
          </div>
        </section>

        <section id="hq-journey" aria-labelledby="hq-journey-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.24em] text-[#C41E3A]">MY JOURNEY</p>
          <h2 id="hq-journey-title" className="mt-2 text-2xl font-black sm:text-3xl">THE JOURNEY CONTINUES.</h2>
          <p className="mt-2 text-sm text-white/65">Charlotte. Spire. Alabama. Next. Every stop added something.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-black"><PortalImage id="hq-journey-1" asset="OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png" alt="Tarris headshot in Alabama gear" position="50% 15%" /></div>
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-black"><PortalImage id="hq-journey-2" asset="OFFICIAL_08_HEADSHOT_RED_BG.png" alt="Tarris headshot on red and black background" position="50% 15%" /></div>
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-black"><PortalImage id="hq-journey-3" asset="OFFICIAL_03_LOW_STANCE_ARENA.png" alt="Tarris in a low stance on court" /></div>
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-black"><PortalImage id="hq-journey-4" asset="OFFICIAL_04_BALL_OVER_SHOULDER.png" alt="Tarris with a basketball over his shoulder" /></div>
          </div>
          <div className="mt-5 grid gap-3 text-xs sm:grid-cols-4">
            <p className="rounded-lg bg-white/5 p-3"><strong>CHARLOTTE</strong><br /><span className="text-white/60">Foundation</span></p>
            <p className="rounded-lg bg-white/5 p-3"><strong>SPIRE</strong><br /><span className="text-white/60">Development</span></p>
            <p className="rounded-lg bg-white/5 p-3"><strong>ALABAMA</strong><br /><span className="text-white/60">Visibility</span></p>
            <p className="rounded-lg bg-white/5 p-3"><strong>NEXT</strong><br /><span className="text-white/60">Possibility</span></p>
          </div>
        </section>

        <section aria-labelledby="hq-focus-title" className="mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <h2 id="hq-focus-title" className="text-xl font-black">MY FOCUS</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4"><h3 className="text-xs font-bold tracking-wider">ACADEMICS</h3><p className="mt-3 text-sm font-semibold text-[#D6B76A]">On Track</p><p className="mt-1 text-xs text-white/60">Study hall + Film</p></article>
            <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4"><h3 className="text-xs font-bold tracking-wider">TRAINING</h3><p className="mt-3 text-sm font-semibold text-[#D6B76A]">In Season</p><p className="mt-1 text-xs text-white/60">Strength + Recovery</p></article>
            <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4"><h3 className="text-xs font-bold tracking-wider">NIL PIPELINE</h3><p className="mt-3 text-sm font-semibold text-[#D6B76A]">3 Active Inquiries</p><a href="#hq-opportunities" className="mt-1 inline-block text-xs text-white/60 underline">View Opportunities</a></article>
            <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4"><h3 className="text-xs font-bold tracking-wider">COMMUNITY</h3><p className="mt-3 text-sm font-semibold text-[#D6B76A]">Next Clinic TBA</p><p className="mt-1 text-xs text-white/60">Impact beyond game</p></article>
          </div>
        </section>

        <section id="hq-upcoming" aria-labelledby="hq-upcoming-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <h2 id="hq-upcoming-title" className="text-xl font-black">UPCOMING</h2>
          <div className="mt-4 rounded-lg border border-dashed border-white/20 p-5">
            <p className="text-xs tracking-wider text-white/60">CALENDAR WIDGET PLACEHOLDER · CONNECT GOOGLE CALENDAR</p>
            <p className="mt-3 text-sm">No events scheduled - Add appearance in Opportunities</p>
          </div>
        </section>

        <section id="hq-academics" aria-labelledby="hq-academics-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">STUDENT FIRST</p>
          <h2 id="hq-academics-title" className="mt-2 text-2xl font-black">ACADEMICS</h2>
          <p className="mt-1 text-sm text-white/65">Student. First. Athlete. Discipline in the classroom.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="aspect-[4/3] overflow-hidden rounded-lg"><PortalImage id="hq-academics-primary" asset="OFFICIAL_09_LIBRARY_STUDYING.png" alt="Tarris studying in the library" position="50% 20%" /></div>
            <div className="aspect-[4/3] overflow-hidden rounded-lg"><PortalImage id="hq-academics-film" asset="OFFICIAL_07_FILM_TABLET.png" alt="Tarris reviewing film on a tablet" /></div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Focus on academic excellence, eligibility, and development. Study hall tracking, tutor contacts, and degree progress live here.</p>
          <div className="mt-4 flex flex-wrap gap-2"><ActionButton>View Transcripts</ActionButton><ActionButton>Tutor Contacts</ActionButton><ActionButton>Study Hall Log</ActionButton></div>
        </section>

        <section id="hq-training" aria-labelledby="hq-training-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">PREPARE THE WORK</p>
          <h2 id="hq-training-title" className="mt-2 text-2xl font-black">TRAINING</h2>
          <p className="mt-1 text-sm text-white/65">Prepare The Work. Determination on the court.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="aspect-[4/3] overflow-hidden rounded-lg"><PortalImage id="hq-training-primary" asset="OFFICIAL_06_CABLE_MACHINE.png" alt="Tarris training on a cable machine" position="50% 30%" /></div>
            <div className="aspect-[4/3] overflow-hidden rounded-lg"><PortalImage id="hq-training-secondary" asset="OFFICIAL_02_BENCH_YELLOW_KOBE.png" alt="Tarris seated on the training bench" position="50% 30%" /></div>
            <div className="aspect-[4/3] overflow-hidden rounded-lg"><PortalImage id="hq-nutrition" asset="OFFICIAL_11_KITCHEN_NUTRITION.png" alt="Tarris preparing nutrition at home" /></div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Strength, conditioning, nutrition, recovery, and film. The work that builds the brand.</p>
          <div className="mt-4 flex flex-wrap gap-2"><ActionButton>Weekly Plan</ActionButton><ActionButton>Nutrition Log</ActionButton><ActionButton>Film Notes - EVA</ActionButton></div>
        </section>

        <section id="hq-nil-brand" aria-labelledby="hq-nil-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">SAME VISION · HIGHER PURPOSE</p>
          <h2 id="hq-nil-title" className="mt-2 text-2xl font-black">NIL &amp; BRAND</h2>
          <p className="mt-1 text-sm text-white/65">Meaningful Partnerships Around A Shared Vision.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="aspect-[4/3] overflow-hidden rounded-lg"><PortalImage id="hq-nil-brand-image" slotId="hq-nil-brand" asset="OFFICIAL_13_BLAZER_CHAIR.png" alt="Tarris in a blazer in a professional setting" position="55% 20%" /></div>
            <div className="aspect-[4/3] overflow-hidden rounded-lg"><PortalImage id="hq-nil-lifestyle" asset="OFFICIAL_10_CASUAL_LEAN.png" alt="Tarris in a casual outdoor portrait" /></div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Same vision. Higher purpose. Different on purpose. Brand guide, values, partnership criteria, and active brand deck.</p>
          <div className="mt-4 flex flex-wrap gap-2"><ActionButton>Brand Deck PDF</ActionButton><ActionButton>Rate Card</ActionButton><ActionButton>Inquiry Pipeline</ActionButton></div>
        </section>

        <section id="hq-opportunities" aria-labelledby="hq-opportunities-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">BUILD THE ENTERPRISE</p>
          <h2 id="hq-opportunities-title" className="mt-2 text-2xl font-black">OPPORTUNITIES</h2>
          <p className="mt-1 text-sm text-white/65">Build The Enterprise. Turn attention into durable opportunity.</p>
          <div className="mt-5 aspect-[16/7] max-h-[420px] overflow-hidden rounded-lg"><PortalImage id="hq-opportunities-enterprise" asset="OFFICIAL_15_PODIUM_SPEAKING.png" alt="Tarris speaking at a podium" /></div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Appearances, speaking, partnerships, earnings, and future enterprise.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-lg bg-white/5 p-4"><h3 className="text-xs font-bold">Earnings Tracker</h3><p className="mt-2 text-xs text-white/55">Track opportunities and earnings here.</p></article>
            <article className="rounded-lg bg-white/5 p-4"><h3 className="text-xs font-bold">Contracts Vault</h3><p className="mt-2 text-xs text-white/55">Organize partnership agreements here.</p></article>
            <article className="rounded-lg bg-white/5 p-4"><h3 className="text-xs font-bold">Appearance Calendar</h3><p className="mt-2 text-xs text-white/55">Plan appearances and events here.</p></article>
            <article className="rounded-lg bg-white/5 p-4"><h3 className="text-xs font-bold">Ask EVA</h3><p className="mt-2 text-xs text-white/55">What opportunities are inbound?</p></article>
          </div>
        </section>

        <section id="hq-media-library" aria-labelledby="hq-media-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">OFFICIAL TB3 FILES</p>
          <h2 id="hq-media-title" className="mt-2 text-2xl font-black">MEDIA LIBRARY</h2>
          <p className="mt-1 text-sm text-white/65">Approved Assets - 16 Official Images</p>
          <label className="mt-5 block">
            <span className="sr-only">Search media assets</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assets: Academics, Training, Brand, Community..."
              className="w-full rounded-lg border border-white/15 bg-[#080808] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#C41E3A] focus:outline-none"
            />
          </label>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {filteredAssets.map(({ filename, category }, index) => {
              const assetPath = `/images/tb3-official/${filename}`;
              const isHero = filename.startsWith("OFFICIAL_00_");
              const isHeadshot = filename.includes("HEADSHOT");
              return (
                <article key={filename} className="overflow-hidden rounded-lg border border-white/10 bg-black">
                  <div className={`aspect-square overflow-hidden ${isHero ? "bg-[#0A0A0A]" : "bg-[#1B1B1B]"}`}>
                    <PortalImage id={`hq-library-thumb-${index + 1}`} asset={filename} alt={`${category} asset ${filename}`} contain={isHero} position={isHeadshot ? "50% 15%" : "50% 50%"} />
                  </div>
                  <div className="p-3">
                    <p className="break-all text-[10px] font-semibold leading-4 text-white/85">{filename}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-white/45">{category}</p>
                    <a href={assetPath} download={filename} className="mt-3 inline-flex rounded border border-white/20 px-3 py-1.5 text-[10px] font-bold hover:bg-white/10">Download</a>
                  </div>
                </article>
              );
            })}
          </div>
          {filteredAssets.length === 0 && <p className="mt-5 text-sm text-white/60">No matching official assets.</p>}
        </section>

        <section id="hq-community" aria-labelledby="hq-community-title" className="mt-6 scroll-mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] tracking-[0.22em] text-[#C41E3A]">IMPACT BEYOND THE GAME</p>
          <h2 id="hq-community-title" className="mt-2 text-2xl font-black">COMMUNITY</h2>
          <p className="mt-1 text-sm text-white/65">An Impact Beyond The Game.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="aspect-[4/3] overflow-hidden rounded-lg"><PortalImage id="hq-community-youth" asset="OFFICIAL_14_YOUTH_HUDDLE.png" alt="Tarris coaching a youth huddle" /></div>
            <div className="aspect-[4/3] overflow-hidden rounded-lg"><PortalImage id="hq-community-education" asset="OFFICIAL_12_KIDS_ART.png" alt="Young people working on art together" /></div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">Youth clinics, mentorship, education initiatives, and community appearances.</p>
          <div className="mt-4 flex flex-wrap gap-2"><ActionButton>Past Events</ActionButton><ActionButton>Upcoming Clinic</ActionButton><ActionButton>Impact Metrics</ActionButton></div>
        </section>

        <footer className="mt-8 border-t border-white/10 py-7">
          <p className="text-[10px] font-bold tracking-[0.18em] text-white/70">DISCIPLINE. DETERMINATION. DEVELOPMENT. DESTINY.</p>
          <p className="mt-2 text-[10px] tracking-[0.2em] text-[#C41E3A]">SAME VISION HIGHER PURPOSE</p>
        </footer>
      </main>

      <div role="note" aria-label="EVA assistant" className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-[#C41E3A]/60 bg-[#111111] px-4 py-3 shadow-2xl">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#A51C30] text-xs font-black">EVA</span>
        <span className="text-[11px] leading-4">Ask EVA about your brand, calendar, or opportunities</span>
      </div>
    </div>
  );
}

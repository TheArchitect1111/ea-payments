"use client";
// Public TB3 story and storefront. Official images are single-use on this surface.
// WIRED: TB3 / -> /tarris -> ENTER TB3 HQ -> /tarris/future.
import Link from "next/link";
import { ChassisPreview } from "./chassis-preview";
import { tb3MerchCatalog as merchCatalog } from "@/lib/tb3/merch-catalog";
import { Tb3FilmGrid } from "./tb3-film";
import { useEffect, type ReactNode } from "react";

const pillars = [
  ["ATHLETE", "Discipline in the classroom. Determination on the court.", "LEARN MORE"],
  ["STORY", "The journey behind the jersey. A bigger purpose than basketball.", "WATCH THE STORY"],
  ["BRAND", "Same vision. Higher purpose. Different on purpose.", "LEARN MORE"],
  ["NIL", "Meaningful partnerships around a shared vision.", "NIL INQUIRIES"],
  ["COMMUNITY", "An impact beyond the game.", "LEARN MORE"],
];
const pillarAssets: Record<string, ImageAsset[]> = {
  ATHLETE: [
    { id: "athlete-primary", asset: "OFFICIAL_03_LOW_STANCE_ARENA.png", alt: "Tarris in a low dribble stance on court", ratio: "aspect-[4/3]" },
    { id: "athlete-secondary", asset: "OFFICIAL_04_BALL_OVER_SHOULDER.png", alt: "Tarris holding the ball over his shoulder", ratio: "aspect-[4/3]" },
    { id: "training-primary", asset: "OFFICIAL_06_CABLE_MACHINE.png", alt: "Tarris training on a cable machine", ratio: "aspect-[4/3]" },
    { id: "training-secondary", asset: "OFFICIAL_02_BENCH_YELLOW_KOBE.png", alt: "Tarris seated on the training bench", ratio: "aspect-[4/3]" },
  ],
  STORY: [
    { id: "story-primary", asset: "OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png", alt: "Tarris walking through the tunnel, BOUIE 4 visible", ratio: "aspect-[4/3]" },
    { id: "story-secondary", asset: "OFFICIAL_13_BLAZER_CHAIR.png", alt: "Tarris in a blazer in a professional setting", ratio: "aspect-[4/3]" },
  ],
  BRAND: [
    { id: "brand-primary", asset: "OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png", alt: "Tarris headshot in Alabama gear", ratio: "aspect-square" },
    { id: "brand-secondary", asset: "OFFICIAL_08_HEADSHOT_RED_BG.png", alt: "Tarris headshot on a red and black background", ratio: "aspect-square" },
  ],
  NIL: [{ id: "nil-primary", asset: "OFFICIAL_10_CASUAL_LEAN.png", alt: "Tarris in a casual outdoor portrait", ratio: "aspect-[4/3]" }],
  COMMUNITY: [
    { id: "community-primary", asset: "OFFICIAL_14_YOUTH_HUDDLE.png", alt: "Tarris coaching a youth huddle", ratio: "aspect-[4/3]" },
    { id: "community-secondary", asset: "OFFICIAL_12_KIDS_ART.png", alt: "Young people working on art together", ratio: "aspect-[4/3]" },
  ],
};
const merchProducts = merchCatalog;
const nav = ["HOME", "ATHLETE", "STORY", "BRAND", "NIL", "COMMUNITY", "MEDIA", "MERCH", "FUTURE"];

type ImageAsset = { id: string; asset: string; alt: string; ratio?: string };
function ImageSlot({ id, asset, alt, ratio = "aspect-[4/5]", hero = false }: ImageAsset & { hero?: boolean }) {
  const positions: Record<string, string> = {
    "athlete-primary": "50% 35%",
    "athlete-secondary": "center top",
    "story-primary": "80% center",
    "story-secondary": "55% 20%",
    "training-primary": "50% 30%",
    "training-secondary": "50% 30%",
    "academics-primary": "50% 20%",
    "enterprise-only": "50% 20%",
  };
  const objectPosition = asset.includes("HEADSHOT") ? "50% 15%" : positions[id] ?? "center";
  return <div className={`relative w-full ${ratio} overflow-hidden ${hero ? "bg-[#0A0A0A]" : ""}`}>
    <img id={id} src={`/images/tb3-official/${asset}`} alt={alt} style={{ objectPosition }} className={`absolute inset-0 h-full w-full ${hero ? "object-contain" : "object-cover"}`} loading={hero ? "eager" : "lazy"} />
  </div>;
}
function MerchProductCard({ product, index }: { product: (typeof merchProducts)[number]; index: number }) {
  return <article className="min-w-0 overflow-hidden rounded-2xl border border-black/[0.08] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,.1)]" data-product-id={product.id}>
    <div id={`merch-${index + 1}`} className="relative aspect-[4/5] overflow-hidden bg-[#F1F0ED] p-4 sm:p-6">
      <span className="absolute left-3 top-3 z-10 rounded-full border border-black/10 bg-white/85 px-2.5 py-1 text-[8px] font-bold tracking-[0.16em] text-black/60">TB3 · DROP 01</span>
      <img src={product.image} alt={product.name} className="h-full w-full object-contain object-center transition duration-500 hover:scale-[1.03]" loading="lazy" decoding="async" />
    </div>
    <div className="p-4 sm:p-5"><h3 className="min-h-10 text-sm font-bold leading-5 tracking-tight sm:text-base">{product.name}</h3><p className="mt-2 text-xs font-semibold tracking-wide text-black/55">${product.price.toFixed(2)} USD</p><Link href={`/tarris/book?type=merch&product=${encodeURIComponent(product.id)}`} className="mt-4 flex min-h-11 items-center justify-between rounded-lg border border-black/10 px-3 text-[9px] font-bold tracking-[0.14em] transition hover:border-[#A51C30]/50 hover:text-[#A51C30]"><span>REQUEST FIRST ACCESS</span><span aria-hidden="true">↗</span></Link><p aria-label="Merchandise ordering coming soon" className="mt-3 text-[8px] font-bold tracking-[0.18em] text-[#A51C30]">RELEASE IN PREPARATION · COMING SOON</p></div>
  </article>;
}
function ActionLink({ children, className = "", href = "/tarris/future" }: { children: ReactNode; className?: string; href?: string }) {
  return <Link href={href} className={`inline-flex hover:underline ${className}`}>{children}</Link>;
}
function HQLink({ dark = false }: { dark?: boolean }) {
  return <Link href="/tarris/future" className={`inline-flex items-center justify-center px-5 py-3 text-[10px] font-bold tracking-[0.16em] transition hover:opacity-80 ${dark ? "bg-[#F7F5F2] text-black" : "bg-[#A51C30] text-white"}`}>ENTER TB3 HQ →</Link>;
}
export default function TarrisPublicPage() {
  useEffect(() => {
    const intro = document.getElementById("tarris-splash-intro");
    if (!intro) return;
    document.body.prepend(intro);
    document.body.style.overflow = "hidden";
    const btn = document.getElementById("enter-site-btn");
    if (!btn) return;

    const enterSite = () => {
      intro.style.transition = "opacity 0.8s ease";
      intro.style.opacity = "0";
      window.setTimeout(() => {
        intro.style.display = "none";
        document.body.style.overflow = "";
        document.getElementById("site")?.classList?.add("visible");
      }, 800);
    };
    btn.addEventListener("click", enterSite);
    const autoDismiss = window.setTimeout(() => {
      if (intro.style.display !== "none") btn.click();
    }, 6000);
    return () => {
      btn.removeEventListener("click", enterSite);
      window.clearTimeout(autoDismiss);
    };
  }, []);

  return (
    <>
    <div id="tarris-splash-intro" style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 99999, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", margin: 0, padding: 0 }}>
      <video id="tarris-intro-video" autoPlay muted loop controls={false} playsInline preload="auto" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}>
        <source src="/videos/tb3-intro/tb3-billboard-intro.mp4" type="video/mp4" />
      </video>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "8%", left: "50%", transform: "translateX(-50%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <button id="enter-site-btn" type="button" style={{ border: "1.5px solid white", color: "white", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)", padding: "14px 36px", letterSpacing: "3px", fontSize: "13px", cursor: "pointer" }}>ENTER SITE</button>
        <div style={{ color: "white", opacity: 0.7, fontSize: "10px", letterSpacing: "3px" }}>TARRIS BOUIE // MORE THAN A GAME</div>
      </div>
    </div>
    <div id="public-tarris" className="min-h-screen bg-[#F7F5F2] text-[#141414]">
      <header id="home" className="border-b border-black/15">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-5 py-5 lg:px-10">
          <a href="#home" className="flex items-center gap-3"><span className="text-4xl font-black leading-none tracking-[-0.1em] text-[#A51C30]">TB3</span><span className="border-l border-black/20 pl-3"><span className="block text-xs font-black tracking-[0.15em]">TARRIS BOUIE</span><span className="block pt-1 text-[8px] tracking-[0.2em]">MORE THAN A GAME</span></span></a>
          <nav aria-label="Public navigation" className="order-3 flex w-full flex-wrap justify-center gap-x-5 gap-y-3 border-t border-black/10 pt-4 text-[9px] font-bold tracking-[0.12em] xl:order-none xl:w-auto xl:border-0 xl:pt-0">{nav.map((item) => <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-[#A51C30]">{item}</a>)}</nav>
          <HQLink />
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <section id="original-hero" style={{ height: "92vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070707" }}>
          <img src="/images/tb3-official/OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png" alt="Tarris Bouie Logo" style={{ maxWidth: "560px", width: "82vw", height: "auto" }} />
        </section>
        <section aria-label="Five pillars" className="grid gap-6 border-b border-black/20 py-10 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map(([title, copy, action]) => <article key={title} id={title.toLowerCase()} className="flex scroll-mt-5 flex-col"><div className={`grid gap-2 ${title === "BRAND" || title === "ATHLETE" || title === "COMMUNITY" ? "grid-cols-2" : "grid-cols-1"}`}>{(pillarAssets[title] ?? []).map((asset) => <ImageSlot key={asset.id} {...asset} />)}</div><h2 className="mt-4 text-xl font-black tracking-tight">{title}</h2><p className="mt-2 flex-1 text-xs leading-6 text-black/65">{copy}</p><ActionLink href={title === "NIL" ? "/tarris/book" : "/tarris/future"} className="mt-4 self-start border-b border-[#A51C30] pb-2 text-[9px] font-bold tracking-widest text-[#A51C30]">{action} →</ActionLink><a href="/tarris/book" className="mt-3 text-xs font-bold text-[#C41E3A]">Book Tarris for this →</a></article>)}
        </section>
        <section id="media" className="scroll-mt-5 border-b border-black/20 py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[9px] tracking-[0.2em] text-[#A51C30]">TB3 MEDIA</p><h2 className="text-2xl font-black tracking-tight sm:text-3xl">STUDENT FIRST.<br /><span className="text-[#A51C30]">DEVELOPMENT ALWAYS.</span></h2></div></div>
          <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <article><h3 className="mb-3 text-sm font-black tracking-widest">ACADEMICS PROOF</h3><ImageSlot id="academics-primary" asset="OFFICIAL_09_LIBRARY_STUDYING.png" alt="Tarris studying at a library table" ratio="aspect-[4/3]" /></article>
            <div className="grid grid-cols-2 gap-4"><ImageSlot id="film" asset="OFFICIAL_07_FILM_TABLET.png" alt="Game film on a tablet" ratio="aspect-[4/3]" /><ImageSlot id="nutrition" asset="OFFICIAL_11_KITCHEN_NUTRITION.png" alt="Nutrition and wellness preparation" ratio="aspect-[4/3]" /></div>
          </div>
          <Tb3FilmGrid />
          <a href="/tarris/book" className="mt-4 inline-block text-xs font-bold text-[#C41E3A]">Book Tarris for this →</a>
        </section>
        <ChassisPreview />
        <section id="future" aria-label="Enterprise and future" className="grid scroll-mt-5 gap-6 border-b border-black/20 py-10 md:grid-cols-3">
          <article><ImageSlot id="enterprise-only" asset="OFFICIAL_15_PODIUM_SPEAKING.png" alt="Tarris speaking at a podium" ratio="aspect-[4/3]" /><h2 className="mt-4 text-2xl font-black">ENTERPRISE</h2><p className="mt-2 text-xs leading-6 text-black/65">A vision that reaches beyond the court.</p><ActionLink className="mt-4 text-[9px] font-bold tracking-widest text-[#A51C30]">LEARN MORE →</ActionLink></article>
          <article className="flex min-h-[300px] flex-col justify-center bg-[#EAE7E2] p-7"><p className="text-[9px] tracking-[0.3em] text-[#A51C30]">THE FUTURE</p><h2 className="mt-4 text-3xl font-black">PLAN. PREPARE.<br />PERFORM. BUILD.</h2><p className="mt-3 text-xs leading-6 text-black/65">The next chapter starts with the work you do today.</p><ActionLink href="/tarris/future" className="mt-4 self-start text-[9px] font-bold tracking-widest text-[#A51C30]">LEARN MORE →</ActionLink></article>
          <article className="flex flex-col justify-between bg-[#141414] p-7 text-white"><div><p className="text-[9px] tracking-[0.3em] text-white/60">THE NEXT CHAPTER</p><h2 className="mt-6 text-4xl font-black leading-none tracking-tight">PLAYER<br /><span className="text-[#A51C30]">ONE.</span></h2><p className="mt-5 text-xs leading-6 text-white/70">Same vision. Higher purpose.<br />Build what comes next.</p></div><div className="mt-8"><HQLink dark /></div></article>
        </section>
        <section id="merch" className="scroll-mt-5 py-10">
          <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[9px] font-bold tracking-[0.25em] text-[#A51C30]">TB3 STORE · RELEASE 01</p><h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-6xl">WEAR THE VISION.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-black/60">A considered collection built around the work, the story, and what comes next.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[9px] font-bold tracking-[0.15em]">FIRST RELEASE · IN PREPARATION</span></div>
          <div id="merch-store" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{merchProducts.map((product, index) => <MerchProductCard key={product.id} product={product} index={index} />)}</div>
          <aside className="mt-8 grid overflow-hidden rounded-2xl bg-[#101114] text-white sm:mt-12 sm:grid-cols-[1fr_auto] sm:items-center"><div className="p-6 sm:p-9"><p className="text-[9px] font-bold tracking-[0.24em] text-[#E2475D]">THE FIRST DROP</p><h3 className="mt-2 font-serif text-3xl sm:text-4xl">Get the release note.</h3><p className="mt-2 max-w-xl text-xs leading-6 text-white/55">Join the first-access list and we’ll share availability when Drop 01 is ready.</p></div><Link href="/tarris/book?type=merch" className="m-4 inline-flex min-h-12 items-center justify-center gap-4 rounded-lg bg-[#C41E3A] px-5 text-[10px] font-bold tracking-[0.16em] transition hover:bg-[#a51c30] sm:m-8">DROP ALERT <span aria-hidden="true">↗</span></Link></aside>
        </section>
        <section id="connect" aria-labelledby="tb3-connect-title" className="my-12 scroll-mt-5 overflow-hidden rounded-[1.75rem] bg-[#101114] text-white shadow-[0_24px_70px_rgba(0,0,0,0.12)]">
          <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E2475D]">TB3 | Beyond the game</p>
              <h2 id="tb3-connect-title" className="mt-5 max-w-2xl font-serif text-4xl leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">Partner with Tarris.</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/70">From appearances and speaking engagements to brand partnerships and community impact, create something meaningful with Tarris Bouie III.</p>
              <div className="mt-8 grid grid-cols-3 gap-2" aria-label="Ways to work with Tarris">
                {[
                  ["01", "Book Tarris", "Appearances"],
                  ["02", "Brand Deals", "Partnerships"],
                  ["03", "Collaborate", "Community"],
                ].map(([number, label, detail]) => (
                  <Link key={number} href="/tarris/book" className="group flex min-h-24 flex-col justify-between rounded-xl border border-white/15 bg-white/[0.06] p-3 transition hover:border-[#E2475D]/80 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <span className="text-[10px] font-bold tracking-[0.18em] text-[#E2475D]">{number}</span>
                    <span><span className="block text-[11px] font-bold leading-5 text-white sm:text-xs">{label}</span><span className="block text-[9px] text-white/55">{detail}</span></span>
                  </Link>
                ))}
              </div>
              <Link href="/tarris/book" className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-5 rounded-xl bg-[#C41E3A] px-7 py-4 text-xs font-bold uppercase tracking-[0.14em] transition hover:bg-[#a51c30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-fit">Explore opportunities <span aria-hidden="true">↗</span></Link>
              <p className="mt-4 text-xs text-white/45">Private inquiries, personally reviewed by the TB3 team.</p>
            </div>
            <div className="relative min-h-[360px] overflow-hidden bg-[#202126] sm:min-h-[500px] lg:min-h-full">
              <img src="/images/tb3-official/OFFICIAL_13_BLAZER_CHAIR.png" alt="Tarris Bouie III seated in a blazer, ready to connect with brands and community partners" className="absolute inset-0 h-full w-full object-cover object-[center_22%]" loading="lazy" decoding="async" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#101114]/85 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#101114]/35 lg:via-transparent lg:to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-3 sm:bottom-9 sm:left-9 sm:right-9">
                <div><p className="text-[10px] font-bold tracking-[0.25em] text-white/75">TARRIS BOUIE III</p><p className="mt-1 font-serif text-2xl italic text-white sm:text-3xl">More than a game.</p></div>
                <span className="text-5xl font-black tracking-tighter text-white/80 sm:text-7xl" aria-hidden="true">04</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-black/20"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-5 py-8 lg:px-10"><a href="#home" aria-label="TB3 home" className="text-4xl font-black tracking-[-0.1em] text-[#A51C30]">TB3</a><div className="flex flex-wrap gap-4 text-[9px] font-semibold tracking-wider"><a href="#home">HOME</a>{["ABOUT", "CONTACT", "PRIVACY", "TERMS"].map((label) => <ActionLink key={label} href={label === "ABOUT" ? "/tarris#story" : label === "CONTACT" ? "/tarris/book" : label === "PRIVACY" ? "/privacy" : "/terms"}>{label}</ActionLink>)}</div><ActionLink href="/tarris#media" className="text-[9px] tracking-wider">SOCIAL</ActionLink><span className="font-serif text-2xl italic text-[#A51C30]">Different On Purpose. Not affiliated with University of Alabama. Official NIL merchandise of Tarris Bouie.</span></div></footer>
    </div>
    </>
  );
}

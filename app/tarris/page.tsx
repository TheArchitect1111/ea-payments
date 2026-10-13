"use client";
// Public TB3 story and storefront. Official images are single-use on this surface.
// WIRED: TB3 / -> /tarris -> ENTER TB3 HQ -> /tarris/future.
import Link from "next/link";
import BookingForm from "./book/booking-form";
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
const bonfireStoreUrl = "https://www.bonfire.com/store/tb3-official-merch-shop/";
type MerchProduct = { name: string; price: string | null; garment: "tee" | "long-sleeve" | "cap" | "hoodie" | "crewneck"; color: "red" | "white"; mark: "standard" | "tonal" | "premium" };
const merchProducts: MerchProduct[] = [
  { name: "TB3 TEE - RED", price: "$35", garment: "tee", color: "red", mark: "standard" },
  { name: "TB3 TEE - WHITE", price: "$35", garment: "tee", color: "white", mark: "standard" },
  { name: "TB3 LONG SLEEVE - RED", price: "$45", garment: "long-sleeve", color: "red", mark: "standard" },
  { name: "TB3 LONG SLEEVE - WHITE", price: "$45", garment: "long-sleeve", color: "white", mark: "standard" },
  { name: "TB3 CAP - WHITE / RED", price: null, garment: "cap", color: "white", mark: "standard" },
  { name: "TB3 HOODIE - WHITE", price: "$75", garment: "hoodie", color: "white", mark: "standard" },
  { name: "TB3 HOODIE - RED tonal TB3", price: null, garment: "hoodie", color: "red", mark: "tonal" },
  { name: "TB3 HOODIE - PREMIUM LOGO", price: "$85", garment: "hoodie", color: "white", mark: "premium" },
  { name: "TB3 CREWNECK - RED", price: "$65", garment: "crewneck", color: "red", mark: "standard" },
];
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
function MerchProductCard({ product }: { product: MerchProduct }) {
  const isWhite = product.color === "white";
  const garmentColor = isWhite ? "#F7F5F2" : "#A51C30";
  const outlineColor = isWhite ? "#C8C2BA" : "#811527";
  const logoColor = product.mark === "tonal" ? "#811527" : isWhite ? "#A51C30" : "#F7F5F2";
  const logoOpacity = product.mark === "tonal" ? 0.78 : 1;
  const shirtShape = product.garment === "hoodie"
    ? "M60 39 72 30c2 12 8 19 18 19s16-7 18-19l12 9 24 20-13 19-13-9v68H62V69l-13 9-13-19 24-20Z"
    : product.garment === "crewneck"
      ? "M60 30 74 23c3 8 8 12 16 12s13-4 16-12l14 7 24 18-13 20-12-8v77H61V60l-12 8-13-20 24-18Z"
      : product.garment === "long-sleeve"
        ? "M61 28 74 21c3 8 8 12 16 12s13-4 16-12l14 7 38 33-13 18-27-23v83H62V56L35 79 22 61l39-33Z"
        : product.garment === "cap"
          ? "M36 94c3-30 24-49 54-49s51 19 54 49H36Zm1 4h106c-11 17-32 27-58 27-22 0-40-8-48-20-3-3-3-5 0-7Z"
          : "M60 27 74 19c4 9 9 14 16 14s12-5 16-14l14 8 24 19-13 20-12-8v76H61V68l-12 8-13-20 24-19Z";
  const isCap = product.garment === "cap";
  return <article className="min-w-0 overflow-hidden rounded-sm border border-black/10 bg-white">
    <div className="relative grid aspect-square place-items-center overflow-hidden bg-[#EAE7E2] p-5">
      <svg role="img" aria-label={`${product.name} product preview`} viewBox="0 0 180 180" className="h-full w-full max-w-[250px]">
        <title>{product.name} product preview</title>
        <path d={shirtShape} fill={garmentColor} stroke={outlineColor} strokeWidth="2" strokeLinejoin="round" />
        {isCap ? <path d="M42 93c17-13 45-20 75-15" fill="none" stroke={outlineColor} strokeWidth="2" /> : <path d={product.garment === "hoodie" ? "M74 39c2 11 7 17 16 17s14-6 16-17" : "M77 22c2 8 7 12 13 12s11-4 13-12"} fill="none" stroke={outlineColor} strokeWidth="2" />}
        <text x="90" y={isCap ? "94" : "86"} fill={logoColor} fillOpacity={logoOpacity} fontSize={product.mark === "premium" ? "21" : "19"} fontWeight="900" textAnchor="middle" letterSpacing="-1">TB3</text>
        {!isCap && <text x="90" y="99" fill={logoColor} fillOpacity={logoOpacity} fontSize="5.5" fontWeight="700" textAnchor="middle" letterSpacing="1.2">OFFICIAL</text>}
      </svg>
      <span className="absolute bottom-3 left-3 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[8px] font-bold tracking-[0.18em] text-black/60">PRODUCT PREVIEW</span>
    </div>
    <div className="p-4 sm:p-5">
      <h3 className="break-words text-sm font-bold tracking-wide">{product.name}</h3>
      <p className="mt-1 text-xs text-black/55">{product.price ?? "See price at Bonfire"}</p>
      <a href={bonfireStoreUrl} target="_blank" rel="noopener" className="mt-4 inline-flex min-h-11 w-full items-center justify-center bg-[#A51C30] px-4 py-3 text-[10px] font-bold tracking-[0.16em] text-white hover:bg-[#841627] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A51C30]">SHOP NOW</a>
    </div>
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
      <a id="book-tarris-sticky" href="#book-tarris-form" className="fixed right-4 top-20 z-50 rounded-lg bg-[#C41E3A] px-4 py-3 text-xs font-bold text-white">BOOK TARRIS / PARTNER WITH TB3</a>
      <main className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <section id="original-hero" style={{ height: "92vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070707" }}>
          <img src="/images/tb3-official/OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png" alt="Tarris Bouie Logo" style={{ maxWidth: "560px", width: "82vw", height: "auto" }} />
        </section>
        <section aria-label="Five pillars" className="grid gap-6 border-b border-black/20 py-10 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map(([title, copy, action]) => <article key={title} id={title.toLowerCase()} className="flex scroll-mt-5 flex-col"><div className={`grid gap-2 ${title === "BRAND" || title === "ATHLETE" || title === "COMMUNITY" ? "grid-cols-2" : "grid-cols-1"}`}>{(pillarAssets[title] ?? []).map((asset) => <ImageSlot key={asset.id} {...asset} />)}</div><h2 className="mt-4 text-xl font-black tracking-tight">{title}</h2><p className="mt-2 flex-1 text-xs leading-6 text-black/65">{copy}</p><ActionLink href={title === "NIL" ? "/tarris/book" : "/tarris/future"} className="mt-4 self-start border-b border-[#A51C30] pb-2 text-[9px] font-bold tracking-widest text-[#A51C30]">{action} →</ActionLink><a href="#book-tarris-form" className="mt-3 text-xs font-bold text-[#C41E3A]">Book Tarris for this →</a></article>)}
        </section>
        <section id="media" className="scroll-mt-5 border-b border-black/20 py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[9px] tracking-[0.2em] text-[#A51C30]">TB3 MEDIA</p><h2 className="text-2xl font-black tracking-tight sm:text-3xl">STUDENT FIRST.<br /><span className="text-[#A51C30]">DEVELOPMENT ALWAYS.</span></h2></div></div>
          <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <article><h3 className="mb-3 text-sm font-black tracking-widest">ACADEMICS PROOF</h3><ImageSlot id="academics-primary" asset="OFFICIAL_09_LIBRARY_STUDYING.png" alt="Tarris studying at a library table" ratio="aspect-[4/3]" /></article>
            <div className="grid grid-cols-2 gap-4"><ImageSlot id="film" asset="OFFICIAL_07_FILM_TABLET.png" alt="Game film on a tablet" ratio="aspect-[4/3]" /><ImageSlot id="nutrition" asset="OFFICIAL_11_KITCHEN_NUTRITION.png" alt="Nutrition and wellness preparation" ratio="aspect-[4/3]" /></div>
          </div>
          <Tb3FilmGrid />
          <a href="#book-tarris-form" className="mt-4 inline-block text-xs font-bold text-[#C41E3A]">Book Tarris for this →</a>
        </section>
        <section id="future" aria-label="Enterprise and future" className="grid scroll-mt-5 gap-6 border-b border-black/20 py-10 md:grid-cols-3">
          <article><ImageSlot id="enterprise-only" asset="OFFICIAL_15_PODIUM_SPEAKING.png" alt="Tarris speaking at a podium" ratio="aspect-[4/3]" /><h2 className="mt-4 text-2xl font-black">ENTERPRISE</h2><p className="mt-2 text-xs leading-6 text-black/65">A vision that reaches beyond the court.</p><ActionLink className="mt-4 text-[9px] font-bold tracking-widest text-[#A51C30]">LEARN MORE →</ActionLink></article>
          <article className="flex min-h-[300px] flex-col justify-center bg-[#EAE7E2] p-7"><p className="text-[9px] tracking-[0.3em] text-[#A51C30]">THE FUTURE</p><h2 className="mt-4 text-3xl font-black">PLAN. PREPARE.<br />PERFORM. BUILD.</h2><p className="mt-3 text-xs leading-6 text-black/65">The next chapter starts with the work you do today.</p><ActionLink href="/tarris/future" className="mt-4 self-start text-[9px] font-bold tracking-widest text-[#A51C30]">LEARN MORE →</ActionLink></article>
          <article className="flex flex-col justify-between bg-[#141414] p-7 text-white"><div><p className="text-[9px] tracking-[0.3em] text-white/60">THE NEXT CHAPTER</p><h2 className="mt-6 text-4xl font-black leading-none tracking-tight">PLAYER<br /><span className="text-[#A51C30]">ONE.</span></h2><p className="mt-5 text-xs leading-6 text-white/70">Same vision. Higher purpose.<br />Build what comes next.</p></div><div className="mt-8"><HQLink dark /></div></article>
        </section>
        <section id="merch" className="scroll-mt-5 border-b border-black/20 py-10 sm:py-14">
          <div className="mb-7 flex flex-col items-start justify-between gap-5 sm:mb-9 sm:flex-row sm:items-end">
            <div>
              <p className="text-[9px] font-bold tracking-[0.25em] text-[#A51C30]">OFFICIAL MERCHANDISE</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">TB3 OFFICIAL</h2>
              <p className="mt-2 text-sm text-black/60">Official Merchandise</p>
            </div>
            <a href={bonfireStoreUrl} target="_blank" rel="noopener" className="inline-flex min-h-11 w-full items-center justify-center border border-black px-5 py-3 text-[10px] font-bold tracking-[0.16em] hover:bg-black hover:text-white sm:w-auto">SHOP ALL MERCH</a>
          </div>
          <div id="merch-store" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {merchProducts.map((product) => <MerchProductCard key={product.name} product={product} />)}
          </div>
        </section>
        <BookingForm/>
      </main>
      <footer className="border-t border-black/20"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-5 py-8 lg:px-10"><a href="#home" aria-label="TB3 home" className="text-4xl font-black tracking-[-0.1em] text-[#A51C30]">TB3</a><div className="flex flex-wrap gap-4 text-[9px] font-semibold tracking-wider"><a href="#home">HOME</a>{["ABOUT", "CONTACT", "PRIVACY", "TERMS"].map((label) => <ActionLink key={label} href={label === "ABOUT" ? "/tarris#story" : label === "CONTACT" ? "/tarris/book" : label === "PRIVACY" ? "/privacy" : "/terms"}>{label}</ActionLink>)}</div><ActionLink href="/tarris#media" className="text-[9px] tracking-wider">SOCIAL</ActionLink><span className="font-serif text-2xl italic text-[#A51C30]">Different On Purpose.</span></div></footer>
    </div>
    </>
  );
}

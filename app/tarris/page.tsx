"use client";
// Public TB3 story and storefront. Official images are single-use on this surface.
// WIRED: TB3 / -> /tarris -> ENTER TB3 HQ -> /tarris/future.
import Link from "next/link";
import BookingForm from "./book/booking-form";
import { Tb3FilmGrid } from "./tb3-film";
import { useState, type ReactNode } from "react";

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
type MerchProduct = { id: string; image: string; label: string; price: string; redImage?: string };
const merchProducts: MerchProduct[] = [
  { id: "merch-short-red", image: "MOCK_TEE_SHORT_RED.jpg", label: "TB3 TEE - RED", price: "$35" },
  { id: "merch-short-white", image: "MOCK_TEE_SHORT_WHITE.jpg", label: "TB3 TEE - WHITE", price: "$35" },
  { id: "merch-long-red", image: "MOCK_TEE_LONG_RED.jpg", label: "TB3 LONG SLEEVE - RED", price: "$45" },
  { id: "merch-long-white", image: "MOCK_TEE_LONG_WHITE.jpg", label: "TB3 LONG SLEEVE - WHITE", price: "$45" },
  { id: "merch-cap", image: "MOCK_HAT_WHITE.jpg", redImage: "MOCK_HAT_RED.jpg", label: "TB3 CAP - WHITE", price: "$30" },
  { id: "merch-hoodie-red", image: "MOCK_HOODIE_RED.jpg", label: "TB3 HOODIE - RED", price: "$75" },
  { id: "merch-hoodie-white", image: "MOCK_HOODIE_WHITE.jpg", label: "TB3 HOODIE - WHITE", price: "$75" },
  { id: "merch-hoodie-premium", image: "MOCK_HOODIE_WHITE_LOGO_DETAIL_1.jpg", label: "TB3 HOODIE - PREMIUM LOGO", price: "$85" },
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
function MerchProductCard({ product, index }: { product: MerchProduct; index: number }) {
  const [red, setRed] = useState(false);
  const image = red && product.redImage ? product.redImage : product.image;
  const label = red && product.redImage ? "TB3 CAP - RED" : product.label;
  return <article className="min-w-0">
    <div id={`merch-${index + 1}`} className="aspect-square overflow-hidden bg-[#E5E5E5] p-[10px]">
      <img src={`/merch/${image}`} alt={label} className="h-full w-full object-contain" loading="lazy" />
    </div>
    <p className="mt-3 text-[9px] font-bold tracking-wider">{product.label} <span className="font-normal">{product.price}</span></p>
    {product.redImage && <div className="mt-2 flex items-center gap-2 text-[9px]">
      <span className="text-black/60">COLOR</span>
      <button type="button" onClick={() => setRed(false)} aria-pressed={!red} className={`border px-2 py-1 ${!red ? "border-black" : "border-black/20"}`}>WHITE</button>
      <button type="button" onClick={() => setRed(true)} aria-pressed={red} className={`border px-2 py-1 ${red ? "border-black" : "border-black/20"}`}>RED</button>
    </div>}
  </article>;
}
function Disabled({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <button type="button" disabled className={`cursor-not-allowed opacity-60 ${className}`}>{children}</button>;
}
function HQLink({ dark = false }: { dark?: boolean }) {
  return <Link href="/tarris/future" className={`inline-flex items-center justify-center px-5 py-3 text-[10px] font-bold tracking-[0.16em] transition hover:opacity-80 ${dark ? "bg-[#F7F5F2] text-black" : "bg-[#A51C30] text-white"}`}>ENTER TB3 HQ →</Link>;
}
export default function TarrisPublicPage() {
  return (
    <div id="public-tarris" className="min-h-screen bg-[#F7F5F2] text-[#141414]">
      <section id="tarris-intro-hero" className="relative m-0 h-[85vh] w-full overflow-hidden p-0 md:h-screen" style={{ position: "relative", width: "100%", overflow: "hidden", margin: 0, padding: 0 }}>
        <video id="tarris-hero-video" autoPlay muted loop playsInline preload="auto" poster="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}>
          <source src="/videos/tb3-3d-billboard-intro.mp4" type="video/mp4" />
        </video>
      </section>
      <header id="home" className="border-b border-black/15">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-5 py-5 lg:px-10">
          <a href="#home" className="flex items-center gap-3"><span className="text-4xl font-black leading-none tracking-[-0.1em] text-[#A51C30]">TB3</span><span className="border-l border-black/20 pl-3"><span className="block text-xs font-black tracking-[0.15em]">TARRIS BOUIE</span><span className="block pt-1 text-[8px] tracking-[0.2em]">MORE THAN A GAME</span></span></a>
          <nav aria-label="Public navigation" className="order-3 flex w-full flex-wrap justify-center gap-x-5 gap-y-3 border-t border-black/10 pt-4 text-[9px] font-bold tracking-[0.12em] xl:order-none xl:w-auto xl:border-0 xl:pt-0">{nav.map((item) => <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-[#A51C30]">{item}</a>)}</nav>
          <HQLink />
        </div>
      </header>
      <a id="book-tarris-sticky" href="#book-tarris-form" className="fixed right-4 top-20 z-50 rounded-lg bg-[#C41E3A] px-4 py-3 text-xs font-bold text-white">BOOK TARRIS / PARTNER WITH TB3</a>
      <main className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <section aria-label="Tarris Bouie introduction" className="grid gap-8 border-b border-black/20 py-10 lg:grid-cols-[0.55fr_1.6fr] lg:gap-10 lg:py-14">
          <div className="flex flex-col justify-between gap-8 lg:border-r lg:border-black/15 lg:pr-6">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-[#A51C30]">SAME VISION<br /><span className="text-black">HIGHER PURPOSE</span></p>
            <p className="flex flex-wrap gap-x-4 gap-y-2 text-lg font-black leading-[1.25] tracking-tight lg:block lg:text-3xl">STUDENT<br className="hidden lg:block" /> ATHLETE<br className="hidden lg:block" /> BRAND<br className="hidden lg:block" /> IMPACT</p>
            <p className="text-[9px] leading-5 tracking-[0.12em]">DISCIPLINE.<br />DETERMINATION.<br />DEVELOPMENT.<br />DESTINY.</p>
          </div>
          <div className="text-center">
            <ImageSlot id="tb3-public-hero" asset="OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png" alt="TB3: More Than a Game" ratio="aspect-[16/9]" hero />
            <p className="mt-5 text-[11px] font-semibold tracking-[0.45em]">TARRIS BOUIE</p>
            <h1 className="mt-3 text-[clamp(2.5rem,5.5vw,5.5rem)] font-black leading-[0.95] tracking-[-0.06em]">MORE THAN<br /><span className="text-[#A51C30]">A GAME.</span></h1>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><Disabled className="border border-black px-5 py-3 text-[10px] font-bold tracking-[0.16em]">WATCH THE STORY</Disabled><HQLink /></div>
          </div>
        </section>
        <section aria-label="Five pillars" className="grid gap-6 border-b border-black/20 py-10 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map(([title, copy, action]) => <article key={title} id={title.toLowerCase()} className="flex scroll-mt-5 flex-col"><div className={`grid gap-2 ${title === "BRAND" || title === "ATHLETE" || title === "COMMUNITY" ? "grid-cols-2" : "grid-cols-1"}`}>{(pillarAssets[title] ?? []).map((asset) => <ImageSlot key={asset.id} {...asset} />)}</div><h2 className="mt-4 text-xl font-black tracking-tight">{title}</h2><p className="mt-2 flex-1 text-xs leading-6 text-black/65">{copy}</p><Disabled className="mt-4 self-start border-b border-[#A51C30] pb-2 text-[9px] font-bold tracking-widest text-[#A51C30]">{action} →</Disabled><a href="#book-tarris-form" className="mt-3 text-xs font-bold text-[#C41E3A]">Book Tarris for this →</a></article>)}
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
          <article><ImageSlot id="enterprise-only" asset="OFFICIAL_15_PODIUM_SPEAKING.png" alt="Tarris speaking at a podium" ratio="aspect-[4/3]" /><h2 className="mt-4 text-2xl font-black">ENTERPRISE</h2><p className="mt-2 text-xs leading-6 text-black/65">A vision that reaches beyond the court.</p><Disabled className="mt-4 text-[9px] font-bold tracking-widest text-[#A51C30]">LEARN MORE →</Disabled></article>
          <article className="flex min-h-[300px] flex-col justify-center bg-[#EAE7E2] p-7"><p className="text-[9px] tracking-[0.3em] text-[#A51C30]">THE FUTURE</p><h2 className="mt-4 text-3xl font-black">PLAN. PREPARE.<br />PERFORM. BUILD.</h2><p className="mt-3 text-xs leading-6 text-black/65">The next chapter starts with the work you do today.</p><Disabled className="mt-4 self-start text-[9px] font-bold tracking-widest text-[#A51C30]">LEARN MORE →</Disabled></article>
          <article className="flex flex-col justify-between bg-[#141414] p-7 text-white"><div><p className="text-[9px] tracking-[0.3em] text-white/60">THE NEXT CHAPTER</p><h2 className="mt-6 text-4xl font-black leading-none tracking-tight">PLAYER<br /><span className="text-[#A51C30]">ONE.</span></h2><p className="mt-5 text-xs leading-6 text-white/70">Same vision. Higher purpose.<br />Build what comes next.</p></div><div className="mt-8"><HQLink dark /></div></article>
        </section>
        <section id="merch" className="scroll-mt-5 py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[9px] tracking-[0.25em] text-[#A51C30]">TB3 STORE</p><h2 className="mt-2 text-3xl font-black tracking-tight">WEAR THE VISION.</h2></div><Disabled className="border border-black px-5 py-3 text-[10px] font-bold tracking-widest">SHOP TB3 →</Disabled></div>
          <div id="merch-store" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{merchProducts.map((product, index) => <MerchProductCard key={product.id} product={product} index={index} />)}</div>
        </section>
        <BookingForm/>
      </main>
      <footer className="border-t border-black/20"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-5 py-8 lg:px-10"><a href="#home" aria-label="TB3 home" className="text-4xl font-black tracking-[-0.1em] text-[#A51C30]">TB3</a><div className="flex flex-wrap gap-4 text-[9px] font-semibold tracking-wider"><a href="#home">HOME</a>{["ABOUT", "CONTACT", "PRIVACY", "TERMS"].map((label) => <Disabled key={label}>{label}</Disabled>)}</div><Disabled className="text-[9px] tracking-wider">SOCIAL</Disabled><span className="font-serif text-2xl italic text-[#A51C30]">Different On Purpose.</span></div></footer>
    </div>
  );
}

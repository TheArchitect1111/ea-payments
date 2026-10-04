// NO IMAGES BUNDLED. Replace: fixed slots with approved mom-safe assets after review.
// WIRED: TB3 / -> /tarris -> ENTER TB3 HQ -> /tarris/future.
import Link from "next/link";
import type { ReactNode } from "react";

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
  ],
  STORY: [{ id: "story-journey", asset: "OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png", alt: "Tarris walking through the tunnel", ratio: "aspect-[4/3]" }],
  BRAND: [
    { id: "brand-primary", asset: "OFFICIAL_13_BLAZER_CHAIR.png", alt: "Tarris in a blazer in a professional setting", ratio: "aspect-[4/3]" },
    { id: "brand-headshot-1", asset: "OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png", alt: "Tarris headshot in Alabama gear", ratio: "aspect-square" },
    { id: "brand-headshot-2", asset: "OFFICIAL_08_HEADSHOT_RED_BG.png", alt: "Tarris headshot on red and black background", ratio: "aspect-square" },
  ],
  NIL: [{ id: "nil-lifestyle", asset: "OFFICIAL_10_CASUAL_LEAN.png", alt: "Tarris in a casual outdoor portrait", ratio: "aspect-[4/3]" }],
  COMMUNITY: [
    { id: "community-primary", asset: "OFFICIAL_14_YOUTH_HUDDLE.png", alt: "Tarris coaching a youth huddle", ratio: "aspect-[4/3]" },
    { id: "community-secondary", asset: "OFFICIAL_12_KIDS_ART.png", alt: "Young people working on art together", ratio: "aspect-[4/3]" },
  ],
};
const merch = ["HOODIE_BLACK", "TEE_WHITE", "CAP", "HOODIE_RED", "TEE_BLACK"];
const merchAssets = [
  "OFFICIAL_02_BENCH_YELLOW_KOBE.png",
  "OFFICIAL_13_BLAZER_CHAIR.png",
  "OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png",
  "OFFICIAL_08_HEADSHOT_RED_BG.png",
  "OFFICIAL_10_CASUAL_LEAN.png",
];
const nav = ["HOME", "ATHLETE", "STORY", "BRAND", "NIL", "COMMUNITY", "MEDIA", "MERCH", "FUTURE"];

type ImageAsset = { id: string; asset: string; alt: string; ratio?: string };
function ImageSlot({ id, asset, alt, ratio = "aspect-[4/5]", hero = false }: ImageAsset & { hero?: boolean }) {
  return <div className={`relative w-full ${ratio} overflow-hidden ${hero ? "bg-[#0A0A0A]" : ""}`}>
    <img id={id} src={`/images/tb3-official/${asset}`} alt={alt} className={`absolute inset-0 h-full w-full ${hero ? "object-contain" : "object-cover object-center"}`} loading={hero ? "eager" : "lazy"} />
  </div>;
}
function Disabled({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <button type="button" disabled className={`cursor-not-allowed opacity-60 ${className}`}>{children}</button>;
}
function HQLink({ dark = false }: { dark?: boolean }) {
  return <Link href="/tarris/future" className={`inline-flex items-center justify-center px-5 py-3 text-[10px] font-bold tracking-[0.16em] transition hover:opacity-80 ${dark ? "bg-[#F7F5F2] text-black" : "bg-[#A51C30] text-white"}`}>ENTER TB3 HQ →</Link>;
}
export default function TarrisPublicPage() {
  return (
    <div id="home" className="min-h-screen bg-[#F7F5F2] text-[#141414]">
      <header className="border-b border-black/15">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-5 py-5 lg:px-10">
          <a href="#home" className="flex items-center gap-3"><span className="text-4xl font-black leading-none tracking-[-0.1em] text-[#A51C30]">TB3</span><span className="border-l border-black/20 pl-3"><span className="block text-xs font-black tracking-[0.15em]">TARRIS BOUIE</span><span className="block pt-1 text-[8px] tracking-[0.2em]">MORE THAN A GAME</span></span></a>
          <nav aria-label="Public navigation" className="order-3 flex w-full flex-wrap justify-center gap-x-5 gap-y-3 border-t border-black/10 pt-4 text-[9px] font-bold tracking-[0.12em] xl:order-none xl:w-auto xl:border-0 xl:pt-0">{nav.map((item) => <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-[#A51C30]">{item}</a>)}</nav>
          <HQLink />
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <section aria-label="Tarris Bouie introduction" className="grid gap-8 border-b border-black/20 py-10 lg:grid-cols-[0.55fr_1.6fr_1fr] lg:gap-10 lg:py-14">
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
          <div>
            <ImageSlot id="public-hero-portrait" asset="OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png" alt="Tarris Bouie headshot" />
            <div className="mt-4 grid grid-cols-2 gap-2 text-[8px] font-bold tracking-[0.08em]">{["DISCIPLINE", "DETERMINATION", "DEVELOPMENT", "DESTINY"].map((d) => <span key={d}>{d}</span>)}</div>
            <blockquote className="mt-5 border-l-2 border-[#A51C30] pl-3 text-xs italic leading-6">“A bigger purpose than basketball.”</blockquote>
            <p className="mt-4 font-serif text-2xl italic text-[#A51C30]">Different On Purpose.</p>
          </div>
        </section>
        <section aria-label="Five pillars" className="grid gap-6 border-b border-black/20 py-10 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map(([title, copy, action]) => <article key={title} id={title.toLowerCase()} className="flex scroll-mt-5 flex-col"><div className={`grid gap-2 ${title === "BRAND" || title === "ATHLETE" || title === "COMMUNITY" ? "grid-cols-2" : "grid-cols-1"}`}>{(pillarAssets[title] ?? []).map((asset) => <ImageSlot key={asset.id} {...asset} />)}</div><h2 className="mt-4 text-xl font-black tracking-tight">{title}</h2><p className="mt-2 flex-1 text-xs leading-6 text-black/65">{copy}</p><Disabled className="mt-4 self-start border-b border-[#A51C30] pb-2 text-[9px] font-bold tracking-widest text-[#A51C30]">{action} →</Disabled></article>)}
        </section>
        <section id="media" className="scroll-mt-5 border-b border-black/20 py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><h2 className="text-2xl font-black tracking-tight sm:text-3xl">HIGHLIGHTS. INTERVIEWS.<br /><span className="text-[#A51C30]">MORE TO COME.</span></h2><span className="text-[9px] tracking-[0.2em]">TB3 MEDIA</span></div>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]"><ImageSlot id="public-media-feature" asset="OFFICIAL_03_LOW_STANCE_ARENA.png" alt="Tarris in a game action pose" ratio="aspect-video" /><div className="grid grid-cols-2 gap-4"><ImageSlot id="public-media-thumb-1" asset="OFFICIAL_04_BALL_OVER_SHOULDER.png" alt="Tarris with a basketball" ratio="aspect-video" /><ImageSlot id="public-media-thumb-2" asset="OFFICIAL_06_CABLE_MACHINE.png" alt="Tarris training on a cable machine" ratio="aspect-video" /><ImageSlot id="public-media-thumb-3" asset="OFFICIAL_07_FILM_TABLET.png" alt="Tarris reviewing game film" ratio="aspect-video" /><ImageSlot id="public-media-thumb-4" asset="OFFICIAL_14_YOUTH_HUDDLE.png" alt="Tarris coaching youth athletes" ratio="aspect-video" /></div></div>
        </section>
        <section id="future" aria-label="Enterprise and future" className="grid scroll-mt-5 gap-6 border-b border-black/20 py-10 md:grid-cols-3">
          <article><ImageSlot id="enterprise" asset="OFFICIAL_15_PODIUM_SPEAKING.png" alt="Tarris speaking at a podium" ratio="aspect-[4/3]" /><h2 className="mt-4 text-2xl font-black">ENTERPRISE</h2><p className="mt-2 text-xs leading-6 text-black/65">A vision that reaches beyond the court.</p><Disabled className="mt-4 text-[9px] font-bold tracking-widest text-[#A51C30]">LEARN MORE →</Disabled></article>
          <article><ImageSlot id="public-future-banner" asset="OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png" alt="Tarris walking through the tunnel" ratio="aspect-[4/3]" /><h2 className="mt-4 text-2xl font-black">THE FUTURE</h2><p className="mt-2 text-xs leading-6 text-black/65">PLAN. PREPARE. PERFORM. BUILD.</p><Disabled className="mt-4 text-[9px] font-bold tracking-widest text-[#A51C30]">LEARN MORE →</Disabled></article>
          <article className="flex flex-col justify-between bg-[#141414] p-7 text-white"><div><p className="text-[9px] tracking-[0.3em] text-white/60">THE NEXT CHAPTER</p><h2 className="mt-6 text-4xl font-black leading-none tracking-tight">PLAYER<br /><span className="text-[#A51C30]">ONE.</span></h2><p className="mt-5 text-xs leading-6 text-white/70">Same vision. Higher purpose.<br />Build what comes next.</p></div><div className="mt-8"><HQLink dark /></div></article>
        </section>
        <section id="merch" className="scroll-mt-5 py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[9px] tracking-[0.25em] text-[#A51C30]">TB3 STORE</p><h2 className="mt-2 text-3xl font-black tracking-tight">WEAR THE VISION.</h2></div><Disabled className="border border-black px-5 py-3 text-[10px] font-bold tracking-widest">SHOP TB3 →</Disabled></div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{merch.map((name, index) => <article key={name}><ImageSlot id={`public-merch-${index + 1}`} asset={merchAssets[index]} alt={`Approved TB3 brand image for ${name.replaceAll("_", " ").toLowerCase()}`} ratio="aspect-square" /><p className="mt-3 text-[9px] font-bold tracking-wider">TB3 {name.replaceAll("_", " ")}</p></article>)}</div>
        </section>
      </main>
      <footer className="border-t border-black/20"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-5 py-8 lg:px-10"><a href="#home" aria-label="TB3 home" className="text-4xl font-black tracking-[-0.1em] text-[#A51C30]">TB3</a><div className="flex flex-wrap gap-4 text-[9px] font-semibold tracking-wider"><a href="#home">HOME</a>{["ABOUT", "CONTACT", "PRIVACY", "TERMS"].map((label) => <Disabled key={label}>{label}</Disabled>)}</div><Disabled className="text-[9px] tracking-wider">SOCIAL</Disabled><span className="font-serif text-2xl italic text-[#A51C30]">Different On Purpose.</span></div></footer>
    </div>
  );
}

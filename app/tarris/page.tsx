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
type MerchProduct = { id: string; name: string; kind: "hoodie" | "tee" | "cap" | "long-sleeve"; color: string; logoColor: string };
const merchProducts: MerchProduct[] = [
  { id: "MOCK_HOODIE_BLACK", name: "HOODIE · BLACK", kind: "hoodie", color: "#171717", logoColor: "#A51C30" },
  { id: "MOCK_HOODIE_RED", name: "HOODIE · CRIMSON", kind: "hoodie", color: "#A51C30", logoColor: "#F7F5F2" },
  { id: "MOCK_TEE_WHITE", name: "T-SHIRT · WHITE", kind: "tee", color: "#F7F5F2", logoColor: "#A51C30" },
  { id: "MOCK_TEE_BLACK", name: "T-SHIRT · BLACK", kind: "tee", color: "#171717", logoColor: "#A51C30" },
  { id: "MOCK_LONG_SLEEVE_BLACK", name: "LONG-SLEEVE T · BLACK", kind: "long-sleeve", color: "#171717", logoColor: "#A51C30" },
  { id: "MOCK_CAP_BLACK", name: "CAP · BLACK", kind: "cap", color: "#171717", logoColor: "#A51C30" },
  { id: "MOCK_CAP_RED", name: "CAP · CRIMSON", kind: "cap", color: "#A51C30", logoColor: "#F7F5F2" },
];
const nav = ["HOME", "ATHLETE", "STORY", "BRAND", "NIL", "COMMUNITY", "MEDIA", "MERCH", "FUTURE"];

type ImageAsset = { id: string; asset: string; alt: string; ratio?: string };
function ImageSlot({ id, asset, alt, ratio = "aspect-[4/5]", hero = false }: ImageAsset & { hero?: boolean }) {
  const objectPosition = asset.includes("HEADSHOT") ? "50% 15%" : id === "brand-primary" ? "55% 20%" : asset.includes("BENCH_YELLOW_KOBE") ? "50% 30%" : "50% 50%";
  return <div className={`relative w-full ${ratio} overflow-hidden ${hero ? "bg-[#0A0A0A]" : ""}`}>
    <img id={id} src={`/images/tb3-official/${asset}`} alt={alt} style={{ objectPosition }} className={`absolute inset-0 h-full w-full ${hero ? "object-contain" : "object-cover"}`} loading={hero ? "eager" : "lazy"} />
  </div>;
}
function MerchMockup({ product }: { product: MerchProduct }) {
  const dark = product.color === "#171717";
  const seam = dark ? "#FFFFFF" : "#2A2927";
  const cloth = product.color;
  const gradientId = product.id.toLowerCase().replaceAll("_", "-") + "-cloth";
  const logo = <text x="180" y={product.kind === "cap" ? "159" : "174"} textAnchor="middle" fill={product.logoColor} fontFamily="Arial, sans-serif" fontSize="38" fontWeight="900" letterSpacing="-4">TB3</text>;
  return <svg id={product.id} viewBox="0 0 360 300" role="img" aria-label={`TB3 ${product.name.toLowerCase()} ghost-mannequin mockup`} className="h-full w-full">
    <defs>
      <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor={cloth} />
        <stop offset="58%" stopColor={cloth} />
        <stop offset="100%" stopColor={dark ? "#080808" : product.color === "#A51C30" ? "#741124" : "#D8D6D2"} />
      </linearGradient>
      <filter id="tb3-merch-shadow" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#000000" floodOpacity=".16" />
      </filter>
    </defs>
    <rect width="360" height="300" fill="#F1EEE9" />
    <ellipse cx="180" cy="255" rx="88" ry="9" fill="#000000" opacity=".08" />
    <g filter="url(#tb3-merch-shadow)">
      {product.kind === "cap" ? <>
        <path d="M91 157 C95 105 126 75 180 72 C234 75 265 105 269 157 L269 173 L91 173 Z" fill={`url(#${gradientId})`} />
        <path d="M91 157 C129 146 231 146 269 157 C257 183 222 199 179 199 C138 199 104 183 91 157 Z" fill={cloth} />
        <path d="M109 155 C143 142 216 142 250 155 M180 79 L180 132" fill="none" stroke={seam} strokeOpacity=".28" strokeWidth="2" />
        {logo}
      </> : <>
        {product.kind === "hoodie" && <path d="M145 102 C139 61 154 41 180 41 C206 41 221 61 215 102 L198 120 L162 120 Z" fill={cloth} stroke={seam} strokeOpacity=".22" strokeWidth="2" />}
        <path d={product.kind === "long-sleeve"
          ? "M137 96 L101 105 L49 199 L80 216 L117 159 L114 241 L246 241 L243 159 L280 216 L311 199 L259 105 L223 96 L202 116 L158 116 Z"
          : product.kind === "hoodie"
            ? "M141 95 L105 107 L61 183 L91 201 L119 158 L116 241 L244 241 L241 158 L269 201 L299 183 L255 107 L219 95 L198 117 L162 117 Z"
            : "M139 91 L103 103 L63 147 L88 168 L119 141 L116 241 L244 241 L241 141 L272 168 L297 147 L257 103 L221 91 L200 111 L160 111 Z"}
          fill={`url(#${gradientId})`} stroke={seam} strokeOpacity=".2" strokeWidth="2" strokeLinejoin="round" />
        <path d="M160 113 Q180 137 200 113 M126 232 L234 232" fill="none" stroke={seam} strokeOpacity=".28" strokeWidth="3" />
        {product.kind === "hoodie" && <>
          <path d="M139 191 Q180 179 221 191 L215 224 Q180 215 145 224 Z" fill="none" stroke={seam} strokeOpacity=".27" strokeWidth="2" />
          <path d="M169 117 L169 139 M191 117 L191 139" stroke={seam} strokeOpacity=".42" strokeWidth="2" />
        </>}
        {product.kind === "long-sleeve" && <>
          <path d="M57 186 L80 199 M280 199 L303 186 M118 227 L137 227 M223 227 L242 227" fill="none" stroke={seam} strokeOpacity=".32" strokeWidth="3" />
        </>}
        {logo}
      </>}
    </g>
    <text x="180" y="280" textAnchor="middle" fill="#55514C" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="700" letterSpacing="2">TB3 · DIFFERENT ON PURPOSE</text>
  </svg>;
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{merchProducts.map((product, index) => <article key={product.id} className="min-w-0"><div id={`public-merch-${index + 1}`} className="aspect-square overflow-hidden"><MerchMockup product={product} /></div><p className="mt-3 text-[9px] font-bold tracking-wider">{product.name}</p></article>)}</div>
        </section>
      </main>
      <footer className="border-t border-black/20"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-5 py-8 lg:px-10"><a href="#home" aria-label="TB3 home" className="text-4xl font-black tracking-[-0.1em] text-[#A51C30]">TB3</a><div className="flex flex-wrap gap-4 text-[9px] font-semibold tracking-wider"><a href="#home">HOME</a>{["ABOUT", "CONTACT", "PRIVACY", "TERMS"].map((label) => <Disabled key={label}>{label}</Disabled>)}</div><Disabled className="text-[9px] tracking-wider">SOCIAL</Disabled><span className="font-serif text-2xl italic text-[#A51C30]">Different On Purpose.</span></div></footer>
    </div>
  );
}

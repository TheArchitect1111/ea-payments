// NO IMAGES BUNDLED. Replace: fixed slots with approved mom-safe assets after review.
// WIRED: TB3 / -> /tarris -> ENTER TB3 HQ -> /tarris/future.
import Link from "next/link";
import type { ReactNode } from "react";
import TB3Intro from "./TB3Intro";

const pillars = [
  ["ATHLETE", "Discipline in the classroom. Determination on the court.", "LEARN MORE"],
  ["STORY", "The journey behind the jersey. A bigger purpose than basketball.", "WATCH THE STORY"],
  ["BRAND", "Same vision. Higher purpose. Different on purpose.", "LEARN MORE"],
  ["NIL", "Meaningful partnerships around a shared vision.", "NIL INQUIRIES"],
  ["COMMUNITY", "An impact beyond the game.", "LEARN MORE"],
];
const merch = ["HOODIE_BLACK", "TEE_WHITE", "CAP", "HOODIE_RED", "TEE_BLACK"];
const nav = ["HOME", "ATHLETE", "STORY", "BRAND", "NIL", "COMMUNITY", "MEDIA", "MERCH", "FUTURE"];

function Slot({ label, ratio = "aspect-[4/5]" }: { label: string; ratio?: string }) {
  return <div aria-label={label} className={`flex w-full ${ratio} items-center justify-center border border-dashed border-[#A51C30]/35 bg-[#EDE9E3] p-3 text-center`}><span className="max-w-full break-all font-mono text-[9px] tracking-wider text-black/45">{label}</span></div>;
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
      <TB3Intro />
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
            <Slot label="SLOT_TB3_MASK" ratio="aspect-[16/9]" />
            <p className="mt-5 text-[11px] font-semibold tracking-[0.45em]">TARRIS BOUIE</p>
            <h1 className="mt-3 text-[clamp(2.5rem,5.5vw,5.5rem)] font-black leading-[0.95] tracking-[-0.06em]">MORE THAN<br /><span className="text-[#A51C30]">A GAME.</span></h1>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><Disabled className="border border-black px-5 py-3 text-[10px] font-bold tracking-[0.16em]">WATCH THE STORY</Disabled><HQLink /></div>
          </div>
          <div>
            <Slot label="SLOT_HERO_HOODIE" />
            <div className="mt-4 grid grid-cols-2 gap-2 text-[8px] font-bold tracking-[0.08em]">{["DISCIPLINE", "DETERMINATION", "DEVELOPMENT", "DESTINY"].map((d) => <span key={d}>{d}</span>)}</div>
            <blockquote className="mt-5 border-l-2 border-[#A51C30] pl-3 text-xs italic leading-6">“A bigger purpose than basketball.”</blockquote>
            <p className="mt-4 font-serif text-2xl italic text-[#A51C30]">Different On Purpose.</p>
          </div>
        </section>
        <section aria-label="Five pillars" className="grid gap-6 border-b border-black/20 py-10 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map(([title, copy, action]) => <article key={title} id={title.toLowerCase()} className="flex scroll-mt-5 flex-col"><Slot label={`SLOT_${title}_IMG`} ratio="aspect-[4/3]" /><h2 className="mt-4 text-xl font-black tracking-tight">{title}</h2><p className="mt-2 flex-1 text-xs leading-6 text-black/65">{copy}</p><Disabled className="mt-4 self-start border-b border-[#A51C30] pb-2 text-[9px] font-bold tracking-widest text-[#A51C30]">{action} →</Disabled></article>)}
        </section>
        <section id="media" className="scroll-mt-5 border-b border-black/20 py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><h2 className="text-2xl font-black tracking-tight sm:text-3xl">HIGHLIGHTS. INTERVIEWS.<br /><span className="text-[#A51C30]">MORE TO COME.</span></h2><span className="text-[9px] tracking-[0.2em]">TB3 MEDIA</span></div>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]"><Slot label="SLOT_MEDIA_FEATURE" ratio="aspect-video" /><div className="grid grid-cols-2 gap-4">{[1, 2, 3, 4].map((n) => <div key={n} aria-disabled="true" className="cursor-not-allowed opacity-60"><Slot label={`SLOT_MEDIA_THUMB_${n}`} ratio="aspect-video" /></div>)}</div></div>
        </section>
        <section id="future" aria-label="Enterprise and future" className="grid scroll-mt-5 gap-6 border-b border-black/20 py-10 md:grid-cols-3">
          <article><Slot label="SLOT_ENTERPRISE_IMG" ratio="aspect-[4/3]" /><h2 className="mt-4 text-2xl font-black">ENTERPRISE</h2><p className="mt-2 text-xs leading-6 text-black/65">A vision that reaches beyond the court.</p><Disabled className="mt-4 text-[9px] font-bold tracking-widest text-[#A51C30]">LEARN MORE →</Disabled></article>
          <article><Slot label="SLOT_FUTURE_IMG" ratio="aspect-[4/3]" /><h2 className="mt-4 text-2xl font-black">THE FUTURE</h2><p className="mt-2 text-xs leading-6 text-black/65">PLAN. PREPARE. PERFORM. BUILD.</p><Disabled className="mt-4 text-[9px] font-bold tracking-widest text-[#A51C30]">LEARN MORE →</Disabled></article>
          <article className="flex flex-col justify-between bg-[#141414] p-7 text-white"><div><p className="text-[9px] tracking-[0.3em] text-white/60">THE NEXT CHAPTER</p><h2 className="mt-6 text-4xl font-black leading-none tracking-tight">PLAYER<br /><span className="text-[#A51C30]">ONE.</span></h2><p className="mt-5 text-xs leading-6 text-white/70">Same vision. Higher purpose.<br />Build what comes next.</p></div><div className="mt-8"><HQLink dark /></div></article>
        </section>
        <section id="merch" className="scroll-mt-5 py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[9px] tracking-[0.25em] text-[#A51C30]">TB3 STORE</p><h2 className="mt-2 text-3xl font-black tracking-tight">WEAR THE VISION.</h2></div><Disabled className="border border-black px-5 py-3 text-[10px] font-bold tracking-widest">SHOP TB3 →</Disabled></div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{merch.map((name) => <article key={name}><Slot label={`SLOT_MERCH_${name}`} ratio="aspect-square" /><p className="mt-3 text-[9px] font-bold tracking-wider">TB3 {name.replaceAll("_", " ")}</p></article>)}</div>
        </section>
      </main>
      <footer className="border-t border-black/20"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-5 py-8 lg:px-10"><a href="#home" aria-label="TB3 home" className="text-4xl font-black tracking-[-0.1em] text-[#A51C30]">TB3</a><div className="flex flex-wrap gap-4 text-[9px] font-semibold tracking-wider"><a href="#home">HOME</a>{["ABOUT", "CONTACT", "PRIVACY", "TERMS"].map((label) => <Disabled key={label}>{label}</Disabled>)}</div><Disabled className="text-[9px] tracking-wider">SOCIAL</Disabled><span className="font-serif text-2xl italic text-[#A51C30]">Different On Purpose.</span></div></footer>
    </div>
  );
}

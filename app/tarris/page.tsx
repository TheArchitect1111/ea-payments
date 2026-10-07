"use client";

import { useEffect } from "react";
import Link from "next/link";
import { type ReactNode } from "react";
import BookingForm from "./book/booking-form";
import { PublicCountsBar, PublicTb3Store } from "./public-store";

type Tb3PhotoAsset = { id: string; asset: string; alt: string };

const galleryAssets: Tb3PhotoAsset[] = [
  { id: "tb3-about-headshot", asset: "OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png", alt: "Tarris Bouie in Alabama gear" },
  { id: "tb3-about-bench", asset: "OFFICIAL_02_BENCH_YELLOW_KOBE.png", alt: "Tarris seated on the training bench" },
  { id: "tb3-about-athlete", asset: "OFFICIAL_03_LOW_STANCE_ARENA.png", alt: "Tarris in a low dribble stance on court" },
  { id: "tb3-about-ball", asset: "OFFICIAL_04_BALL_OVER_SHOULDER.png", alt: "Tarris holding a basketball over his shoulder" },
  { id: "tb3-about-tunnel", asset: "OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png", alt: "Tarris walking through the tunnel with Bouie and number four visible" },
  { id: "tb3-about-training", asset: "OFFICIAL_06_CABLE_MACHINE.png", alt: "Tarris training on a cable machine" },
  { id: "tb3-about-film", asset: "OFFICIAL_07_FILM_TABLET.png", alt: "Tarris reviewing game film on a tablet" },
  { id: "tb3-about-headshot-red", asset: "OFFICIAL_08_HEADSHOT_RED_BG.png", alt: "Tarris on a red and black background" },
  { id: "tb3-about-academics", asset: "OFFICIAL_09_LIBRARY_STUDYING.png", alt: "Tarris studying at a library table" },
  { id: "tb3-about-lifestyle", asset: "OFFICIAL_10_CASUAL_LEAN.png", alt: "Tarris in a casual outdoor portrait" },
  { id: "tb3-about-nutrition", asset: "OFFICIAL_11_KITCHEN_NUTRITION.png", alt: "Nutrition and wellness preparation" },
  { id: "tb3-about-community-art", asset: "OFFICIAL_12_KIDS_ART.png", alt: "Young people creating art together" },
  { id: "tb3-about-blazer", asset: "OFFICIAL_13_BLAZER_CHAIR.png", alt: "Tarris in a blazer in a professional setting" },
  { id: "tb3-about-community", asset: "OFFICIAL_14_YOUTH_HUDDLE.png", alt: "Tarris coaching a youth huddle" },
  { id: "tb3-about-speaking", asset: "OFFICIAL_15_PODIUM_SPEAKING.png", alt: "Tarris speaking at a podium" },
];

function TarrisViewTracker() {
  useEffect(() => {
    // TENANT_KEY: update the tenant and public path when scaling this page.
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant: "tarris", event: "page_view", page: "/tarris" }),
      keepalive: true,
    }).catch(() => undefined);
  }, []);
  return null;
}

function TarrisPhoto({ id, asset, alt, hero = false }: Tb3PhotoAsset & { hero?: boolean }) {
  return (
    <div className={`relative w-full overflow-hidden ${hero ? "aspect-[16/9] bg-[#0A0A0A]" : "aspect-[4/3] bg-[#E5E5E5]"}`}>
      <img
        id={id}
        src={`/images/tb3-official/${asset}`}
        alt={alt}
        className={`absolute inset-0 h-full w-full ${hero ? "object-contain" : "object-cover"}`}
        loading={hero ? "eager" : "lazy"}
      />
    </div>
  );
}

function HQLink({ children = "ENTER TB3 HQ →", dark = false }: { children?: ReactNode; dark?: boolean }) {
  return (
    <Link href="/tarris/future" className={`inline-flex items-center justify-center px-5 py-3 text-[10px] font-bold tracking-[0.16em] transition hover:opacity-80 ${dark ? "bg-[#F7F5F2] text-black" : "bg-[#A51C30] text-white"}`}>
      {children}
    </Link>
  );
}

export default function TarrisPublicPage() {
  return (
    <>
    <TarrisViewTracker />
    <div id="public-tarris" className="relative min-h-screen bg-[#F7F5F2] text-[#141414]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(rgba(40,20,20,.6) 0.5px, transparent 0.5px)", backgroundSize: "4px 4px" }} />
      <header id="home" className="border-b border-black/15">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-5 py-5 lg:px-10">
          <a href="#home" className="flex items-center gap-3">
            <span className="text-4xl font-black leading-none tracking-[-0.1em] text-[#A51C30]">TB3</span>
            <span className="border-l border-black/20 pl-3"><span className="block text-xs font-black tracking-[0.15em]">TARRIS BOUIE</span><span className="block pt-1 text-[8px] tracking-[0.2em]">MORE THAN A GAME</span></span>
          </a>
          <nav aria-label="Public navigation" className="order-3 flex w-full flex-wrap justify-center gap-x-5 gap-y-3 border-t border-black/10 pt-4 text-[9px] font-bold tracking-[0.12em] xl:order-none xl:w-auto xl:border-0 xl:pt-0">
            <a href="#home" className="hover:text-[#A51C30]">HOME</a>
            <a href="#about" className="hover:text-[#A51C30]">ABOUT</a>
            <a href="#merch" className="hover:text-[#A51C30]">STORE</a>
            <a href="#book-tarris-form" className="hover:text-[#A51C30]">CONTACT / NIL</a>
          </nav>
          <HQLink />
        </div>
        <PublicCountsBar />
      </header>

      <main className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <section aria-label="Tarris Bouie introduction" className="grid gap-8 border-b border-black/20 py-10 lg:grid-cols-[0.55fr_1.6fr] lg:gap-10 lg:py-14">
          <div className="flex flex-col justify-between gap-8 lg:border-r lg:border-black/15 lg:pr-6">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-[#A51C30]">SAME VISION<br /><span className="text-black">HIGHER PURPOSE</span></p>
            <p className="flex flex-wrap gap-x-4 gap-y-2 text-lg font-black leading-[1.25] tracking-tight lg:block lg:text-3xl">STUDENT<br className="hidden lg:block" /> ATHLETE<br className="hidden lg:block" /> BRAND<br className="hidden lg:block" /> IMPACT</p>
            <p className="text-[9px] leading-5 tracking-[0.12em]">DISCIPLINE.<br />DETERMINATION.<br />DEVELOPMENT.<br />DESTINY.</p>
          </div>
          <div className="text-center">
            <TarrisPhoto id="tb3-public-hero" asset="OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png" alt="TB3: More Than a Game" hero />
            <p className="mt-5 text-[11px] font-semibold tracking-[0.45em]">TARRIS BOUIE</p>
            <h1 className="mt-3 text-[clamp(2.5rem,5.5vw,5.5rem)] font-black leading-[0.95] tracking-[-0.06em]">MORE THAN<br /><span className="text-[#A51C30]">A GAME.</span></h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-black/65">Student. Athlete. Brand. Impact. Tarris is building a future with purpose beyond basketball.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><a href="#about" className="inline-flex items-center border border-black px-5 py-3 text-[10px] font-bold tracking-[0.16em]">ABOUT TARRIS</a><HQLink /></div>
          </div>
        </section>

        <section id="about" aria-labelledby="about-title" className="scroll-mt-5 border-b border-black/20 py-10">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-[9px] font-semibold tracking-[0.25em] text-[#A51C30]">THE JOURNEY BEHIND THE JERSEY</p>
              <h2 id="about-title" className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">MORE THAN<br />A GAME.</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-black/65">Charlotte. Spire. Alabama. Next. Every stop adds something. Discipline in the classroom, determination on the court, and a bigger purpose than basketball shape Tarris’s journey.</p>
          </div>
          <div aria-label="Tarris Bouie photo gallery" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {galleryAssets.map((asset) => <TarrisPhoto key={asset.id} {...asset} />)}
          </div>
        </section>

        <PublicTb3Store />

        <section id="contact" aria-labelledby="contact-title" className="py-10">
          <div className="mb-6"><p className="text-[9px] tracking-[0.25em] text-[#A51C30]">CONTACT / NIL</p><h2 id="contact-title" className="mt-2 text-3xl font-black tracking-tight">BUILD WITH TB3.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">For NIL partnerships, speaking, community opportunities, and booking inquiries, share your details with the team.</p><p className="mt-3 w-fit rounded border border-[#A51C30]/30 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-[#A51C30]">NCAA COMPLIANT • FAMILY OWNED • <a href="mailto:info@tb3fundamentals.com" className="underline">info@tb3fundamentals.com</a></p></div>
          <BookingForm />
        </section>
      </main>

      <footer className="border-t border-black/20">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-5 py-8 lg:px-10">
          <a href="#home" aria-label="TB3 home" className="text-4xl font-black tracking-[-0.1em] text-[#A51C30]">TB3</a>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-4 text-[9px] font-semibold tracking-wider"><a href="#home">HOME</a><a href="#about">ABOUT</a><a href="#merch">STORE</a><a href="#book-tarris-form">CONTACT / NIL</a></nav>
          <HQLink dark>ENTER TB3 HQ →</HQLink>
          <span className="font-serif text-2xl italic text-[#A51C30]">Different On Purpose.</span>
        </div>
      </footer>
    </div>
    </>
  );
}

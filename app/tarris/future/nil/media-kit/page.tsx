import { listPortalFormSubmissions } from "@/lib/portal-forms/store";
import { TB3_PRODUCTS } from "@/app/tarris/data/products";
import { TENANT, PORTAL_BASE, PUBLIC_BASE } from "../../tenant-config";
import CopyMediaKitLink from "./copy-link";

const photos = [
  ["OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png", "TB3 · More Than a Game"], ["OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png", "Headshot · White jersey"], ["OFFICIAL_02_BENCH_YELLOW_KOBE.png", "Bench · Yellow Kobe"], ["OFFICIAL_03_LOW_STANCE_ARENA.png", "Low stance · Arena"], ["OFFICIAL_04_BALL_OVER_SHOULDER.png", "Ball over shoulder"], ["OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png", "Tunnel · Bouie 4"], ["OFFICIAL_06_CABLE_MACHINE.png", "Cable machine"], ["OFFICIAL_07_FILM_TABLET.png", "Film tablet"], ["OFFICIAL_08_HEADSHOT_RED_BG.png", "Headshot · Red background"], ["OFFICIAL_09_LIBRARY_STUDYING.png", "Library · Studying"], ["OFFICIAL_10_CASUAL_LEAN.png", "Casual · Outdoor"], ["OFFICIAL_11_KITCHEN_NUTRITION.png", "Kitchen · Nutrition"], ["OFFICIAL_12_KIDS_ART.png", "Kids · Art"], ["OFFICIAL_13_BLAZER_CHAIR.png", "Blazer · Professional"], ["OFFICIAL_14_YOUTH_HUDDLE.png", "Youth huddle"], ["OFFICIAL_15_PODIUM_SPEAKING.png", "Podium · Speaking"],
] as const;

async function loadAudience() {
  try {
    const rows = await listPortalFormSubmissions(TENANT, { kind: "intake" });
    const waitlist = rows.filter((row) => row.portalSlug === TENANT && row.payload?.tenant === TENANT && row.payload?.formType === "merch-waitlist");
    const demand = TB3_PRODUCTS.map((product) => ({ ...product, count: waitlist.filter((row) => row.payload?.productId === product.id).length })).sort((a, b) => b.count - a.count);
    return { count: waitlist.length, top: waitlist.length ? demand.slice(0, 3) : [] };
  } catch { return { count: 0, top: [] as { id: string; name: string; count: number }[] }; }
}

export const dynamic = "force-dynamic";

export default async function MediaKitPage() {
  const audience = await loadAudience();
  return <main className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-[#F7F5F2] sm:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-center justify-between gap-4"><a href={`${PORTAL_BASE}/nil`} className="text-xs text-white/60 underline">← Deal Room</a><CopyMediaKitLink /></div>
    <header className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#111] p-6 sm:p-10"><p className="text-[10px] font-bold tracking-[0.28em] text-[#E2A8B2]">TB3 · MEDIA KIT</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">MORE THAN<br />A GAME.</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-white/65">A student athlete building with discipline, determination, development, and destiny. The TB3 story is rooted in the journey from Charlotte, through Spire, to Alabama — with purpose beyond basketball.</p></header>
    <section className="mt-6 grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border border-white/10 bg-[#141414] p-5"><p className="text-[10px] font-bold tracking-widest text-white/45">COMMUNITY</p><p className="mt-2 text-3xl font-black">{audience.count.toLocaleString()}</p><p className="mt-1 text-xs text-white/55">fans in the Drop 01 Inner Circle</p></article><article className="rounded-2xl border border-white/10 bg-[#141414] p-5"><p className="text-[10px] font-bold tracking-widest text-white/45">TOP PRODUCT INTEREST</p>{audience.top.length ? <ol className="mt-3 space-y-2">{audience.top.map((product) => <li key={product.id} className="flex justify-between gap-2 text-sm"><span>{product.name}</span><strong>{product.count}</strong></li>)}</ol> : <p className="mt-3 text-sm text-white/55">No Inner Circle signups yet.</p>}</article></section>
    <section className="mt-10"><div className="mb-4"><p className="text-[10px] font-bold tracking-widest text-[#E2A8B2]">APPROVED PHOTO LIBRARY</p><h2 className="mt-2 text-2xl font-black">16 images for partnership conversations</h2></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map(([filename, label]) => <figure key={filename} className="overflow-hidden rounded-xl border border-white/10 bg-[#141414]"><div className="aspect-[4/5] bg-black"><img src={`/images/tb3-official/${filename}`} alt={label} loading="lazy" className="h-full w-full object-cover" /></div><figcaption className="p-3 text-[10px] font-bold">{label}</figcaption></figure>)}</div></section>
    <section className="mt-10 rounded-2xl border border-white/10 bg-[#141414] p-6"><p className="text-[10px] font-bold tracking-widest text-[#E2A8B2]">PARTNERSHIP CONTACT</p><h2 className="mt-2 text-2xl font-black">Start the conversation.</h2><p className="mt-2 text-sm text-white/60">For NIL partnerships, speaking, community opportunities, and booking inquiries, contact the team through the official TB3 inquiry form.</p><a href={`${PUBLIC_BASE}#contact`} className="mt-4 inline-flex rounded-lg border border-white/20 px-4 py-3 text-xs font-bold">Open TB3 Inquiry Form →</a><a href={`${PORTAL_BASE}/brand-assets`} className="ml-3 mt-4 inline-flex rounded-lg border border-white/20 px-4 py-3 text-xs font-bold">Browse Brand Assets →</a></section>
    <footer className="mt-8 border-t border-white/10 py-5 text-center text-[10px] font-bold uppercase tracking-wider text-white/55">Contact: <a className="text-[#E2A8B2] underline" href="mailto:info@tb3fundamentals.com">info@tb3fundamentals.com</a> — TB3 Fundamentals — Family Owned — NCAA Compliant — More Than A Game</footer>
  </div></main>;
}

"use client";

import { useEffect, useState } from "react";
import { TarrisPortalFrame } from "../portal-shell";
import { SOCIAL_TEMPLATES, type SocialStats } from "../content/templates";
import { TENANT } from "../tenant-config";

const photos = [
  ["OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png", "TB3 · More Than a Game"],
  ["OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png", "Headshot · White jersey"],
  ["OFFICIAL_02_BENCH_YELLOW_KOBE.png", "Bench · Yellow Kobe"],
  ["OFFICIAL_03_LOW_STANCE_ARENA.png", "Low stance · Arena"],
  ["OFFICIAL_04_BALL_OVER_SHOULDER.png", "Ball over shoulder"],
  ["OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png", "Tunnel · Bouie 4"],
  ["OFFICIAL_06_CABLE_MACHINE.png", "Cable machine"],
  ["OFFICIAL_07_FILM_TABLET.png", "Film tablet"],
  ["OFFICIAL_08_HEADSHOT_RED_BG.png", "Headshot · Red background"],
  ["OFFICIAL_09_LIBRARY_STUDYING.png", "Library · Studying"],
  ["OFFICIAL_10_CASUAL_LEAN.png", "Casual · Outdoor"],
  ["OFFICIAL_11_KITCHEN_NUTRITION.png", "Kitchen · Nutrition"],
  ["OFFICIAL_12_KIDS_ART.png", "Kids · Art"],
  ["OFFICIAL_13_BLAZER_CHAIR.png", "Blazer · Professional"],
  ["OFFICIAL_14_YOUTH_HUDDLE.png", "Youth huddle"],
  ["OFFICIAL_15_PODIUM_SPEAKING.png", "Podium · Speaking"],
] as const;

type Draft = { id: string; templateId: string; image: string; caption: string; status: string; createdAt: string };
const approvedPhotos = [
  "OFFICIAL_00_HERO_TB3_MORE_THAN_A_GAME.png", "OFFICIAL_01_HEADSHOT_FRONT_BLACK_BG.png", "OFFICIAL_02_BENCH_YELLOW_KOBE.png", "OFFICIAL_03_LOW_STANCE_ARENA.png", "OFFICIAL_04_BALL_OVER_SHOULDER.png", "OFFICIAL_05_TUNNEL_BOUIE_4_BACK.png", "OFFICIAL_06_CABLE_MACHINE.png", "OFFICIAL_07_FILM_TABLET.png", "OFFICIAL_08_HEADSHOT_RED_BG.png", "OFFICIAL_09_LIBRARY_STUDYING.png", "OFFICIAL_10_CASUAL_LEAN.png", "OFFICIAL_11_KITCHEN_NUTRITION.png", "OFFICIAL_12_KIDS_ART.png", "OFFICIAL_13_BLAZER_CHAIR.png", "OFFICIAL_14_YOUTH_HUDDLE.png", "OFFICIAL_15_PODIUM_SPEAKING.png",
];
const merchImages = ["tb3-tee-red", "tb3-tee-white", "tb3-long-sleeve-crimson", "tb3-long-sleeve-white", "tb3-hat-white", "tb3-hoodie-crimson", "tb3-hoodie-white", "tb3-crewneck-white", "tb3-jogger-black", "tb3-duffel-black"].map((name) => `/tb3/merch/${name}.png`);
function AutoSocialDrafts() {
  const [stats, setStats] = useState<SocialStats>({ innerCircleCount: 0, topProduct: "No signups yet", pageViews: 0 });
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch("/api/tarris/public-stats", { cache: "no-store" }).then((response) => response.json()),
      fetch(`/api/social-draft?tenant=${encodeURIComponent(TENANT)}`, { cache: "no-store" }).then((response) => response.json()),
    ]).then(([publicData, draftData]) => {
      if (!mounted) return;
      if (publicData.ok) setStats({ innerCircleCount: publicData.innerCircleCount, topProduct: publicData.topProduct?.name || "No signups yet", pageViews: publicData.pageViews });
      if (draftData.ok) setDrafts(draftData.drafts as Draft[]);
      else setNotice("Sign in with staff access to use the draft queue.");
    }).catch(() => { if (mounted) setNotice("Sign in with staff access to use the draft queue."); });
    return () => { mounted = false; };
  }, []);
  async function generate() {
    setBusy(true); setNotice("");
    try {
      const template = SOCIAL_TEMPLATES[Math.floor(Math.random() * SOCIAL_TEMPLATES.length)];
      const photos = [...approvedPhotos.map((name) => `/images/tb3-official/${name}`), ...merchImages];
      const image = photos[Math.floor(Math.random() * photos.length)];
      const response = await fetch("/api/social-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant: TENANT, templateId: template.id, image, caption: template.caption(stats), status: "pending approval" }) });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || "Draft could not be saved.");
      setDrafts((current) => [body.draft as Draft, ...current]); setNotice("Draft saved for family review.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Draft could not be saved."); }
    finally { setBusy(false); }
  }
  async function approve(draft: Draft) {
    try {
      await navigator.clipboard.writeText(draft.caption);
      // TODO: When real Amplifi mounts, replace Approve with amplifi.post({tenant, image, caption}) after family review.
      const response = await fetch("/api/social-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve", draftId: draft.id }) });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || "Approval could not be saved.");
      setDrafts((current) => current.map((item) => item.id === draft.id ? { ...item, status: "approved" } : item));
      setNotice("Caption copied. Draft marked approved; it was not posted.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Caption could not be copied."); }
  }
  return <section className="mb-8 rounded-2xl border border-[#C41E3A]/35 bg-[#111] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold tracking-widest text-[#E2A8B2]">AMPLIFI-LITE · FAMILY REVIEW</p><h2 className="mt-2 text-xl font-black">Draft queue</h2><p className="mt-1 text-xs text-white/50">Posts are drafted for approval; nothing publishes automatically.</p></div><button type="button" onClick={generate} disabled={busy} className="rounded-lg bg-[#C41E3A] px-4 py-3 text-xs font-black disabled:opacity-60">{busy ? "Generating…" : "Auto-Generate Post"}</button></div>
    {notice&&<p role="status" className="mt-3 text-xs text-white/65">{notice}</p>}
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{drafts.map((draft) => <article key={draft.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#181818]"><div className="aspect-[4/3] bg-black"><img src={draft.image} alt="Suggested TB3 social post" className="h-full w-full object-cover" /></div><div className="p-4"><p className="text-xs leading-5">{draft.caption}</p><p className="mt-2 text-[9px] uppercase tracking-widest text-white/40">{draft.status}</p>{draft.status !== "approved"&&<button type="button" onClick={() => approve(draft)} className="mt-3 rounded border border-white/20 px-3 py-2 text-[10px] font-bold">Approve · Copy Caption</button>}</div></article>)}</div>
    {!drafts.length&&<p className="mt-4 text-xs text-white/45">No drafts yet.</p>}
  </section>;
}

export default function GalleryPage() {
  return <TarrisPortalFrame contentClassName="max-w-screen-2xl"><header className="mb-8"><p className="text-[10px] font-bold tracking-[0.24em] text-[#C41E3A]">TB3 HQ · APPROVED MEDIA</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">CONTENT / GALLERY</h1><p className="mt-3 text-sm text-white/60">16 approved athlete, academic, brand, community, and future images.</p></header><AutoSocialDrafts /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{photos.map(([filename, label]) => <figure key={filename} className="overflow-hidden rounded-xl border border-white/10 bg-[#141414]"><div className="aspect-[4/5] bg-black"><img src={`/images/tb3-official/${filename}`} alt={label} loading="lazy" className="h-full w-full object-cover" /></div><figcaption className="flex items-center justify-between gap-2 p-3 text-[10px] font-bold"><span>{label}</span><a href={`/images/tb3-official/${filename}`} download className="shrink-0 underline underline-offset-2">Download</a></figcaption></figure>)}</div></TarrisPortalFrame>;
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { tb3FilmAssets, tb3ScoreboardAsset, type Tb3FilmAsset } from "../tarris/tb3-film";

const actions = [
  { label: "Edit Intake Form", kind: "link", href: "/tarris/book", detail: "Open the TB3 booking intake." },
  { label: "Edit Registration Form", kind: "link", href: "/portal/tarris/events", detail: "Open the TB3 event registration workspace." },
  { label: "Add Warm Letter", kind: "draft", detail: "Write a warm letter draft on this phone." },
  { label: "Add Video / Photo", kind: "media", detail: "Choose a media file to review before it is added to the vault." },
  { label: "Publish to Live Site", kind: "publish", detail: "Live publishing continues through the approved EA release workflow." },
] as const;

type Action = (typeof actions)[number];

export default function Tb3PhoneHqPage() {
  const [selectedAsset, setSelectedAsset] = useState<Tb3FilmAsset | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [warmLetter, setWarmLetter] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const [mediaName, setMediaName] = useState("");

  function saveWarmLetter() {
    window.localStorage.setItem("tb3-hq-warm-letter-draft", warmLetter);
    setDraftSaved(true);
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F7F5F2]">
      <div className="mx-auto w-full max-w-xl px-4 pb-12 pt-5 sm:px-6">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-[10px] font-bold tracking-[0.28em] text-white/55">TARRIS BOUIE · PRIVATE</p>
            <h1 className="mt-1 text-4xl font-black tracking-tight">TB3 <span className="text-[#C41E3A]">HQ</span></h1>
          </div>
          <Link href="/tarris" className="rounded-xl border border-white/20 px-4 py-3 text-xs font-bold">Public Site</Link>
        </header>

        <section aria-labelledby="film-vault-title" className="mt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.24em] text-[#C41E3A]">TB3 MEDIA LIBRARY</p>
              <h2 id="film-vault-title" className="mt-1 text-2xl font-black">FILM 5 VAULT</h2>
            </div>
            <span className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-bold">3 LIVE · 2 ARCHIVE</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/60">Tap a large thumbnail to open the film with sound and playback controls.</p>

          <div className="mt-4 grid gap-4">
            {tb3FilmAssets.map((asset) => (
              <article key={asset.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212]">
                <button type="button" onClick={() => setSelectedAsset(asset)} aria-label={`Play ${asset.title}`} className="group relative block aspect-video w-full bg-black text-left">
                  <img src={asset.poster} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute inset-0 bg-black/25 transition group-hover:bg-black/10" />
                  <span className="absolute inset-0 grid place-items-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-white text-2xl text-[#A51C30]">▶</span></span>
                  {asset.archived && <span className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-2 text-[10px] font-black tracking-widest">ARCHIVE</span>}
                </button>
                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <div><h3 className="text-sm font-black tracking-wide">{asset.title}</h3><p className="mt-1 text-xs text-white/50">{asset.archived ? "Archived film" : "Live film"}</p></div>
                  <button type="button" onClick={() => setSelectedAsset(asset)} className="min-h-12 shrink-0 rounded-xl bg-[#C41E3A] px-4 text-xs font-black">PLAY</button>
                </div>
              </article>
            ))}
          </div>

          <article className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#121212]">
            <button type="button" onClick={() => setSelectedAsset(tb3ScoreboardAsset)} aria-label="View scoreboard photo" className="group relative block aspect-video w-full bg-black">
              <img src={tb3ScoreboardAsset.poster} alt="Alabama scoreboard showing 111-93 and 18 points, 8 rebounds, 3 assists" className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10" />
              <span className="absolute bottom-3 left-3 rounded-lg bg-black/80 px-3 py-2 text-[10px] font-black tracking-widest">PHOTO PROOF</span>
            </button>
            <div className="px-4 py-4"><h3 className="text-sm font-black">SCOREBOARD · 18/8/3/1 · ALABAMA 111-93</h3><button type="button" onClick={() => setSelectedAsset(tb3ScoreboardAsset)} className="mt-3 min-h-12 rounded-xl border border-white/20 px-4 text-xs font-bold">VIEW IMAGE</button></div>
          </article>
        </section>

        <section aria-labelledby="update-hub-title" className="mt-8 rounded-2xl border border-white/10 bg-[#121212] p-4 sm:p-5">
          <p className="text-[10px] font-bold tracking-[0.24em] text-[#C41E3A]">PHONE CONTROL CENTER</p>
          <h2 id="update-hub-title" className="mt-1 text-2xl font-black">UPDATE HUB</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">Quick doors for the next TB3 updates.</p>
          <div className="mt-4 grid gap-3">
            {actions.map((action) => action.kind === "link" ? (
              <Link key={action.label} href={action.href} className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#1A1A1A] px-4 py-4 text-left text-sm font-black shadow-sm transition hover:border-[#C41E3A]">
                <span>{action.label}</span><span aria-hidden="true" className="text-xl text-[#C41E3A]">→</span>
              </Link>
            ) : (
              <button key={action.label} type="button" onClick={() => { setDraftSaved(false); setMediaName(""); setSelectedAction(action); }} className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#1A1A1A] px-4 py-4 text-left text-sm font-black shadow-sm transition hover:border-[#C41E3A]">
                <span>{action.label}</span><span aria-hidden="true" className="text-xl text-[#C41E3A]">→</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-5 text-white/45">Media and live-site changes use the approved TB3 publishing flow.</p>
        </section>
      </div>

      {selectedAsset && (
        <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3" onClick={(event) => { if (event.target === event.currentTarget) setSelectedAsset(null); }}>
          <div role="dialog" aria-modal="true" aria-label={selectedAsset.title} className="w-full max-w-3xl">
            <button type="button" onClick={() => setSelectedAsset(null)} className="mb-3 min-h-12 rounded-xl border border-white/25 px-4 text-sm font-bold">CLOSE</button>
            {selectedAsset.type === "video" ? <video src={selectedAsset.mediaUrl} poster={selectedAsset.poster} controls autoPlay playsInline preload="metadata" className="max-h-[78dvh] w-full bg-black object-contain" /> : <img src={selectedAsset.mediaUrl} alt={selectedAsset.title} className="max-h-[78dvh] w-full object-contain" />}
            <p className="mt-3 text-sm font-bold">{selectedAsset.title}</p>
          </div>
        </div>
      )}

      {selectedAction && (
        <div role="presentation" className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 sm:items-center" onClick={(event) => { if (event.target === event.currentTarget) setSelectedAction(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="hq-action-title" className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#141414] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[0.2em] text-[#C41E3A]">UPDATE HUB</p><h2 id="hq-action-title" className="mt-1 text-xl font-black">{selectedAction.label}</h2></div><button type="button" onClick={() => setSelectedAction(null)} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 text-2xl">×</button></div>
            <p className="mt-3 text-sm leading-6 text-white/70">{selectedAction.detail}</p>
            {selectedAction.kind === "draft" && <div className="mt-4"><label htmlFor="warm-letter-draft" className="text-xs font-bold">Warm letter draft</label><textarea id="warm-letter-draft" value={warmLetter} onChange={(event) => setWarmLetter(event.target.value)} rows={6} className="mt-2 w-full rounded-xl border border-white/15 bg-black p-3 text-sm" placeholder="Write a draft..."/><button type="button" onClick={saveWarmLetter} className="mt-3 min-h-12 w-full rounded-xl bg-[#C41E3A] px-4 text-sm font-black">SAVE DRAFT ON THIS PHONE</button>{draftSaved&&<p role="status" className="mt-3 text-xs text-green-300">Draft saved in this browser.</p>}</div>}
            {selectedAction.kind === "media" && <div className="mt-4"><label htmlFor="hq-media-pick" className="flex min-h-14 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/30 px-4 text-sm font-bold">CHOOSE VIDEO OR PHOTO<input id="hq-media-pick" type="file" accept="video/*,image/*" className="sr-only" onChange={(event) => setMediaName(event.target.files?.[0]?.name ?? "")}/></label>{mediaName&&<p role="status" className="mt-3 break-all text-xs text-white/70">Selected for review: {mediaName}</p>}<p className="mt-3 text-xs leading-5 text-white/45">Selecting a file here does not upload or publish it.</p></div>}
            {selectedAction.kind === "publish" && <p className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 text-xs leading-5 text-white/65">The button opens the release handoff. A reviewed, approved Vercel deployment is still required before changes appear on the live site.</p>}
          </section>
        </div>
      )}
    </main>
  );
}

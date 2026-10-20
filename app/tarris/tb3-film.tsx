"use client";

import { useEffect, useState } from "react";

// TB3-only verified collection: four distinct videos and one static scoreboard photograph.
export type Tb3FilmAsset = {
  id: string;
  title: string;
  filename: string;
  poster: string;
  category: "Athlete";
  subcategory: "Film";
  type: "video" | "photo";
};
export const tb3FilmAssets: Tb3FilmAsset[] = [
  { id: "TB3-FILM-001", title: "FILM 01 - DUNK", filename: "TB3-FILM-001-DUNK-HD.mp4", poster: "/videos/tb3-film/TB3-FILM-001-poster.webp", category: "Athlete", subcategory: "Film", type: "video" },
  { id: "TB3-FILM-002", title: "FILM 02 - JUMBOTRON 18/8/3", filename: "TB3-FILM-002-JUMBOTRON-18-8-3-HD.mp4", poster: "/videos/tb3-film/TB3-FILM-005-SCOREBOARD-PROOF.jpg", category: "Athlete", subcategory: "Film", type: "video" },
  { id: "TB3-FILM-003", title: "FILM 03 - DRIVE", filename: "TB3-FILM-003-DRIVE-FINISH-HD.mp4", poster: "/videos/tb3-film/TB3-FILM-003-poster.webp", category: "Athlete", subcategory: "Film", type: "video" },
  { id: "TB3-FILM-004", title: "FILM 04 - DEFENSE", filename: "TB3-FILM-004-DEFENSE-BATTLE-HD.mp4", poster: "/videos/tb3-film/TB3-FILM-004-poster.webp", category: "Athlete", subcategory: "Film", type: "video" },
  { id: "TB3-FILM-005", title: "SCOREBOARD PROOF - 18/8/3/1", filename: "TB3-FILM-005-SCOREBOARD-PROOF.jpg", poster: "/videos/tb3-film/TB3-FILM-005-poster.webp", category: "Athlete", subcategory: "Film", type: "photo" },
];

export function tb3FilmUrl(filename: string) {
  return "/videos/tb3-film/" + filename;
}

export function Tb3FilmGrid() {
  const [selected, setSelected] = useState<Tb3FilmAsset | null>(null);
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);
  const onHoverStart = (element: HTMLButtonElement) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const preview = element.querySelector("video");
    if (preview) void preview.play().catch(() => {});
  };
  const onHoverEnd = (element: HTMLButtonElement) => {
    const preview = element.querySelector("video");
    if (preview) {
      preview.pause();
      preview.currentTime = 0;
    }
  };
  return (
    <div id="tb3-film" className="mt-10 border-t border-black/20 pt-8">
      <p className="text-[9px] font-semibold tracking-[0.2em] text-[#A51C30]">TB3 FILM</p>
      <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">18 PTS 8 REB 3 AST <span className="text-[#A51C30]">| ALABAMA - 111-93</span></h3>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tb3FilmAssets.map((film) => (
          <article key={film.id} className="min-w-0 overflow-hidden border border-black/20">
            <button
              type="button"
              aria-label={(film.type === "photo" ? "View " : "Play ") + film.title}
              onClick={() => setSelected(film)}
              onMouseEnter={(event) => { if (film.type === "video") onHoverStart(event.currentTarget); }}
              onMouseLeave={(event) => onHoverEnd(event.currentTarget)}
              className="group relative block w-full overflow-hidden bg-[#141414] text-left"
            >
              {film.type === "video" ? <video className="aspect-video w-full object-cover" src={tb3FilmUrl(film.filename)} poster={film.poster} muted loop playsInline preload="metadata" aria-hidden="true" /> : <img className="aspect-video w-full object-cover" src={film.poster} alt={film.title} loading="lazy" />}
              <span className="pointer-events-none absolute inset-0 bg-black/35 transition group-hover:bg-black/20" />
              {film.type === "video" && <span className="pointer-events-none absolute inset-0 grid place-items-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-white text-xl text-[#A51C30] transition group-hover:scale-105" aria-hidden="true">▶</span></span>}
            </button>
            <p className="px-3 py-4 text-[10px] font-black uppercase tracking-widest">{film.title}</p>
          </article>
        ))}
      </div>
      {selected && (
        <div role="presentation" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-8" onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div role="dialog" aria-modal="true" aria-label={selected.title} className="relative w-full max-w-6xl">
            <button type="button" onClick={() => setSelected(null)} aria-label="Close film" className="absolute -top-11 right-0 grid h-10 w-10 place-items-center rounded-full border border-white/40 text-2xl text-white">×</button>
            {selected.type === "video" ? <video key={selected.id} src={tb3FilmUrl(selected.filename)} poster={selected.poster} controls autoPlay playsInline preload="metadata" className="max-h-[85dvh] w-full bg-black object-contain" /> : <img src={tb3FilmUrl(selected.filename)} alt={selected.title} className="max-h-[85dvh] w-full object-contain" />}
            <p className="mt-3 text-xs font-bold tracking-widest text-white">{selected.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}

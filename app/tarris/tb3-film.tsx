"use client";

import { useEffect, useState } from "react";

export type Tb3FilmAsset = {
  id: string;
  title: string;
  filename: string;
  mediaUrl: string;
  poster: string;
  category: "Athlete";
  subcategory: "Film";
  type: "video" | "photo";
  archived?: boolean;
};

const video = (
  id: string,
  title: string,
  filename: string,
  poster: string,
  archived = false,
): Tb3FilmAsset => ({
  id,
  title,
  filename,
  mediaUrl: "/videos/tb3-film/" + filename,
  poster,
  category: "Athlete",
  subcategory: "Film",
  type: "video",
  archived,
});

export const tb3FilmAssets: Tb3FilmAsset[] = [
  video("TB3-FILM-01", "FILM · DRIVE", "TB3-FILM-003-DRIVE-FINISH-HD.mp4", "/videos/tb3-film/TB3-FILM-003-poster.webp"),
  video("TB3-FILM-02", "FILM · DEFENSE", "TB3-FILM-004-DEFENSE-BATTLE-HD.mp4", "/videos/tb3-film/TB3-FILM-004-poster.webp"),
  video("TB3-FILM-03", "FILM · PUTBACK", "TB3-FILM-003-PUTBACK-GLASS-HD.mp4", "/images/tb3-film/scoreboard.webp"),
  video("TB3-FILM-04", "FILM · DUNK · ARCHIVE", "TB3-FILM-001-DUNK-HD.mp4", "/videos/tb3-film/TB3-FILM-001-poster.webp", true),
  video("TB3-FILM-05", "FILM · JUMBOTRON · ARCHIVE", "TB3-FILM-002-JUMBOTRON-18-8-3-HD.mp4", "/videos/tb3-film/TB3-FILM-002-poster.webp", true),
];

export const tb3ScoreboardAsset: Tb3FilmAsset = {
  id: "TB3-SCOREBOARD-18-8-3-1",
  title: "SCOREBOARD · 18/8/3/1 · ALABAMA 111-93",
  filename: "scoreboard.jpg",
  mediaUrl: "/images/tb3-film/scoreboard.jpg",
  poster: "/images/tb3-film/scoreboard.webp",
  category: "Athlete",
  subcategory: "Film",
  type: "photo",
};

export const tb3HomepageFilmAssets: Tb3FilmAsset[] = [
  ...tb3FilmAssets.slice(0, 3),
  tb3ScoreboardAsset,
];

export const tb3FilmVaultAssets: Tb3FilmAsset[] = [
  ...tb3FilmAssets,
  tb3ScoreboardAsset,
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
      <section aria-label="Final Lineup" className="mt-6">
        <h4 className="text-sm font-black uppercase tracking-widest">Final Lineup</h4>
        <p className="mt-2 text-sm font-bold">Drive · Defense · Putback</p>
      </section>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tb3HomepageFilmAssets.map((film) => (
          <article key={film.id} className="min-w-0 overflow-hidden border border-black/20">
            <button
              type="button"
              aria-label={(film.type === "photo" ? "View " : "Play ") + film.title}
              onClick={() => setSelected(film)}
              onMouseEnter={(event) => { if (film.type === "video") onHoverStart(event.currentTarget); }}
              onMouseLeave={(event) => onHoverEnd(event.currentTarget)}
              className="group relative block w-full overflow-hidden bg-[#141414] text-left"
            >
              {film.type === "video" ? <video className="aspect-video w-full object-cover" src={film.mediaUrl} poster={film.poster} muted loop playsInline preload="metadata" aria-hidden="true" /> : <img className="aspect-video w-full object-cover" src={film.poster} alt={film.title} loading="lazy" />}
              <span className="pointer-events-none absolute inset-0 bg-black/35 transition group-hover:bg-black/20" />
              {film.type === "video" && <span className="pointer-events-none absolute inset-0 grid place-items-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-white text-xl text-[#A51C30] transition group-hover:scale-105" aria-hidden="true">▶</span></span>}
            </button>
            <p className="px-3 py-4 text-[10px] font-black uppercase tracking-widest">{film.title}</p>
          </article>
        ))}
      </div>
      <section aria-label="Archive Vault" className="mt-8 border-t border-black/20 pt-6">
        <h4 className="text-sm font-black uppercase tracking-widest">Archive Vault</h4>
        <p className="mt-2 text-sm font-bold">Dunk + Jumbotron</p>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {tb3FilmAssets.filter((film) => film.archived).map((film) => (
            <article key={film.id} className="min-w-0 overflow-hidden border border-black/20">
              <button
                type="button"
                aria-label={"Play " + film.title}
                onClick={() => setSelected(film)}
                className="group relative block w-full overflow-hidden bg-[#141414] text-left"
              >
                <video className="aspect-video w-full object-cover" src={film.mediaUrl} poster={film.poster} muted loop playsInline preload="none" aria-hidden="true" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-white text-xl text-[#A51C30]" aria-hidden="true">▶</span></span>
              </button>
              <p className="px-3 py-4 text-sm font-black">{film.id === "TB3-FILM-04" ? "Dunk" : "Jumbotron"}</p>
            </article>
          ))}
        </div>
      </section>
      {selected && (
        <div role="presentation" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-8" onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div role="dialog" aria-modal="true" aria-label={selected.title} className="relative w-full max-w-6xl">
            <button type="button" onClick={() => setSelected(null)} aria-label="Close film" className="absolute -top-11 right-0 grid h-10 w-10 place-items-center rounded-full border border-white/40 text-2xl text-white">×</button>
            {selected.type === "video" ? <video key={selected.id} src={selected.mediaUrl} poster={selected.poster} controls autoPlay playsInline preload="metadata" className="max-h-[85dvh] w-full bg-black object-contain" /> : <img src={selected.mediaUrl} alt={selected.title} className="max-h-[85dvh] w-full object-contain" />}
            <p className="mt-3 text-xs font-bold tracking-widest text-white">{selected.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}

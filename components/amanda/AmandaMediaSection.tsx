'use client';

import { useEffect, useState } from 'react';

type MediaItem = { id: string; title: string; url: string; type: 'image' | 'video'; sort_order: number };

export default function AmandaMediaSection() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/public/amanda/media', { cache: 'force-cache' })
      .then((response) => response.json())
      .then((payload) => { if (active && payload.ok) setMedia(payload.media || []); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  if (!media.length) return null;
  return (
    <section className="ac-section ac-alt" id="media">
      <div className="ac-wrap">
        <p className="ac-eyebrow">Media library</p>
        <h2>Stories, teaching and community.</h2>
        <div className="ac-course-grid">
          {media.map((item) => (
            <button key={item.id} type="button" className="ac-course text-left" onClick={() => setSelected(item)} aria-label={`Open ${item.title}`}>
              {item.type === 'video'
                ? <video src={item.url} controls preload="metadata" className="w-full" aria-label={item.title} />
                : <img src={item.url} alt={item.title} className="w-full object-cover" loading="lazy" />}
              <strong className="mt-3 block">{item.title}</strong>
            </button>
          ))}
        </div>
        {selected && (
          <div role="dialog" aria-modal="true" aria-label={selected.title} className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-5" onClick={() => setSelected(null)}>
            <button type="button" className="absolute right-5 top-5 rounded bg-white px-4 py-2" onClick={() => setSelected(null)}>Close</button>
            {selected.type === 'video'
              ? <video src={selected.url} controls autoPlay className="max-h-[85vh] max-w-full" onClick={(event) => event.stopPropagation()} />
              : <img src={selected.url} alt={selected.title} className="max-h-[85vh] max-w-full object-contain" onClick={(event) => event.stopPropagation()} />}
          </div>
        )}
      </div>
    </section>
  );
}

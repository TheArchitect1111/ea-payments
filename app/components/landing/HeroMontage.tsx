'use client';

import { useEffect, useState } from 'react';

const MONTAGE = [
  {
    src: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=2000&q=88',
    alt: 'Father watching his daughter on the court, golden hour light',
  },
  {
    src: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=2000&q=88',
    alt: 'Community leaders celebrating after serving together',
  },
  {
    src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=2000&q=88',
    alt: 'Entrepreneur opening the door to a growing business',
  },
  {
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2000&q=88',
    alt: 'Pastor speaking with a young family after service',
  },
  {
    src: 'https://images.unsplash.com/photo-1593113598148-3655c4d566bb?auto=format&fit=crop&w=2000&q=88',
    alt: 'Coach mentoring an athlete on the field',
  },
  {
    src: 'https://images.unsplash.com/photo-1573497019940-88c6a86b0a2f?auto=format&fit=crop&w=2000&q=88',
    alt: 'Business owner walking confidently toward a new opportunity',
  },
  {
    src: 'https://images.unsplash.com/photo-1511895426328-ac872781f227?auto=format&fit=crop&w=2000&q=88',
    alt: 'Family gathered around a dinner table laughing together',
  },
];

export default function HeroMontage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % MONTAGE.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  const current = MONTAGE[index];

  return (
    <div className="pl-hero-montage" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MONTAGE[0].src} alt="" className="pl-hero-montage-img pl-hero-montage-base" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current.src}
        src={current.src}
        alt=""
        className="pl-hero-montage-img pl-hero-montage-fade"
      />
      <div className="pl-hero-montage-veil" />
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';

const MOMENTS = [
  {
    question: 'What if communication reached the right people automatically?',
    src: 'https://images.unsplash.com/photo-1521737711867-e3b97375f602?auto=format&fit=crop&w=1600&q=85',
    alt: 'Leaders connecting with clarity and warmth',
  },
  {
    question: 'What if everyone knew the next step?',
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=85',
    alt: 'A team moving forward with quiet confidence',
  },
  {
    question: 'What if opportunities surfaced before they disappeared?',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=85',
    alt: 'A leader seeing a new path open ahead',
  },
  {
    question: 'What if growth no longer created confusion?',
    src: 'https://images.unsplash.com/photo-1476705147036-43cd080da2f3?auto=format&fit=crop&w=1600&q=85',
    alt: 'A family present together without distraction',
  },
  {
    question: 'What if clarity replaced chaos?',
    src: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85',
    alt: 'Collaboration that feels calm and human',
  },
  {
    question: 'What if confidence replaced uncertainty?',
    src: 'https://images.unsplash.com/photo-1573497019940-88c6a86b0a2f?auto=format&fit=crop&w=1600&q=85',
    alt: 'A leader walking forward with quiet assurance',
  },
  {
    question: 'What if your mission had room to breathe?',
    src: 'https://images.unsplash.com/photo-1464226184743-18fd08086df7?auto=format&fit=crop&w=1600&q=85',
    alt: 'Purposeful work with space to lead',
  },
];

export default function ConsiderScroll() {
  const [active, setActive] = useState(0);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const blocks = blockRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!blocks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = blocks.indexOf(visible.target as HTMLDivElement);
        if (index >= 0) setActive(index);
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: [0.15, 0.35, 0.55] },
    );

    blocks.forEach((block) => observer.observe(block));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="pl-consider-layout">
      <div className="pl-consider-visual pl-consider-visual-sticky" aria-hidden="true">
        {MOMENTS.map((moment, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={moment.question}
            src={moment.src}
            alt=""
            className={`pl-consider-img${i === active ? ' is-active' : ''}`}
          />
        ))}
      </div>
      <div className="pl-consider-steps">
        {MOMENTS.map((moment, i) => (
          <div
            key={moment.question}
            ref={(el) => {
              blockRefs.current[i] = el;
            }}
            className="pl-consider-step"
          >
            <Reveal>
              <p className={`pl-consider-q pl-consider-q-static${i === active ? ' is-active' : ''}`}>
                {moment.question}
              </p>
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  );
}

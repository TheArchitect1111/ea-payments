'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

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
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  return (
    <div className="pl-consider-track" ref={ref}>
      <div className="pl-consider-sticky">
        <div className="pl-consider-visual">
          {MOMENTS.map((moment, i) => (
            <ConsiderFrame
              key={moment.question}
              index={i}
              total={MOMENTS.length}
              progress={scrollYProgress}
              src={moment.src}
              alt={moment.alt}
              reduce={Boolean(reduce)}
            />
          ))}
        </div>
        <div className="pl-consider-questions">
          {MOMENTS.map((moment, i) => (
            <ConsiderQuestion
              key={moment.question}
              index={i}
              total={MOMENTS.length}
              progress={scrollYProgress}
              text={moment.question}
              reduce={Boolean(reduce)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ConsiderFrame({
  index,
  total,
  progress,
  src,
  alt,
  reduce,
}: {
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  src: string;
  alt: string;
  reduce: boolean;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [start, start + 0.08, end - 0.08, end], [0, 1, 1, 0]);

  if (reduce) {
    return index === 0 ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="pl-consider-img" />
    ) : null;
  }

  return (
    <motion.img
      style={{ opacity }}
      src={src}
      alt={alt}
      className="pl-consider-img"
    />
  );
}

function ConsiderQuestion({
  index,
  total,
  progress,
  text,
  reduce,
}: {
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  text: string;
  reduce: boolean;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [start, start + 0.06, end - 0.06, end], [0.15, 1, 1, 0.15]);
  const y = useTransform(progress, [start, end], [24, -24]);

  if (reduce) {
    return <p className="pl-consider-q pl-consider-q-static">{text}</p>;
  }

  return (
    <motion.p className="pl-consider-q" style={{ opacity, y }}>
      {text}
    </motion.p>
  );
}

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import type { ExperienceStory } from '@/lib/home-emotion';

function SceneImage({
  src,
  alt,
  priority = false,
  objectPosition,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  objectPosition?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`he-photo${failed ? ' is-missing' : ''}`}>
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          style={objectPosition ? { objectPosition } : undefined}
          onError={() => setFailed(true)}
        />
      )}
      {failed && <span className="he-photo-fallback" aria-label={alt} />}
    </div>
  );
}

type Props = {
  story: ExperienceStory;
  index: number;
};

export default function ExperienceScene({ story, index }: Props) {
  const reduce = useReducedMotion();
  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.25 },
        transition: { duration: 0.7, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] as const },
      };

  const headlineParts = story.headline.includes('.')
    ? story.headline.split(/(?<=\.)\s*/)
    : [story.headline];

  return (
    <motion.section
      className={`he-scene${story.bright ? ' is-bright' : ''}`}
      id={index === 0 ? 'experiences' : undefined}
      aria-labelledby={`scene-${story.id}`}
      {...rise}
    >
      <div className="he-scene-bg">
        <SceneImage
          src={story.image}
          alt={story.imageAlt}
          priority={index === 0}
          objectPosition={story.imagePosition}
        />
      </div>
      <div className="he-scene-scrim" aria-hidden="true" />

      <div className="he-scene-body">
        <div className="he-scene-copy">
          <h2 id={`scene-${story.id}`} className="he-scene-headline">
            {headlineParts.map((part, i) => (
              <span key={i}>{part}</span>
            ))}
          </h2>
          <p className="he-scene-sentence">{story.sentence}</p>
        </div>

        <ul className="he-floating-cards" aria-label="Systems working quietly in the background">
          {story.cards.map((card, i) => (
            <motion.li
              key={card.label}
              className="he-float-card"
              {...(reduce
                ? {}
                : {
                    initial: { opacity: 0, y: 16 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.5, delay: 0.15 + i * 0.08 },
                  })}
            >
              <span className="he-float-icon" aria-hidden="true">
                {card.icon}
              </span>
              <span className="he-float-label">{card.label}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}

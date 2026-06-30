'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { athleticsShowcase } from '@/lib/home-emotion';

export default function AthleticsShowcase() {
  const reduce = useReducedMotion();
  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.22 },
        transition: { duration: 0.82, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section className="he-athletics" id="athletics" aria-labelledby="athletics-title">
      <div className="he-athletics-inner">
        <motion.div className="he-athletics-head" {...rise}>
          <p className="he-athletics-eyebrow">{athleticsShowcase.eyebrow}</p>
          <h2 id="athletics-title" className="he-athletics-title">
            {athleticsShowcase.headline}
          </h2>
          <p className="he-athletics-intro">{athleticsShowcase.intro}</p>
        </motion.div>

        <div className="he-athletics-grid">
          {athleticsShowcase.samples.map((sample, index) => (
            <motion.figure
              key={sample.id}
              className={`he-athletics-sample he-athletics-sample--${sample.kind === 'Portal' ? 'portal' : 'landing'}`}
              {...(reduce
                ? {}
                : {
                    initial: { opacity: 0, y: 30 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, amount: 0.18 },
                    transition: { duration: 0.72, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] as const },
                  })}
            >
              <div className="he-athletics-shot">
                <img src={sample.image} alt={sample.imageAlt} loading="lazy" decoding="async" />
              </div>
              <figcaption className="he-athletics-caption">
                <span className="he-athletics-kind">{sample.kind}</span>
                <span className="he-athletics-name">{sample.label}</span>
                <span className="he-athletics-theme">{sample.theme}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

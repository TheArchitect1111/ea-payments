'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { pulseReveal } from '@/lib/home-emotion';

export default function PulseReveal() {
  const reduce = useReducedMotion();
  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section className="he-pulse" id="pulse" aria-labelledby="pulse-title">
      <div className="he-pulse-inner">
        <motion.div className="he-pulse-head" {...rise}>
          <h2 id="pulse-title" className="he-pulse-headline">
            {pulseReveal.headline}
            <span className="he-pulse-accent">{pulseReveal.headlineAccent}</span>
          </h2>
          <p className="he-pulse-sub">{pulseReveal.subheadline}</p>
        </motion.div>

        <motion.div className="he-pulse-stage" {...rise}>
          <svg className="he-pulse-lines" viewBox="0 0 1200 600" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="he-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(201,168,68,0.35)" />
                <stop offset="50%" stopColor="rgba(201,168,68,0.65)" />
                <stop offset="100%" stopColor="rgba(201,168,68,0.35)" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((i) => (
              <path
                key={`l-${i}`}
                d={`M ${180 + i * 40} ${120 + i * 90} Q 400 300 600 300`}
                fill="none"
                stroke="url(#he-line-grad)"
                strokeWidth="1"
                opacity="0.5"
              />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <path
                key={`r-${i}`}
                d={`M ${1020 - i * 40} ${120 + i * 90} Q 800 300 600 300`}
                fill="none"
                stroke="url(#he-line-grad)"
                strokeWidth="1"
                opacity="0.5"
              />
            ))}
            <circle cx="600" cy="300" r="8" fill="rgba(201,168,68,0.8)" className="he-pulse-orb" />
          </svg>

          <ul className="he-pulse-orbit he-pulse-orbit--left" aria-label="Platform capabilities">
            {pulseReveal.leftFeatures.map((feat, i) => (
              <motion.li
                key={feat.label}
                className="he-orbit-node"
                style={{ ['--orbit-i' as string]: String(i) }}
                {...(reduce
                  ? {}
                  : {
                      initial: { opacity: 0, scale: 0.9 },
                      whileInView: { opacity: 1, scale: 1 },
                      viewport: { once: true },
                      transition: { duration: 0.45, delay: 0.2 + i * 0.1 },
                    })}
              >
                <span className="he-orbit-icon" aria-hidden="true">
                  {feat.icon}
                </span>
                <span className="he-orbit-label">{feat.label}</span>
              </motion.li>
            ))}
          </ul>

          <figure className="he-pulse-devices">
            <img
              src={pulseReveal.dashboardImage}
              alt={pulseReveal.dashboardAlt}
              loading="lazy"
              decoding="async"
            />
          </figure>

          <ul className="he-pulse-orbit he-pulse-orbit--right" aria-label="Platform capabilities">
            {pulseReveal.rightFeatures.map((feat, i) => (
              <motion.li
                key={feat.label}
                className="he-orbit-node"
                style={{ ['--orbit-i' as string]: String(i) }}
                {...(reduce
                  ? {}
                  : {
                      initial: { opacity: 0, scale: 0.9 },
                      whileInView: { opacity: 1, scale: 1 },
                      viewport: { once: true },
                      transition: { duration: 0.45, delay: 0.2 + i * 0.1 },
                    })}
              >
                <span className="he-orbit-icon" aria-hidden="true">
                  {feat.icon}
                </span>
                <span className="he-orbit-label">{feat.label}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Fraunces, Manrope } from 'next/font/google';
import type { CtpRevealView } from '@/lib/ctp-reveal';
import styles from './reveal.module.css';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '700'],
});

const sans = Manrope({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
});

type Props = { view: CtpRevealView };

const STAGES = ['open', 'impact', 'built', 'next'] as const;

export default function RevealExperience({ view }: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (stageIndex >= STAGES.length - 1) return;
    const timer = window.setTimeout(() => {
      setStageIndex((current) => Math.min(current + 1, STAGES.length - 1));
    }, stageIndex === 0 ? 2800 : 3400);
    return () => window.clearTimeout(timer);
  }, [stageIndex]);

  return (
    <main className={`${styles.reveal} ${sans.className}`}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.grain} aria-hidden />

      <section className={`${styles.stage} ${entered ? styles.stageIn : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/ea-logo.png" alt="Efficiency Architects" className={styles.logo} />

        <p className={styles.brand}>{view.brandName}</p>
        {view.trackLabel ? <p className={styles.track}>{view.trackLabel}</p> : null}

        <div className={`${styles.panel} ${styles.panelVisible}`}>
          <h1 className={`${styles.headline} ${display.className}`}>{view.headline}</h1>
          <p className={styles.lede}>{view.lede}</p>
          <div className={styles.shimmer} aria-hidden />
        </div>

        <div className={`${styles.panel} ${styles.metrics} ${stageIndex >= 1 ? styles.panelVisible : ''}`}>
          {view.metrics.map((metric) => (
            <div key={metric.label}>
              <p className={`${styles.metricValue} ${display.className}`}>{metric.value}</p>
              <p className={styles.metricLabel}>{metric.label}</p>
              {metric.detail ? <p className={styles.metricDetail}>{metric.detail}</p> : null}
            </div>
          ))}
        </div>

        <div className={`${styles.panel} ${stageIndex >= 2 ? styles.panelVisible : ''}`}>
          <p className={styles.sectionLabel}>What we built</p>
          {view.productionHeadline ? (
            <p className={styles.production}>{view.productionHeadline}</p>
          ) : null}
          <ul className={styles.list}>
            {view.deliverables.map((item, index) => (
              <li
                key={item}
                style={{ animationDelay: `${index * 120}ms` }}
                className={`${styles.listItem} ${stageIndex >= 2 ? styles.listItemVisible : ''}`}
              >
                <span className={styles.check} aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className={`${styles.panel} ${styles.cta} ${stageIndex >= 3 ? styles.panelVisible : ''}`}>
          <a className={`${styles.btn} ${styles.btnPrimary}`} href={view.portalPath}>
            Enter your portal
          </a>
          {view.siteUrl ? (
            <a className={styles.btn} href={view.siteUrl} target="_blank" rel="noreferrer">
              Open live website
            </a>
          ) : null}
          <a className={styles.btn} href={view.progressPath}>
            View progress
          </a>
          <a className={styles.btn} href={view.calendlyUrl} target="_blank" rel="noreferrer">
            Book strategy session
          </a>
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.continue}
            onClick={() => setStageIndex((current) => Math.min(current + 1, STAGES.length - 1))}
            disabled={stageIndex >= STAGES.length - 1}
          >
            {stageIndex >= STAGES.length - 1 ? 'Reveal complete' : 'Continue'}
          </button>
          <div className={styles.dots} aria-hidden>
            {STAGES.map((item, index) => (
              <span
                key={item}
                className={`${styles.dot} ${index <= stageIndex ? styles.dotOn : ''}`}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

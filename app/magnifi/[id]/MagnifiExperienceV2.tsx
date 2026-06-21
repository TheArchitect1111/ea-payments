'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import type { MagnifiCinematicExperience } from '@/lib/magnifi-experience-engine';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const CREAM = '#FAF8F3';

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 48 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

export default function MagnifiExperienceV2({ experience }: { experience: MagnifiCinematicExperience }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <main ref={containerRef} className="min-h-screen overflow-y-auto scroll-smooth" style={{ backgroundColor: NAVY }}>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 origin-left z-50"
        style={{ scaleX: progress, backgroundColor: GOLD }}
      />

      <section className="relative min-h-[100svh] flex items-end px-6 pb-16 pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1829] via-[#1B2B4D] to-[#243a66]" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#C9A844_0%,transparent_45%)]" />
        <div className="relative max-w-5xl mx-auto w-full">
          <motion.p {...fadeUp(0)} className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: GOLD }}>
            Magnifi&trade; Experience Engine V2
          </motion.p>
          <motion.p {...fadeUp(0.08)} className="mt-4 text-sm uppercase tracking-[0.25em] text-white/60">
            {experience.templateName}
          </motion.p>
          <motion.h1
            {...fadeUp(0.12)}
            className="mt-6 text-5xl sm:text-7xl font-black leading-[0.95] text-white max-w-4xl"
          >
            {experience.acts[0]?.headline}
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className="mt-8 text-xl sm:text-2xl leading-relaxed text-white/80 max-w-3xl">
            {experience.hook}
          </motion.p>
          <motion.div {...fadeUp(0.28)} className="mt-12 flex flex-wrap gap-6 text-sm text-white/70">
            {experience.scores.opportunity != null && (
              <span>Opportunity {experience.scores.opportunity}</span>
            )}
            {experience.scores.eaFit != null && <span>EA Fit {experience.scores.eaFit}</span>}
            {experience.scores.trust != null && <span>Trust {experience.scores.trust}</span>}
          </motion.div>
        </div>
      </section>

      {experience.acts.slice(1).map((act, index) => (
        <section
          key={act.id}
          className="min-h-[85svh] flex items-center px-6 py-20"
          style={{ backgroundColor: index % 2 === 0 ? CREAM : '#ffffff' }}
        >
          <motion.div {...fadeUp()} className="max-w-4xl mx-auto w-full">
            <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
              {act.label}
            </p>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold leading-tight" style={{ color: NAVY }}>
              {act.headline}
            </h2>
            <p className="mt-8 text-base sm:text-lg leading-8 text-neutral-600 whitespace-pre-wrap">{act.body}</p>
          </motion.div>
        </section>
      ))}

      <section className="px-6 py-24" style={{ backgroundColor: NAVY }}>
        <motion.div {...fadeUp()} className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            Twelve Months From Now™
          </p>
          <p className="mt-6 text-2xl sm:text-3xl leading-relaxed text-white/90">{experience.twelveMonths}</p>
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {experience.journey.map((step) => (
              <div key={step.stage} className="border border-white/10 p-6 backdrop-blur-sm bg-white/5">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                  {step.stage}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/75">{step.line}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="min-h-[70svh] flex items-center px-6 py-24" style={{ backgroundColor: CREAM }}>
        <motion.div {...fadeUp()} className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            Call To Action™
          </p>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black" style={{ color: NAVY }}>
            {experience.cta.headline}
          </h2>
          <p className="mt-6 text-lg text-neutral-600">{experience.cta.body}</p>
          <Link
            href={experience.cta.href}
            className="mt-10 inline-flex px-10 py-4 text-xs font-black uppercase tracking-[0.25em]"
            style={{ backgroundColor: NAVY, color: GOLD }}
          >
            {experience.cta.label}
          </Link>
          <p className="mt-8 text-xs text-neutral-400">
            <Link href={`/simplifi/guidance/${experience.captureId}`} className="underline" style={{ color: NAVY }}>
              Open Simplifi Guidance →
            </Link>
            {' · '}
            <Link href={`/magnifi/${experience.captureId}?classic=1`} className="underline" style={{ color: NAVY }}>
              Classic report view
            </Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
}

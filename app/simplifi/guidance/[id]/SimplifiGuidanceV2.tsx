'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { GuidanceExperience } from '@/lib/simplifi-guidance-engine';
import SimplifiGuidePanel from './SimplifiGuidePanel';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const CREAM = '#FAF8F3';

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

export default function SimplifiGuidanceV2({ experience }: { experience: GuidanceExperience }) {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <main className="min-h-screen" style={{ backgroundColor: CREAM }}>
      <section className="px-6 py-16" style={{ backgroundColor: NAVY }}>
        <div className="max-w-4xl mx-auto">
          <motion.p {...fadeUp()} className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: GOLD }}>
            Simplifi&trade; Guidance Engine V2
          </motion.p>
          <motion.h1 {...fadeUp(0.08)} className="mt-4 text-4xl sm:text-6xl font-black text-white leading-tight">
            {experience.assessmentName}
          </motion.h1>
          <motion.p {...fadeUp(0.14)} className="mt-6 text-xl leading-relaxed text-white/80">
            {experience.openingInsight}
          </motion.p>
          <motion.div {...fadeUp(0.2)} className="mt-8 flex flex-wrap gap-3">
            {experience.sections.map((section, index) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(index)}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border"
                style={{
                  borderColor: activeSection === index ? GOLD : 'rgba(255,255,255,0.2)',
                  color: activeSection === index ? NAVY : 'white',
                  backgroundColor: activeSection === index ? GOLD : 'transparent',
                }}
              >
                {index + 1}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {experience.sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          className="px-6 py-20 border-b border-neutral-200/80"
          style={{ backgroundColor: index % 2 === 0 ? '#fff' : CREAM }}
        >
          <motion.div {...fadeUp()} className="max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
              {section.label}
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold" style={{ color: NAVY }}>
              {section.headline}
            </h2>
            <p className="mt-6 text-base leading-8 text-neutral-600 whitespace-pre-wrap">{section.body}</p>
            {section.items && (
              <ul className="mt-8 space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-neutral-700">
                    <span style={{ color: GOLD }}>→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            {section.id === 'opportunity' && (
              <div className="mt-8 grid sm:grid-cols-3 gap-4">
                {[
                  { label: 'Time', value: experience.opportunity.timeRecovery },
                  { label: 'Revenue', value: experience.opportunity.revenue },
                  { label: 'Engagement', value: experience.opportunity.engagement },
                ].map((metric) => (
                  <div key={metric.label} className="p-5 border-t-4" style={{ borderColor: GOLD, backgroundColor: CREAM }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{metric.label}</p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: NAVY }}>
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {section.id === 'priorities' && (
              <div className="mt-8 space-y-4">
                {experience.priorities.map((p) => (
                  <div key={p.rank} className="p-5 border border-neutral-200">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                      Priority #{p.rank}{p.product ? ` · ${p.product}` : ''}
                    </p>
                    <p className="mt-2 text-lg font-bold" style={{ color: NAVY }}>
                      {p.title}
                    </p>
                    <p className="mt-2 text-sm text-neutral-600">{p.detail}</p>
                  </div>
                ))}
              </div>
            )}
            {section.id === 'progress-path' && (
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                {experience.progressPath.map((step, i) => (
                  <div key={step.stage} className="flex-1 p-5" style={{ backgroundColor: CREAM }}>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                      {i + 1}
                    </p>
                    <p className="mt-2 font-bold" style={{ color: NAVY }}>
                      {step.stage}
                    </p>
                    <p className="mt-2 text-sm text-neutral-600">{step.description}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </section>
      ))}

      <section className="px-6 py-20 text-center" style={{ backgroundColor: NAVY }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            Your First Step™
          </p>
          <p className="mt-4 text-xl text-white/90">{experience.firstStep.action}</p>
          <a
            href={experience.firstStep.href}
            className="mt-8 inline-flex px-10 py-4 text-xs font-black uppercase tracking-[0.25em]"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            {experience.firstStep.cta}
          </a>
          <p className="mt-8 text-xs text-white/50">
            <Link href={`/magnifi/${experience.captureId}`} className="underline text-white/70">
              View Magnifi cinematic experience →
            </Link>
          </p>
        </div>
      </section>

      <SimplifiGuidePanel prompts={experience.guidePrompts} />
    </main>
  );
}

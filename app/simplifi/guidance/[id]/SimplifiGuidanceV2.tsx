'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { GuidanceExperience } from '@/lib/simplifi-guidance-engine';
import SimplifiGuidePanel from './SimplifiGuidePanel';

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

export default function SimplifiGuidanceV2({ experience }: { experience: GuidanceExperience }) {
  const { theme } = experience;
  const [activeSection, setActiveSection] = useState(0);

  return (
    <main className="min-h-screen" style={{ backgroundColor: theme.cream }}>
      <section
        className="px-6 py-16"
        style={{
          background: `linear-gradient(135deg, ${theme.heroFrom}, ${theme.heroVia}, ${theme.heroTo})`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.p {...fadeUp()} className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: theme.gold }}>
            Simplifi&trade; Guidance · Phase 2
          </motion.p>
          <motion.p {...fadeUp(0.05)} className="mt-2 text-sm text-white/60">
            Paired with {experience.magnifiTemplateName}
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
                onClick={() => {
                  setActiveSection(index);
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border"
                style={{
                  borderColor: activeSection === index ? theme.gold : 'rgba(255,255,255,0.2)',
                  color: activeSection === index ? theme.navy : 'white',
                  backgroundColor: activeSection === index ? theme.gold : 'transparent',
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
          style={{ backgroundColor: index % 2 === 0 ? '#fff' : theme.cream }}
        >
          <motion.div {...fadeUp()} className="max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: theme.accent }}>
              {section.label}
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold" style={{ color: theme.navy }}>
              {section.headline}
            </h2>
            <p className="mt-6 text-base leading-8 text-neutral-600 whitespace-pre-wrap">{section.body}</p>
            {section.items && (
              <ul className="mt-8 space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-neutral-700">
                    <span style={{ color: theme.accent }}>→</span>
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
                  <div
                    key={metric.label}
                    className="p-5 border-t-4"
                    style={{ borderColor: theme.accent, backgroundColor: theme.cream }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{metric.label}</p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: theme.navy }}>
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
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.accent }}>
                      Priority #{p.rank}{p.product ? ` · ${p.product}` : ''}
                    </p>
                    <p className="mt-2 text-lg font-bold" style={{ color: theme.navy }}>
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
                  <div key={step.stage} className="flex-1 p-5" style={{ backgroundColor: theme.cream }}>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.accent }}>
                      {i + 1}
                    </p>
                    <p className="mt-2 font-bold" style={{ color: theme.navy }}>
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

      <section className="px-6 py-20 text-center" style={{ backgroundColor: theme.navy }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: theme.gold }}>
            Your First Step™
          </p>
          <p className="mt-4 text-xl text-white/90">{experience.firstStep.action}</p>
          <a
            href={experience.firstStep.href}
            className="mt-8 inline-flex px-10 py-4 text-xs font-black uppercase tracking-[0.25em]"
            style={{ backgroundColor: theme.gold, color: theme.navy }}
          >
            {experience.firstStep.cta}
          </a>
          <p className="mt-8 text-xs text-white/50">
            <Link href={`/magnifi/${experience.captureId}`} className="underline text-white/70">
              View Magnifi cinematic experience →
            </Link>
            {' · '}
            <Link href="/experience/templates" className="underline text-white/70">
              All templates
            </Link>
          </p>
        </div>
      </section>

      <SimplifiGuidePanel prompts={experience.guidePrompts} theme={theme} />
    </main>
  );
}

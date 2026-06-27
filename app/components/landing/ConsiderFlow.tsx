'use client';

import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { considerContent, type ConsiderPath } from '@/lib/home-emotion';

type Step = 'choose' | 'reflect' | 'next';

export default function ConsiderFlow() {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<ConsiderPath | null>(null);
  const [step, setStep] = useState<Step>('choose');
  const [reflection, setReflection] = useState('');

  const pickPath = useCallback((path: ConsiderPath) => {
    setSelected(path);
    setReflection('');
    setStep('reflect');
    document.getElementById('consider-conversation')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const reset = useCallback(() => {
    setSelected(null);
    setStep('choose');
    setReflection('');
  }, []);

  return (
    <section className="he-consider" id="consider" aria-labelledby="consider-title">
      <div className="he-consider-inner">
        <div className="he-consider-intro">
          <h2 id="consider-title" className="he-consider-headline">
            {considerContent.headline}
          </h2>
          <p className="he-consider-question">{considerContent.question}</p>
        </div>

        <div className="he-consider-grid" role="list">
          {considerContent.paths.map((path) => (
            <button
              type="button"
              key={path.id}
              className={`he-path-card${selected?.id === path.id ? ' is-active' : ''}`}
              onClick={() => pickPath(path)}
              aria-pressed={selected?.id === path.id}
              role="listitem"
            >
              <span className="he-path-visual">
                <img src={path.image} alt="" loading="lazy" decoding="async" />
                <span className="he-path-icon" aria-hidden="true">
                  {path.icon}
                </span>
              </span>
              <span className="he-path-label">{path.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selected && step !== 'choose' ? (
            <motion.div
              id="consider-conversation"
              key={selected.id + step}
              className="he-conversation"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              role="region"
              aria-label="Guided conversation"
            >
              <p className="he-convo-opener">{selected.opener}</p>

              {step === 'reflect' ? (
                <>
                  <p className="he-convo-prompt">Which of these resonates most?</p>
                  <ul className="he-convo-chips">
                    {selected.prompts.map((prompt) => (
                      <li key={prompt}>
                        <button
                          type="button"
                          className={`he-convo-chip${reflection === prompt ? ' is-selected' : ''}`}
                          onClick={() => {
                            setReflection(prompt);
                            setStep('next');
                          }}
                        >
                          {prompt}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="he-convo-back" onClick={reset}>
                    Choose a different path
                  </button>
                </>
              ) : null}

              {step === 'next' ? (
                <>
                  <blockquote className="he-convo-reflection">
                    &ldquo;{reflection}&rdquo;
                  </blockquote>
                  <p className="he-convo-bridge">
                    That is exactly the kind of freedom custom systems create. Let&apos;s explore what
                    becomes possible for you.
                  </p>
                  <div className="he-convo-actions">
                    <Link
                      href={`/contact?interest=${encodeURIComponent(selected.id)}&focus=${encodeURIComponent(reflection)}`}
                      className="he-cta-solid"
                    >
                      Start the Conversation
                    </Link>
                    <Link href="/possibilities" className="he-cta-ghost-dark">
                      Explore the Experiences
                    </Link>
                  </div>
                  <button type="button" className="he-convo-back" onClick={() => setStep('reflect')}>
                    Go back
                  </button>
                </>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

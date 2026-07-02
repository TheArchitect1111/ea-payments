'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { considerContent, type CoachVisionOption } from '@/lib/home-emotion';

type VisionGroupProps = {
  label: string;
  options: readonly CoachVisionOption[];
  selected?: CoachVisionOption;
  onSelect: (option: CoachVisionOption) => void;
};

function VisionGroup({ label, options, selected, onSelect }: VisionGroupProps) {
  return (
    <div className="he-vision-group">
      <p className="he-convo-prompt">{label}</p>
      <div className="he-convo-chips" role="list">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`he-convo-chip${selected?.id === option.id ? ' is-selected' : ''}`}
            onClick={() => onSelect(option)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ConsiderFlow() {
  const reduce = useReducedMotion();
  const [sport, setSport] = useState<CoachVisionOption | undefined>();
  const [organization, setOrganization] = useState<CoachVisionOption | undefined>();
  const [athletes, setAthletes] = useState<CoachVisionOption | undefined>();

  const isComplete = Boolean(sport && organization && athletes);
  const vision = useMemo(() => {
    if (!sport || !organization || !athletes) return null;

    return {
      title: `${sport.label} ${organization.label}`,
      href: `/contact?sport=${encodeURIComponent(sport.label)}&organization=${encodeURIComponent(organization.label)}&athletes=${encodeURIComponent(athletes.label)}`,
      landing:
        `A public home for your ${sport.label.toLowerCase()} program with programs, teams, camps, coach bios, events, recruiting pathways, and registration in one polished experience.`,
      portal:
        `A private portal for ${athletes.label.toLowerCase()} where coaches, parents, athletes, staff, and volunteers each see the schedules, messages, documents, payments, and resources they need.`,
      dashboard:
        'A coach dashboard that makes the next practice, the next parent question, and the next operational decision visible without pulling you away from your athletes.',
    };
  }, [sport, organization, athletes]);

  return (
    <section className="he-consider" id="consider" aria-labelledby="consider-title">
      <div className="he-consider-inner">
        <div className="he-consider-intro">
          <h2 id="consider-title" className="he-consider-headline">
            {considerContent.headline}
          </h2>
          <p className="he-consider-question">{considerContent.question}</p>
        </div>

        <motion.div
          className="he-conversation he-vision-builder"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <VisionGroup
            label="What sport do you serve?"
            options={considerContent.sports}
            selected={sport}
            onSelect={setSport}
          />
          <VisionGroup
            label="What type of organization do you lead?"
            options={considerContent.organizations}
            selected={organization}
            onSelect={setOrganization}
          />
          <VisionGroup
            label="Approximately how many athletes do you support?"
            options={considerContent.athletes}
            selected={athletes}
            onSelect={setAthletes}
          />
        </motion.div>

        {isComplete && vision ? (
          <motion.div
            className="he-conversation he-vision-result"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            role="region"
            aria-label="Personalized organization vision"
          >
            <p className="he-convo-opener">{vision.title}</p>
            <div className="he-vision-panes">
              <article>
                <span>Landing Page</span>
                <p>{vision.landing}</p>
              </article>
              <article>
                <span>Portal</span>
                <p>{vision.portal}</p>
              </article>
              <article>
                <span>Coach Dashboard</span>
                <p>{vision.dashboard}</p>
              </article>
            </div>
            <div className="he-convo-actions">
              <Link
                href={vision.href}
                className="he-cta-solid"
              >
                Design My Organization
              </Link>
            </div>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}

import type { CaptureRecord } from './capture-records';
import { rebuildCaptureContext } from './capture-experience';
import { getMagnifiTemplate, getSimplifiAssessment } from './ea-template-registry';
import type { ExperienceTheme } from './ea-template-registry';

export type { ExperienceTheme };

export interface MagnifiAct {
  id: string;
  label: string;
  headline: string;
  body: string;
  accent?: string;
}

export interface MagnifiCinematicExperience {
  captureId: string;
  title: string;
  templateId: string;
  templateName: string;
  theme: ExperienceTheme;
  hook: string;
  acts: MagnifiAct[];
  journey: { stage: string; line: string }[];
  twelveMonths: string;
  cta: { headline: string; body: string; href: string; label: string };
  scores: { opportunity?: number; eaFit?: number; trust?: number };
}

export function buildMagnifiExperience(capture: CaptureRecord): MagnifiCinematicExperience {
  const ctx = rebuildCaptureContext(capture);
  const def = getMagnifiTemplate(ctx.templateId);
  const hook = def.cinematicHook(ctx.orgName);

  const hidden =
    ctx.sections.find((s) => /hidden/i.test(s.title))?.content ||
    ctx.templateReason ||
    'Important signals exist today — but they are scattered across tools, inboxes, and memory.';

  const future =
    ctx.sections.find((s) => /future/i.test(s.title))?.content ||
    def.journey.map((stage, i) => `${stage}: ${ctx.roadmap[i]?.focus ?? 'Build visible momentum'}`).join('\n');

  const possibility =
    ctx.sections.find((s) => /possibilit/i.test(s.title))?.content ||
    `Opportunity ${ctx.scores.opportunity ?? 'pending'}/100 · EA Fit ${ctx.scores.eaFit ?? 'pending'}/100 · Template: ${def.name}`;

  const priorities =
    ctx.sections.find((s) => /priorit/i.test(s.title))?.content ||
    ctx.priorities.map((p) => `#${p.rank} ${p.title}`).join('\n');

  const firstStep =
    ctx.sections.find((s) => /first step/i.test(s.title))?.content ||
    ctx.firstStep ||
    'Choose one move that creates visible progress in the next seven days.';

  const acts: MagnifiAct[] = [
    {
      id: 'opening-reveal',
      label: 'Opening Reveal™',
      headline: ctx.orgName,
      body: hook,
      accent: def.name,
    },
    {
      id: 'hidden-opportunity',
      label: 'Hidden Opportunity™',
      headline: 'What exists today — and what is being overlooked',
      body: hidden,
    },
    {
      id: 'future-state',
      label: 'Future-State Reveal™',
      headline: def.journey.join(' → '),
      body: future,
    },
    {
      id: 'possibility',
      label: 'Possibility Engine™',
      headline: 'Pathways forward',
      body: possibility,
    },
    {
      id: 'mission-control',
      label: 'Mission Control Reveal™',
      headline: 'One place to see progress',
      body: def.missionControlLine,
    },
    {
      id: 'priorities',
      label: 'Your Top Three Priorities™',
      headline: 'Focus creates velocity',
      body: priorities,
    },
    {
      id: 'first-step',
      label: 'Call To Action™',
      headline: 'Your first move',
      body: firstStep,
    },
  ];

  const journey = def.journey.map((stage, i) => ({
    stage,
    line: ctx.roadmap[i]?.focus ?? `Advance ${stage.toLowerCase()} with one visible win.`,
  }));

  return {
    captureId: capture.id,
    title: capture.title,
    templateId: ctx.templateId,
    templateName: def.name,
    theme: ctx.theme,
    hook,
    acts,
    journey,
    twelveMonths: def.twelveMonths(ctx.orgName),
    cta: {
      headline: 'You can see it. You can begin.',
      body:
        ctx.firstStep ||
        `Start with ${getSimplifiAssessment(def.pairedSimplifiAssessment).name} and review your Magnifi experience.`,
      href: def.ctaHref,
      label: def.ctaLabel,
    },
    scores: ctx.scores,
  };
}

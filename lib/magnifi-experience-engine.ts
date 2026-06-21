import type { CaptureRecord } from './capture-records';
import { rebuildCaptureContext, inferIndustryTone } from './capture-experience';

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
  templateName: string;
  hook: string;
  acts: MagnifiAct[];
  journey: { stage: string; line: string }[];
  twelveMonths: string;
  cta: { headline: string; body: string; href: string; label: string };
  scores: { opportunity?: number; eaFit?: number; trust?: number };
}

const OPENING_HOOKS: Record<string, string> = {
  campus: 'A future your alumni can see — before they ever write a check.',
  faith: 'A mission that moves people — not just meetings that fill calendars.',
  athletics: 'Potential is visible. The path to opportunity should be too.',
  community: 'Legacy is not history. It is momentum waiting for a system.',
  business: 'You have built something real. The next chapter should feel inevitable.',
};

export function buildMagnifiExperience(capture: CaptureRecord): MagnifiCinematicExperience {
  const ctx = rebuildCaptureContext(capture);
  const tone = inferIndustryTone(capture);
  const hook = OPENING_HOOKS[tone] ?? OPENING_HOOKS.business;

  const hidden =
    ctx.sections.find((s) => /hidden/i.test(s.title))?.content ||
    ctx.templateReason ||
    'Important signals exist today — but they are scattered across tools, inboxes, and memory.';

  const future =
    ctx.sections.find((s) => /future/i.test(s.title))?.content ||
    ctx.journey.map((stage, i) => `${stage}: ${ctx.roadmap[i]?.focus ?? 'Build visible momentum'}`).join('\n');

  const possibility =
    ctx.sections.find((s) => /possibilit/i.test(s.title))?.content ||
    `Opportunity score ${ctx.scores.opportunity ?? 'pending'}/100 · EA Fit ${ctx.scores.eaFit ?? 'pending'}/100`;

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
      accent: ctx.templateName,
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
      headline: 'The future you can build',
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
      body:
        'Mission Control tracks captures, priorities, and adoption — so stakeholders see momentum, not mystery.',
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

  const journey = ctx.journey.map((stage, i) => ({
    stage,
    line: ctx.roadmap[i]?.focus ?? `Advance ${stage.toLowerCase()} with one visible win.`,
  }));

  const twelveMonths = `Twelve months from now, ${ctx.orgName} could be operating with clearer priorities, visible progress in Pulse, and a shareable story that builds buy-in before the next investment.`;

  return {
    captureId: capture.id,
    title: capture.title,
    templateName: ctx.templateName,
    hook,
    acts,
    journey,
    twelveMonths,
    cta: {
      headline: 'You can see it. You can begin.',
      body: ctx.firstStep || 'Start with one Simplifi capture and review your Magnifi experience with your advisor.',
      href: '/assessment',
      label: 'Take The Assessment',
    },
    scores: ctx.scores,
  };
}

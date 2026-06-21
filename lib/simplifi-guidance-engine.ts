import type { CaptureRecord } from './capture-records';
import { rebuildCaptureContext, inferIndustryTone } from './capture-experience';

export interface GuidanceSection {
  id: string;
  label: string;
  headline: string;
  body: string;
  items?: string[];
}

export interface GuidanceExperience {
  captureId: string;
  title: string;
  assessmentName: string;
  openingInsight: string;
  sections: GuidanceSection[];
  priorities: { rank: number; title: string; detail: string; product?: string }[];
  firstStep: { action: string; cta: string; href: string };
  roadmap: { phase: string; focus: string }[];
  progressPath: { stage: string; description: string }[];
  opportunity: {
    timeRecovery?: string;
    revenue?: string;
    engagement?: string;
  };
  guidePrompts: { question: string; answer: string }[];
}

const OPENING_INSIGHTS: Record<string, string> = {
  campus: 'Your community is communicating — but the people who matter most are not always reached at the moment they are ready to act.',
  faith: 'Your mission is clear — but the rhythm of engagement does not always match the urgency of the work.',
  athletics: 'Talent is visible on the field — but the systems around development and exposure may not be keeping pace.',
  community: 'Your organization has legacy — but daily activity is not always creating forward momentum for every member.',
  business: 'Your website is working harder to explain itself than it is to attract the right next conversation.',
};

const CONSEQUENCE_SETS: Record<string, string[]> = {
  business: ['Lost leads', 'Lost time', 'Lost revenue', 'Lost capacity'],
  community: ['Lost participation', 'Lost engagement', 'Lost connection', 'Lost momentum'],
  campus: ['Lost alumni engagement', 'Lost participation', 'Lost donor readiness', 'Lost visibility'],
  athletics: ['Lost exposure', 'Lost opportunity', 'Lost follow-through', 'Lost visibility'],
  faith: ['Lost engagement', 'Lost connection', 'Lost participation', 'Lost growth'],
};

const FUTURE_STATE: Record<string, string[]> = {
  business: ['Better website clarity', 'Better lead capture', 'Better operations', 'Better visibility'],
  community: ['Better communication', 'Better engagement', 'Better member experience', 'Better visibility'],
  campus: ['Better alumni journey', 'Better communication', 'Better engagement', 'Better advancement rhythm'],
  athletics: ['Better recruiting visibility', 'Better development tracking', 'Better exposure', 'Better follow-up'],
  faith: ['Better engagement rhythm', 'Better communication', 'Better connection', 'Better growth systems'],
};

export function buildGuidanceExperience(capture: CaptureRecord): GuidanceExperience {
  const ctx = rebuildCaptureContext(capture);
  const tone = inferIndustryTone(capture);
  const assessmentName =
    capture.blueprintTemplate?.includes('Assessment')
      ? capture.blueprintTemplate
      : `${ctx.templateName.replace('™', '')} Guidance`;

  const opening =
    OPENING_INSIGHTS[tone] ??
    `${ctx.orgName} is active — but important opportunities may not be consistently turning into forward momentum.`;

  const foundItems = [
    ctx.sections.find((s) => /hidden/i.test(s.title))?.content?.split('\n')[0],
    ctx.templateReason,
    capture.category ? `Category: ${capture.category}` : undefined,
    capture.sourceUrl ? `Source reviewed: ${capture.sourceUrl}` : undefined,
  ].filter(Boolean) as string[];

  const strengths = [
    ctx.scores.eaFit != null ? `EA Fit ${ctx.scores.eaFit}/100 — strong alignment potential` : undefined,
    ctx.scores.trust != null ? `Trust confidence ${ctx.scores.trust}/100` : undefined,
    'Existing digital presence to build on',
  ].filter(Boolean) as string[];

  const priorities =
    ctx.priorities.length >= 1
      ? ctx.priorities.slice(0, 3).map((p) => ({
          rank: p.rank,
          title: p.title,
          detail: p.rationale || p.title,
          product: p.product,
        }))
      : [
          { rank: 1, title: 'Clarify the highest-leverage constraint', detail: 'Name the one bottleneck stealing the most capacity.', product: 'Simplifi' },
          { rank: 2, title: 'Make progress visible', detail: 'Track wins in Pulse so stakeholders see momentum.', product: 'Pulse' },
          { rank: 3, title: 'Share the future-state story', detail: 'Use Magnifi to build buy-in before the next investment.', product: 'Magnifi' },
        ];

  const sections: GuidanceSection[] = [
    {
      id: 'opening-insight',
      label: 'Opening Insight™',
      headline: 'Start here',
      body: opening,
    },
    {
      id: 'what-we-found',
      label: 'What We Found™',
      headline: 'Patterns worth your attention',
      body: 'Simplifi surfaced signals — not a scorecard.',
      items: foundItems.length ? foundItems : ['Opportunity signals detected', 'Alignment patterns identified', 'Growth friction visible'],
    },
    {
      id: 'why-it-matters',
      label: 'Why This Matters™',
      headline: 'Impact, not jargon',
      body: 'When systems leak, the cost shows up as:',
      items: CONSEQUENCE_SETS[tone] ?? CONSEQUENCE_SETS.business,
    },
    {
      id: 'what-good-looks-like',
      label: 'What Good Looks Like™',
      headline: 'The future state',
      body: 'Imagine:',
      items: FUTURE_STATE[tone] ?? FUTURE_STATE.business,
    },
    {
      id: 'opportunity',
      label: 'Opportunity Snapshot™',
      headline: 'What becomes possible',
      body: 'Conservative opportunity indicators from this capture.',
    },
    {
      id: 'priorities',
      label: 'Your Top Three Priorities™',
      headline: 'Three moves — not twenty',
      body: priorities.map((p) => `#${p.rank} ${p.title}`).join('\n'),
    },
    {
      id: 'first-step',
      label: 'Your First Step™',
      headline: 'One decision. One move.',
      body: ctx.firstStep || priorities[0]?.detail || 'Schedule a review of this guidance with your advisor.',
    },
    {
      id: 'roadmap',
      label: 'Guided Roadmap™',
      headline: '30 · 60 · 90 days',
      body: ctx.roadmap.map((r) => `${r.phase}: ${r.focus}`).join('\n'),
    },
    {
      id: 'progress-path',
      label: 'Progress Path™',
      headline: 'Where you are headed',
      body: 'Current State → Improved State → Optimized State',
    },
  ];

  const progressPath = [
    { stage: 'Current State', description: 'Opportunity captured and scored — clarity begins.' },
    { stage: 'Improved State', description: 'Top priorities in motion — progress visible in Pulse.' },
    { stage: 'Optimized State', description: 'Systems, story, and adoption aligned in Mission Control.' },
  ];

  const oppScore = ctx.scores.opportunity ?? 0;
  const weeklyHours = Math.max(2, Math.round(oppScore / 12));

  return {
    captureId: capture.id,
    title: capture.title,
    assessmentName,
    openingInsight: opening,
    sections,
    priorities,
    firstStep: {
      action: ctx.firstStep || priorities[0]?.detail || 'Review priorities with your advisor.',
      cta: ctx.firstStepCta || 'Take The First Step',
      href: capture.sourceUrl || '/portal/login',
    },
    roadmap: ctx.roadmap,
    progressPath,
    opportunity: {
      timeRecovery: `${weeklyHours}–${weeklyHours + 4} hrs/week potential recovery`,
      revenue: oppScore >= 60 ? 'Meaningful revenue or funding upside likely' : 'Early-stage upside — validate with advisor',
      engagement: oppScore >= 50 ? 'Engagement lift possible within 90 days' : 'Focus on clarity before scale',
    },
    guidePrompts: [
      { question: 'What should I do next?', answer: priorities[0] ? `#${priorities[0].rank}: ${priorities[0].title}` : ctx.firstStep || 'Start with Priority #1.' },
      { question: 'Why does this matter?', answer: (CONSEQUENCE_SETS[tone] ?? CONSEQUENCE_SETS.business).join(', ') + '.' },
      { question: 'What does good look like?', answer: (FUTURE_STATE[tone] ?? FUTURE_STATE.business).join(' · ') + '.' },
      { question: 'What are my top priorities?', answer: priorities.map((p) => `#${p.rank} ${p.title}`).join(' · ') },
    ],
  };
}

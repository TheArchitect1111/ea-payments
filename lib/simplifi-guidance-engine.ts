import type { CaptureRecord } from './capture-records';
import { rebuildCaptureContext } from './capture-experience';
import { getSimplifiAssessment } from './ea-template-registry';
import type { ExperienceTheme, SimplifiAssessmentId } from './ea-template-registry';

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
  assessmentId: SimplifiAssessmentId;
  assessmentName: string;
  magnifiTemplateName: string;
  theme: ExperienceTheme;
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

export function buildGuidanceExperience(capture: CaptureRecord): GuidanceExperience {
  const ctx = rebuildCaptureContext(capture);
  const assessment = getSimplifiAssessment(ctx.simplifiAssessmentId);
  const opening = assessment.openingInsight(ctx.orgName);

  const foundItems = [
    ...assessment.strengths,
    ctx.sections.find((s) => /hidden/i.test(s.title))?.content?.split('\n')[0],
    ctx.templateReason,
    capture.category ? `Category: ${capture.category}` : undefined,
    capture.sourceUrl ? `Source: ${capture.sourceUrl}` : undefined,
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
          { rank: 1, title: assessment.futureState[0] ?? 'Clarify priority #1', detail: assessment.scope, product: 'Simplifi' },
          { rank: 2, title: assessment.futureState[1] ?? 'Make progress visible', detail: 'Track wins in Pulse.', product: 'Pulse' },
          { rank: 3, title: assessment.futureState[2] ?? 'Share the future story', detail: 'Use Magnifi for buy-in.', product: 'Magnifi' },
        ];

  const sections: GuidanceSection[] = [
    { id: 'opening-insight', label: 'Opening Insight™', headline: 'Start here', body: opening },
    {
      id: 'what-we-found',
      label: 'What We Found™',
      headline: 'Patterns worth your attention',
      body: `${assessment.name} — ${assessment.scope}`,
      items: foundItems.slice(0, 6),
    },
    {
      id: 'why-it-matters',
      label: 'Why This Matters™',
      headline: 'Impact, not jargon',
      body: 'When systems leak, the cost shows up as:',
      items: assessment.consequences,
    },
    {
      id: 'what-good-looks-like',
      label: 'What Good Looks Like™',
      headline: 'The future state',
      body: 'Imagine:',
      items: assessment.futureState,
    },
    {
      id: 'opportunity',
      label: 'Opportunity Snapshot™',
      headline: 'What becomes possible',
      body: 'Conservative indicators from this capture.',
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
      body: ctx.firstStep || priorities[0]?.detail || 'Review this guidance with your advisor.',
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
      headline: assessment.progressPath.map((p) => p.stage).join(' → '),
      body: 'Recognition → Understanding → Consequences → Opportunity → Prioritization → Action → Progress',
    },
  ];

  const oppScore = ctx.scores.opportunity ?? 0;
  const weeklyHours = Math.max(2, Math.round(oppScore / 12));

  return {
    captureId: capture.id,
    title: capture.title,
    assessmentId: ctx.simplifiAssessmentId,
    assessmentName: assessment.name,
    magnifiTemplateName: ctx.templateName,
    theme: ctx.theme,
    openingInsight: opening,
    sections,
    priorities,
    firstStep: {
      action: ctx.firstStep || priorities[0]?.detail || 'Review priorities with your advisor.',
      cta: 'Take The First Step',
      href: capture.sourceUrl || '/portal/login',
    },
    roadmap: ctx.roadmap,
    progressPath: assessment.progressPath,
    opportunity: {
      timeRecovery: `${weeklyHours}–${weeklyHours + 4} hrs/week potential recovery`,
      revenue: oppScore >= 60 ? 'Meaningful revenue or funding upside likely' : 'Validate upside with advisor',
      engagement: oppScore >= 50 ? 'Engagement lift possible within 90 days' : 'Build clarity before scale',
    },
    guidePrompts: [
      {
        question: 'What should I do next?',
        answer: priorities[0] ? `#${priorities[0].rank}: ${priorities[0].title}` : ctx.firstStep || 'Start with Priority #1.',
      },
      { question: 'Why does this matter?', answer: assessment.consequences.join(', ') + '.' },
      { question: 'What does good look like?', answer: assessment.futureState.join(' · ') + '.' },
      { question: 'What are my top priorities?', answer: priorities.map((p) => `#${p.rank} ${p.title}`).join(' · ') },
      { question: 'Which Magnifi template fits?', answer: `Paired with ${ctx.templateName} for your future-state story.` },
    ],
  };
}

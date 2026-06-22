import type { CaptureRecord } from './capture-records';
import { buildGuidanceExperience } from './simplifi-guidance-engine';

export interface GuidanceTriple {
  whyThisMatters: string;
  whatMostPeopleDo: string;
  whatWeRecommend: string;
  nextAction: string;
  suggestedDueDate: string;
}

export function buildGuidanceTriple(capture: CaptureRecord): GuidanceTriple {
  const guidance = buildGuidanceExperience(capture);
  const priority = guidance.priorities[0];
  const whySection = guidance.sections.find((s) => s.id === 'why-it-matters');
  const whyItems = whySection?.items?.join(' ') ?? guidance.openingInsight;

  const due = new Date();
  due.setDate(due.getDate() + (capture.priority === 'High' ? 3 : 7));

  return {
    whyThisMatters:
      capture.analysisSummary?.slice(0, 280) ||
      whyItems ||
      `${capture.title} — patterns worth your attention.`,
    whatMostPeopleDo:
      'Save the link, forget about it, or react without a clear next step.',
    whatWeRecommend:
      priority?.detail ||
      guidance.firstStep.action ||
      'Review priorities and take the first guided step.',
    nextAction: priority?.title || guidance.firstStep.action || 'Review this capture',
    suggestedDueDate: due.toISOString().slice(0, 10),
  };
}

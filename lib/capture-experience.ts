import type { CaptureRecord } from './capture-records';
import { parseBlueprintSummary } from './blueprint-summary';
import {
  type MagnifiTemplateId,
  type SimplifiAssessmentId,
  type ExperienceTheme,
  getMagnifiTemplate,
  resolveMagnifiTemplateId,
  resolveSimplifiAssessmentId,
} from './ea-template-registry';

export type { MagnifiTemplateId, SimplifiAssessmentId, ExperienceTheme };

export interface ParsedPriority {
  rank: number;
  title: string;
  product?: string;
  rationale?: string;
}

export interface RebuiltCaptureContext {
  orgName: string;
  templateId: MagnifiTemplateId;
  simplifiAssessmentId: SimplifiAssessmentId;
  theme: ExperienceTheme;
  templateName: string;
  templateReason?: string;
  journey: string[];
  priorities: ParsedPriority[];
  firstStep?: string;
  firstStepCta?: string;
  sections: { id: string; title: string; content: string }[];
  roadmap: { phase: string; focus: string }[];
  scores: {
    eaFit?: number;
    opportunity?: number;
    trust?: number;
  };
}

function titleFromCapture(capture: CaptureRecord): string {
  return capture.title.split(/[|\-–—]/)[0]?.trim() || capture.title || 'Your Organization';
}

function parsePrioritiesFromSummary(summary?: string): ParsedPriority[] {
  if (!summary) return [];
  const lines = summary.split('\n');
  const priorities: ParsedPriority[] = [];
  for (const line of lines) {
    const match = line.match(/^#(\d)\s+(.+?)(?:\s+\(([^)]+)\))?(?:\s+—|$)/);
    if (match) {
      priorities.push({
        rank: Number(match[1]),
        title: match[2].trim(),
        product: match[3]?.trim(),
        rationale: line.slice(match[0].length).trim() || undefined,
      });
    }
  }
  return priorities.sort((a, b) => a.rank - b.rank);
}

function parseJourney(summary?: string): string[] {
  if (!summary) return [];
  const line = summary.split('\n').find((l) => l.startsWith('Journey:'));
  if (!line) return [];
  return line
    .replace('Journey:', '')
    .split('→')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseTemplateName(summary?: string): string {
  if (!summary) return 'Executive Transformation™';
  const line = summary.split('\n').find((l) => l.startsWith('Template:'));
  if (!line) return 'Executive Transformation™';
  return line.replace('Template:', '').trim().split('(')[0]?.trim() || 'Executive Transformation™';
}

function parseFirstStep(summary?: string): { action?: string; cta?: string } {
  if (!summary) return {};
  const line = summary.split('\n').find((l) => l.startsWith('First step:'));
  if (!line) return {};
  return { action: line.replace('First step:', '').trim() };
}

function sectionByKeyword(
  sections: { title: string; content: string }[],
  keywords: string[],
): string | undefined {
  const hit = sections.find((s) =>
    keywords.some((k) => s.title.toLowerCase().includes(k.toLowerCase())),
  );
  return hit?.content;
}

export function rebuildCaptureContext(capture: CaptureRecord): RebuiltCaptureContext {
  const parsed = parseBlueprintSummary(capture.blueprintSummary || capture.analysisSummary);
  const orgName = titleFromCapture(capture);
  const recSummary = capture.recommendationSummary;
  const blob = `${capture.title} ${capture.category ?? ''} ${capture.analysisSummary ?? ''} ${capture.blueprintTemplate ?? ''} ${recSummary ?? ''}`;

  const blueprintSections = parsed.sections.map((s) => ({
    id: s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: s.title,
    content: s.content,
  }));

  const templateName = capture.blueprintTemplate || parseTemplateName(recSummary);
  const templateId = resolveMagnifiTemplateId(blob, templateName);
  const simplifiAssessmentId = resolveSimplifiAssessmentId(templateId, blob);
  const magnifiDef = getMagnifiTemplate(templateId);

  return {
    orgName,
    templateId,
    simplifiAssessmentId,
    theme: magnifiDef.theme,
    templateName: magnifiDef.name,
    templateReason: recSummary?.split('\n').find((l) => l.startsWith('Match:'))?.replace('Match:', '').trim(),
    journey: parseJourney(recSummary).length
      ? parseJourney(recSummary)
      : capture.productAlignment?.slice(0, 5) || ['Current State', 'Clarity', 'Momentum', 'Platform', 'Impact'],
    priorities: parsePrioritiesFromSummary(recSummary).length
      ? parsePrioritiesFromSummary(recSummary)
      : blueprintSections
          .filter((s) => /priorit/i.test(s.title))
          .flatMap((s) =>
            s.content.split('\n\n').slice(0, 3).map((block, i) => ({
              rank: i + 1,
              title: block.split('\n')[0]?.replace(/^#\d\s*/, '') || `Priority ${i + 1}`,
              rationale: block,
            })),
          ),
    firstStep: parseFirstStep(recSummary).action || sectionByKeyword(blueprintSections, ['first step']),
    firstStepCta: capture.blueprintTemplate ? 'Begin Your Journey' : 'Take the First Step',
    sections: blueprintSections,
    roadmap: parsed.roadmap.length
      ? parsed.roadmap
      : [
          { phase: '30 Days', focus: 'Clarify the highest-leverage constraint' },
          { phase: '60 Days', focus: 'Launch one visible win' },
          { phase: '90 Days', focus: 'Measure adoption in Mission Control' },
        ],
    scores: {
      eaFit: capture.eaFitScore,
      opportunity: capture.opportunityScore,
      trust: capture.trustConfidence,
    },
  };
}

export function inferIndustryTone(capture: CaptureRecord): string {
  const blob = `${capture.title} ${capture.category ?? ''} ${capture.analysisSummary ?? ''}`.toLowerCase();
  if (/university|alumni|campus|student/.test(blob)) return 'campus';
  if (/church|faith|ministry|congregation/.test(blob)) return 'faith';
  if (/athlete|recruit|sport|camp/.test(blob)) return 'athletics';
  if (/nonprofit|association|chapter|fraternity|sorority/.test(blob)) return 'community';
  return 'business';
}

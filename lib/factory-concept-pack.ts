/**
 * Opportunity Intelligence Brief™ sit-down pack (Launch Protocol v3).
 */
import {
  buildFactoryCapacityScorecard,
  formatUsdRange,
  type FactoryCapacityScorecard,
} from '@/lib/factory-capacity-score';
import { buildFactoryClientPackage } from '@/lib/factory-client-package';
import {
  buildConsultantEval,
  type ConceptConsultantEval,
} from '@/lib/factory-concept-eval';
import {
  CONCEPT_CUSTOM_CONTENT_IDS,
  type ConceptSampleKind,
} from '@/lib/factory-concept-mockups';
import {
  buildFactoryEntityProfileSync,
  synthesizeFactoryEntityProfile,
  type FactoryEntityProfile,
} from '@/lib/factory-entity-profile';
import {
  buildOpportunityBriefSync,
  synthesizeFactoryOpportunityBrief,
  type FactoryOpportunityBrief,
} from '@/lib/factory-opportunity-brief';
import {
  buildFactoryOrgResearch,
  buildFactoryOrgResearchSync,
  type FactoryOrgResearch,
} from '@/lib/factory-org-research';
import { isSyntheticPhotoClient } from '@/lib/factory-research/image-signal';
import type { FactoryProject } from '@/lib/factory-project-store';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const CREAM = '#F8F6F2';

export type ConceptPackEmailOptions = {
  inlineSamples?: boolean;
  recipientName?: string;
  generatedInLabel?: string;
  reviewUrl?: string;
  regenerateUrl?: string;
  newLaunchUrl?: string;
  visualConfidenceNote?: string;
};

export function formatFactoryGeneratedDuration(startedAtIso: string, endedAt = new Date()): string {
  const start = Date.parse(startedAtIso);
  if (!Number.isFinite(start)) return 'a few minutes';
  const totalSec = Math.max(1, Math.round((endedAt.getTime() - start) / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes <= 0) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  return `${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${seconds === 1 ? '' : 's'}`;
}

function conceptPreviewBlock(
  kind: ConceptSampleKind,
  title: string,
  surface: { purpose: string; talkingPoint: string; businessValue: string },
  escHtml: (s: string) => string,
  useCid: boolean,
  accent: string,
): string {
  const preview = useCid
    ? `<img src="cid:${escHtml(CONCEPT_CUSTOM_CONTENT_IDS[kind])}" alt="${escHtml(title)}" width="560" style="width:100%;max-width:560px;height:auto;display:block;border:0;border-radius:8px;box-shadow:0 12px 32px rgba(0,0,0,0.08);" />`
    : `<p style="margin:0;padding:36px 16px;background:#f5f5f7;border-radius:8px;font-size:13px;color:#777;text-align:center;">Custom concept image generates with this email.</p>`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 36px;">
      <tr><td>
        <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">${escHtml(title)}</p>
        ${preview}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
          <tr><td style="padding:0 0 8px;font-size:14px;color:#333;line-height:1.55;"><strong style="color:${NAVY};">Purpose</strong> — ${escHtml(surface.purpose)}</td></tr>
          <tr><td style="padding:0 0 8px;font-size:14px;color:#333;line-height:1.55;"><strong style="color:${NAVY};">Talking Point</strong> — ${escHtml(surface.talkingPoint)}</td></tr>
          <tr><td style="padding:0;font-size:14px;color:#333;line-height:1.55;"><strong style="color:${NAVY};">Business Value</strong> — ${escHtml(surface.businessValue)}</td></tr>
        </table>
      </td></tr>
    </table>`;
}

function snapshotCard(label: string, value: string, escHtml: (s: string) => string): string {
  return `
    <td width="50%" style="padding:8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,0.05);">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a8a;font-family:Arial,Helvetica,sans-serif;">${escHtml(label)}</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:${NAVY};line-height:1.35;">${escHtml(value)}</p>
        </td></tr>
      </table>
    </td>`;
}

function emailCtaButton(label: string, url: string, escHtml: (s: string) => string, primary = false): string {
  const bg = primary ? GOLD : NAVY;
  const color = primary ? NAVY : '#FFFFFF';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">
      <tr><td style="background-color:${bg};border-radius:2px;">
        <a href="${escHtml(url)}" target="_blank" style="display:inline-block;padding:14px 22px;color:${color};text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">${escHtml(label)}</a>
      </td></tr>
    </table>`;
}

function isJunkCopy(text: string | undefined): boolean {
  if (!text?.trim()) return true;
  return /screenshot submitted|source page:.*ctp\/assets|evaluate visible messaging|upload:\/\//i.test(
    text,
  );
}

function cleanDisplayName(name: string): string {
  const cleaned = name.replace(/^#+\s*/, '').trim();
  if (!cleaned || isSyntheticPhotoClient(cleaned) || /^screenshot\b/i.test(cleaned)) {
    return 'Client';
  }
  if (/efficiencyarchitects\.online/i.test(cleaned) && cleaned.length < 40) {
    return 'Client';
  }
  if (/^your organization$/i.test(cleaned)) return 'Client';
  return cleaned;
}

function brandingArtifact(project: FactoryProject): Record<string, unknown> | null {
  const branding = [...(project.context?.artifacts || [])]
    .reverse()
    .find((a) => a.kind === 'branding');
  return branding?.data && typeof branding.data === 'object'
    ? (branding.data as Record<string, unknown>)
    : null;
}

function brandingSummary(project: FactoryProject): string | undefined {
  const data = brandingArtifact(project);
  const summary =
    (typeof data?.visionSummary === 'string' && data.visionSummary) ||
    (typeof data?.whatTheyDo === 'string' && data.whatTheyDo) ||
    undefined;
  return summary && !isJunkCopy(summary) ? summary.trim().slice(0, 220) : undefined;
}

function brandingClientName(project: FactoryProject): string | undefined {
  const data = brandingArtifact(project);
  const name =
    (typeof data?.suggestedClientName === 'string' && data.suggestedClientName) ||
    (typeof data?.brandName === 'string' && data.brandName) ||
    undefined;
  if (!name || isJunkCopy(name) || isSyntheticPhotoClient(name)) return undefined;
  const cleaned = cleanDisplayName(name);
  return cleaned === 'Client' ? undefined : cleaned;
}

export type FactoryConceptPack = {
  version: 3;
  label: 'Opportunity Intelligence Brief™';
  clientName: string;
  projectId: string;
  coverLine: string;
  sourceUrl?: string;
  heroImageUrl?: string;
  scorecard: FactoryCapacityScorecard;
  consultant: ConceptConsultantEval;
  opportunityBrief: FactoryOpportunityBrief;
  research: FactoryOrgResearch;
  eval: {
    headline: string;
    bullets: string[];
    opportunities: string[];
  };
  landing: {
    headline: string;
    subhead: string;
    cta: string;
    points: string[];
  };
  portal: {
    headline: string;
    modules: string[];
  };
  member: {
    headline: string;
    modules: string[];
  };
  ask: string;
};

type ArtifactLike = { kind?: string; data?: Record<string, unknown> };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function artifactList(project: FactoryProject): ArtifactLike[] {
  return (project.context?.artifacts || []) as ArtifactLike[];
}

function pickOpportunities(project: FactoryProject, fallback: string[]): string[] {
  const arts = artifactList(project);
  const rec = [...arts].reverse().find((a) => a.kind === 'recommendations');
  const items = (rec?.data as { items?: unknown[] } | undefined)?.items;
  if (Array.isArray(items) && items.length) {
    return items
      .map((item) => {
        if (typeof item === 'string') return item;
        const r = asRecord(item);
        return str(r?.title) || str(r?.text) || str(r?.summary) || '';
      })
      .filter(Boolean)
      .slice(0, 5);
  }
  return fallback;
}

function brandingCta(project: FactoryProject): string | undefined {
  const branding = [...(project.context?.artifacts || [])]
    .reverse()
    .find((a) => a.kind === 'branding');
  const cta = branding?.data?.cta;
  return typeof cta === 'string' && cta.trim() ? cta.trim().slice(0, 40) : undefined;
}

export function buildFactoryConceptPack(
  project: FactoryProject,
  options?: {
    profile?: FactoryEntityProfile;
    opportunityBrief?: FactoryOpportunityBrief;
    research?: FactoryOrgResearch;
  },
): FactoryConceptPack {
  const profile = options?.profile ?? buildFactoryEntityProfileSync(project);
  const research = options?.research ?? buildFactoryOrgResearchSync(project, profile);
  const base = buildFactoryClientPackage(project);
  const scorecard = buildFactoryCapacityScorecard(project);
  const opportunityLabel = formatUsdRange(
    scorecard.opportunityGained.annualLow,
    scorecard.opportunityGained.annualHigh,
  );
  const clientName =
    cleanDisplayName(profile.name) !== 'Client'
      ? cleanDisplayName(profile.name)
      : brandingClientName(project) ||
        cleanDisplayName(
          (!isJunkCopy(base.siteSnapshot.title) && base.siteSnapshot.title) || project.client,
        );
  const profileNamed = { ...profile, name: clientName };
  const opportunityBrief =
    options?.opportunityBrief ??
    buildOpportunityBriefSync({
      profile: profileNamed,
      scorecard,
      opportunityLabel,
      generationTime: formatFactoryGeneratedDuration(project.createdAt),
      project,
      research: { ...research, name: clientName },
    });

  const description =
    opportunityBrief.brand.subhead ||
    opportunityBrief.story ||
    profile.tagline ||
    profile.whoTheyAre.slice(0, 220) ||
    brandingSummary(project) ||
    `${clientName} gets a clear public face, an ops home to run the work, and a member experience that keeps people connected.`;

  const rawHints = pickOpportunities(project, [
    ...opportunityBrief.whatWeLearned,
    ...opportunityBrief.conversationStarters,
    ...profile.frictionSignals,
    ...scorecard.gaps,
  ]).slice(0, 5);

  const consultant = buildConsultantEval({
    clientName,
    scorecard,
    signalNote: research.sourceNote || profile.sourceNote,
    summary: description,
    rawOpportunityHints: rawHints,
    profile: profileNamed,
  });

  const cta =
    opportunityBrief.brand.cta || profile.primaryAsk || brandingCta(project) || 'Get started';

  return {
    version: 3,
    label: 'Opportunity Intelligence Brief™',
    clientName,
    projectId: project.id,
    coverLine: `Opportunity Intelligence Brief™ for ${clientName} — prepared for your upcoming client conversation.`,
    sourceUrl: project.url && !/\/api\/ctp\/assets\//i.test(project.url) ? project.url : undefined,
    heroImageUrl: base.imageUrls[0] || base.siteSnapshot.imageUrl,
    scorecard,
    consultant,
    opportunityBrief: { ...opportunityBrief, organization: clientName },
    research: { ...research, name: clientName },
    eval: {
      headline: 'Opportunity Intelligence Brief™',
      bullets: opportunityBrief.conversationStarters,
      opportunities: [
        opportunityBrief.recommendedStartingPoint,
        'Future Website',
        'Executive Ops Portal',
        'Member Experience',
      ],
    },
    landing: {
      headline: opportunityBrief.brand.headline || clientName,
      subhead: description.slice(0, 220),
      cta: cta.slice(0, 40),
      points: ['Discover', 'Belong', 'Engage', 'Grow'],
    },
    portal: {
      headline: `${clientName} Leadership Workspace`,
      modules: opportunityBrief.portal.modules,
    },
    member: {
      headline: `${clientName} ${opportunityBrief.member.persona} Experience`,
      modules: opportunityBrief.member.tiles,
    },
    ask: 'If the concepts feel right, approve the Skin Brief and move toward build — with their brand on these surfaces.',
  };
}

export async function buildFactoryConceptPackAsync(
  project: FactoryProject,
): Promise<FactoryConceptPack> {
  const profile = await synthesizeFactoryEntityProfile(project);
  const research = await buildFactoryOrgResearch(project, profile);
  const scorecard = buildFactoryCapacityScorecard(project);
  const opportunityBrief = await synthesizeFactoryOpportunityBrief({
    profile: { ...profile, name: cleanDisplayName(profile.name) },
    scorecard,
    opportunityLabel: formatUsdRange(
      scorecard.opportunityGained.annualLow,
      scorecard.opportunityGained.annualHigh,
    ),
    generationTime: formatFactoryGeneratedDuration(project.createdAt),
    project,
    research,
  });
  return buildFactoryConceptPack(project, { profile, opportunityBrief, research });
}

export function exportFactoryConceptPackMarkdown(pack: FactoryConceptPack): string {
  const s = pack.scorecard;
  const b = pack.opportunityBrief;
  return [
    `# ${pack.clientName} — Opportunity Intelligence Brief™`,
    '',
    `_${pack.coverLine}_`,
    '',
    `Prepared for: ${b.preparedForConsultant}`,
    `Date: ${b.preparedDate}`,
    `Review time: ${b.estimatedReviewTime}`,
    `Project: ${pack.projectId}`,
    pack.sourceUrl ? `Website: ${pack.sourceUrl}` : '',
    '',
    '## Executive Snapshot',
    '',
    `- Organization: ${b.organization}`,
    `- Industry: ${b.industry}`,
    `- Audience: ${b.primaryAudience}`,
    `- Digital maturity: ${b.digitalMaturity}/100`,
    `- Estimated opportunity: ${b.estimatedOpportunity}`,
    `- Confidence: ${b.overallConfidence}`,
    `- Suggested starting point: ${b.recommendedStartingPoint}`,
    '',
    '## Who they are',
    '',
    b.whoTheyAre,
    '',
    '## What we learned',
    '',
    ...b.whatWeLearned.map((item) => `- ${item}`),
    '',
    '## Hidden opportunities',
    '',
    ...b.hiddenOpportunities.flatMap((h) => [
      `### ${h.observation}`,
      '',
      `**Impact:** ${h.businessImpact}`,
      `**Possible future:** ${h.possibleFuture}`,
      '',
    ]),
    '## Evidence',
    '',
    ...b.evidence.map((e) => `- **${e.label}:** ${e.detail}`),
    '',
    '## Opportunity Scorecard',
    '',
    ...b.scorecard.map((row) => `- **${row.label}:** ${row.score}/100 — ${row.note}`),
    '',
    '## Three concepts',
    '',
    `### Future Website — ${b.website.purpose}`,
    b.website.talkingPoint,
    '',
    `### Executive Ops Portal — ${b.portal.purpose}`,
    b.portal.talkingPoint,
    '',
    `### Member Experience (${b.member.persona}) — ${b.member.purpose}`,
    b.member.talkingPoint,
    '',
    '## Conversation starters',
    '',
    ...b.conversationStarters.map((item) => `- ${item}`),
    '',
    '## Discovery questions',
    '',
    ...b.discoveryQuestions.map((item) => `- ${item}`),
    '',
    '## Likely objections',
    '',
    ...b.objections.map((o) => `- **${o.objection}** → ${o.response}`),
    '',
    '## Meeting strategy',
    '',
    `Show first: ${b.meetingStrategy.showFirst}`,
    `Discuss first: ${b.meetingStrategy.discussFirst}`,
    '',
    '### 20-minute flow',
    ...b.meetingStrategy.flow20.map((item, i) => `${i + 1}. ${item}`),
    '',
    '### 45-minute flow',
    ...b.meetingStrategy.flow45.map((item, i) => `${i + 1}. ${item}`),
    '',
    '## Recommended next steps',
    '',
    `- Immediate: ${b.nextSteps.immediate}`,
    `- 1 week: ${b.nextSteps.withinOneWeek}`,
    `- 30 days: ${b.nextSteps.withinThirtyDays}`,
    `- Longer: ${b.nextSteps.longerTerm}`,
    '',
    '## Consultant coaching (confidential)',
    '',
    ...b.consultantCoaching.map((item) => `- ${item}`),
    '',
    b.visualConfidenceNote ? `\n_${b.visualConfidenceNote}_\n` : '',
    '## Capacity score (supporting)',
    '',
    `**${s.overallScore}/100**`,
    '',
    pack.ask,
    '',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n');
}

/**
 * Opportunity Intelligence Brief™ email (consultant only).
 */
export function renderFactoryConceptPackEmailHtml(
  pack: FactoryConceptPack,
  escHtml: (s: string) => string,
  options?: ConceptPackEmailOptions,
): string {
  const brief = pack.opportunityBrief;
  const org = pack.clientName;
  const recipient = (options?.recipientName || brief.preparedForConsultant || 'Robert').trim() || 'Robert';
  const generatedIn = options?.generatedInLabel || brief.generationTime || 'a few minutes';
  const base = EA_PLATFORM_URL.replace(/\/$/, '');
  const reviewUrl =
    options?.reviewUrl || `${base}/api/projects/${encodeURIComponent(pack.projectId)}/concept-pack`;
  const regenerateUrl = options?.regenerateUrl || `${base}/admin/ea-factory/projects`;
  const newLaunchUrl = options?.newLaunchUrl || `${base}/admin/ea-factory/launch`;
  const useCid = options?.inlineSamples !== false;
  const accent = brief.brand.accent || GOLD;
  const primary = brief.brand.primary || NAVY;
  const visualNote = options?.visualConfidenceNote || brief.visualConfidenceNote;

  const learned = brief.whatWeLearned
    .map(
      (item) =>
        `<tr><td style="padding:0 0 10px;font-size:15px;color:#333;line-height:1.55;">• ${escHtml(item)}</td></tr>`,
    )
    .join('');

  const hidden = brief.hiddenOpportunities
    .map(
      (h) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;background:#fff;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,0.04);">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:${primary};">${escHtml(h.observation)}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#555;line-height:1.5;"><strong>Impact:</strong> ${escHtml(h.businessImpact)}</p>
          <p style="margin:0;font-size:13px;color:#555;line-height:1.5;"><strong>Possible future:</strong> ${escHtml(h.possibleFuture)}</p>
        </td></tr>
      </table>`,
    )
    .join('');

  const evidence = brief.evidence
    .map(
      (e) =>
        `<tr><td style="padding:0 0 10px;font-size:14px;color:#333;line-height:1.5;"><strong style="color:${primary};">${escHtml(e.label)}</strong> — ${escHtml(e.detail)}</td></tr>`,
    )
    .join('');

  const scoreRows = brief.scorecard
    .map(
      (row) =>
        `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;color:${primary};font-weight:600;">${escHtml(row.label)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;color:${accent};font-weight:700;width:56px;">${row.score}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;color:#666;">${escHtml(row.note)}</td>
        </tr>`,
    )
    .join('');

  const starters = brief.conversationStarters
    .map(
      (item) =>
        `<tr><td style="padding:0 0 10px;font-size:15px;color:#333;line-height:1.55;">• ${escHtml(item)}</td></tr>`,
    )
    .join('');

  const questions = brief.discoveryQuestions
    .map(
      (item) =>
        `<tr><td style="padding:0 0 10px;font-size:15px;color:#333;line-height:1.55;">• ${escHtml(item)}</td></tr>`,
    )
    .join('');

  const objections = brief.objections
    .map(
      (item) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;background:#fff;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,0.04);">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:${primary};">“${escHtml(item.objection)}”</p>
          <p style="margin:0;font-size:14px;color:#444;line-height:1.55;">${escHtml(item.response)}</p>
        </td></tr>
      </table>`,
    )
    .join('');

  const flow20 = brief.meetingStrategy.flow20
    .map(
      (item, i) =>
        `<tr><td style="padding:0 0 8px;font-size:14px;color:#333;">${i + 1}. ${escHtml(item)}</td></tr>`,
    )
    .join('');
  const flow45 = brief.meetingStrategy.flow45
    .map(
      (item, i) =>
        `<tr><td style="padding:0 0 8px;font-size:14px;color:#333;">${i + 1}. ${escHtml(item)}</td></tr>`,
    )
    .join('');

  const coaching = brief.consultantCoaching
    .map(
      (item) =>
        `<tr><td style="padding:0 0 10px;font-size:14px;color:#444;line-height:1.55;">• ${escHtml(item)}</td></tr>`,
    )
    .join('');

  const cards = [
    ['Organization', brief.organization || org],
    ['Industry', brief.industry],
    ['Primary Audience', brief.primaryAudience],
    ['Digital Maturity', `${brief.digitalMaturity} / 100`],
    ['Estimated Opportunity', brief.estimatedOpportunity],
    ['Suggested Starting Point', brief.recommendedStartingPoint],
    ['Confidence', brief.overallConfidence],
    ['Generation Time', generatedIn],
  ];
  const cardRows: string[] = [];
  for (let i = 0; i < cards.length; i += 2) {
    const a = cards[i];
    const b = cards[i + 1];
    cardRows.push(
      `<tr>${snapshotCard(a[0], a[1], escHtml)}${b ? snapshotCard(b[0], b[1], escHtml) : '<td width="50%"></td>'}</tr>`,
    );
  }

  return `
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Launch Protocol v3</p>
    <h1 style="margin:0 0 6px;font-size:26px;line-height:1.2;color:${primary};font-weight:700;">Opportunity Intelligence Brief™</h1>
    <p style="margin:0 0 4px;font-size:20px;font-weight:600;color:${primary};">${escHtml(org)}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#888;line-height:1.5;">Prepared for ${escHtml(recipient)} · ${escHtml(brief.preparedDate)} · ${escHtml(brief.estimatedReviewTime)} review</p>
    ${
      visualNote
        ? `<p style="margin:0 0 24px;font-size:13px;color:#8a6d3b;line-height:1.5;background:#fff8e8;padding:12px 14px;border-radius:8px;">${escHtml(visualNote)}</p>`
        : `<p style="margin:0 0 28px;font-size:14px;color:#888;">Meeting-ready intelligence — not a summary of what Launch generated.</p>`
    }

    <p style="margin:0 0 16px;font-size:16px;color:#1A1A2E;line-height:1.7;">Hi ${escHtml(recipient)},</p>
    <p style="margin:0 0 28px;font-size:16px;color:#444;line-height:1.7;">Your Opportunity Intelligence Brief™ for <strong>${escHtml(org)}</strong> is ready. Review in about three minutes — then walk into the conversation with a playbook.</p>

    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Executive Snapshot</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 36px;">
      ${cardRows.join('')}
    </table>

    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Executive Intelligence</p>
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${primary};">Who they are</p>
    <p style="margin:0 0 20px;font-size:15px;color:#333;line-height:1.7;">${escHtml(brief.whoTheyAre)}</p>
    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:${primary};">What we learned</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${learned}</table>
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${primary};">Hidden opportunities</p>
    <div style="margin:0 0 32px;">${hidden}</div>

    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Evidence</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;background:${CREAM};border-radius:12px;">
      <tr><td style="padding:18px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${evidence || `<tr><td style="font-size:14px;color:#666;">Signals from Launch photo, site, and notes.</td></tr>`}</table></td></tr>
    </table>

    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Opportunity Scorecard</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 36px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.04);">
      ${scoreRows}
    </table>

    <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Three Concepts</p>
    ${conceptPreviewBlock('landing', 'Future Website', brief.website, escHtml, useCid, accent)}
    ${conceptPreviewBlock('portal', 'Executive Ops Portal', brief.portal, escHtml, useCid, accent)}
    ${conceptPreviewBlock('member', `${brief.member.persona} Experience`, brief.member, escHtml, useCid, accent)}

    <p style="margin:8px 0 12px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Executive Conversation Guide</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">${starters}</table>

    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Discovery Questions</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">${questions}</table>

    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Likely Objections</p>
    <div style="margin:0 0 32px;">${objections}</div>

    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Meeting Strategy</p>
    <p style="margin:0 0 10px;font-size:14px;color:#333;">Show first: <strong>${escHtml(brief.meetingStrategy.showFirst)}</strong> · Discuss first: ${escHtml(brief.meetingStrategy.discussFirst)}</p>
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${primary};">20-minute flow</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">${flow20}</table>
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${primary};">45-minute flow</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">${flow45}</table>

    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Recommended Next Steps</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr><td style="padding:0 0 8px;font-size:14px;color:#333;"><strong>Immediate:</strong> ${escHtml(brief.nextSteps.immediate)}</td></tr>
      <tr><td style="padding:0 0 8px;font-size:14px;color:#333;"><strong>1 week:</strong> ${escHtml(brief.nextSteps.withinOneWeek)}</td></tr>
      <tr><td style="padding:0 0 8px;font-size:14px;color:#333;"><strong>30 days:</strong> ${escHtml(brief.nextSteps.withinThirtyDays)}</td></tr>
      <tr><td style="padding:0;font-size:14px;color:#333;"><strong>Longer:</strong> ${escHtml(brief.nextSteps.longerTerm)}</td></tr>
    </table>

    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Consultant Coaching</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 36px;background:${CREAM};border-radius:12px;">
      <tr><td style="padding:18px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${coaching}</table>
        <p style="margin:12px 0 0;font-size:12px;color:#888;font-style:italic;">Confidential — this email is for the consultant only.</p>
      </td></tr>
    </table>

    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:Arial,Helvetica,sans-serif;">Open Brief</p>
    ${emailCtaButton('Review Opportunity Brief', reviewUrl, escHtml, true)}
    ${emailCtaButton('Regenerate', regenerateUrl, escHtml, false)}
    ${emailCtaButton('New Launch', newLaunchUrl, escHtml, false)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:36px 0 0;border-top:1px solid #ebe6dc;">
      <tr><td style="padding:24px 0 0;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:${primary};">Efficiency Architects</p>
        <p style="margin:0;font-size:13px;color:#888;line-height:1.55;font-style:italic;">Helping organizations see what's possible before a single line of code is written.</p>
      </td></tr>
    </table>
  `;
}

export function renderFactoryConceptPackDocument(pack: FactoryConceptPack): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const body = renderFactoryConceptPackEmailHtml(pack, esc, { inlineSamples: false });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(pack.clientName)} — Opportunity Intelligence Brief™</title>
  <style>
    body { margin:0; background:${CREAM}; font-family: Georgia, 'Times New Roman', serif; }
    .wrap { max-width:640px; margin:0 auto; padding:28px 18px 48px; }
    @media print { body { background:#fff; } .wrap { padding:0; } }
  </style>
</head>
<body>
  <div class="wrap">${body}</div>
</body>
</html>`;
}

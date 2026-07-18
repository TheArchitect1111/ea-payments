/**
 * Sit-down Concept Pack — what a founder shows an interested prospect.
 *
 * Locked sections:
 * 1. Business eval & breakdown
 * 2. Website / landing concept
 * 3. Portal concept
 * 4. Member concept
 * + cover + clear ask
 *
 * Labeled as Concept Pack (preview), not finished production.
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
import { isSyntheticPhotoClient } from '@/lib/factory-research/image-signal';
import type { FactoryProject } from '@/lib/factory-project-store';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const CREAM = '#F8F6F2';

export type ConceptPackEmailOptions = {
  inlineSamples?: boolean;
  /** Founder first name — defaults to Robert */
  recipientName?: string;
  /** e.g. "2 minutes 14 seconds" */
  generatedInLabel?: string;
  reviewUrl?: string;
  regenerateUrl?: string;
  newLaunchUrl?: string;
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

function defaultTalkingPoints(pack: FactoryConceptPack): string[] {
  const fromOpps = pack.consultant.opportunities
    .map((o) => o.plainEnglish.trim())
    .filter((line) => line.length > 24);

  const fromFindings = pack.consultant.findings
    .filter((f) => /friction|clarity|ops|trust|who /i.test(f.title))
    .map((f) => f.observation.trim())
    .filter((line) => line.length > 24 && line.length < 220);

  const defaults = [
    'Their story could be communicated more clearly within the first few seconds.',
    'Several day-to-day activities appear to rely on disconnected systems.',
    'A more connected digital experience could improve engagement while reducing administrative effort.',
    'Their organization has an opportunity to create a more modern, guided experience for everyone they serve.',
  ];

  const merged = [...fromOpps, ...fromFindings, ...defaults];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of merged) {
    const key = line.toLowerCase().slice(0, 48);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line.length > 180 ? `${line.slice(0, 177)}…` : line);
    if (out.length >= 4) break;
  }
  return out;
}

function conceptPreviewBlock(
  kind: ConceptSampleKind,
  title: string,
  blurb: string,
  escHtml: (s: string) => string,
  useCid: boolean,
): string {
  const preview = useCid
    ? `<img src="cid:${escHtml(CONCEPT_CUSTOM_CONTENT_IDS[kind])}" alt="${escHtml(title)}" width="560" style="width:100%;max-width:560px;height:auto;display:block;border:0;border:1px solid #e8e4dc;" />`
    : `<p style="margin:0;padding:28px 16px;background:#f5f5f7;border:1px solid #e8e4dc;font-size:13px;color:#777;text-align:center;">Preview image will appear in your emailed Concept Pack.</p>`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
      <tr><td>
        <p style="margin:0 0 6px;font-size:16px;font-weight:800;color:${NAVY};line-height:1.35;">${escHtml(title)}</p>
        <p style="margin:0 0 12px;font-size:14px;color:#444;line-height:1.55;">${escHtml(blurb)}</p>
        ${preview}
      </td></tr>
    </table>`;
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
    return 'Your organization';
  }
  if (/efficiencyarchitects\.online/i.test(cleaned) && cleaned.length < 40) {
    return 'Your organization';
  }
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
  return cleaned === 'Your organization' ? undefined : cleaned;
}

export type FactoryConceptPack = {
  version: 1;
  label: 'Concept Pack';
  clientName: string;
  projectId: string;
  coverLine: string;
  sourceUrl?: string;
  heroImageUrl?: string;
  scorecard: FactoryCapacityScorecard;
  consultant: ConceptConsultantEval;
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
  const auto = [...arts].reverse().find((a) => a.kind === 'automation_opportunities');
  const autoItems = (auto?.data as { items?: unknown[] } | undefined)?.items;
  if (Array.isArray(autoItems) && autoItems.length) {
    return autoItems
      .map((item) => (typeof item === 'string' ? item : str(asRecord(item)?.title) || ''))
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
  options?: { profile?: FactoryEntityProfile },
): FactoryConceptPack {
  const profile = options?.profile ?? buildFactoryEntityProfileSync(project);
  const base = buildFactoryClientPackage(project);
  const scorecard = buildFactoryCapacityScorecard(project);
  const clientName =
    cleanDisplayName(profile.name) !== 'Your organization'
      ? cleanDisplayName(profile.name)
      : brandingClientName(project) ||
        cleanDisplayName(
          (!isJunkCopy(base.siteSnapshot.title) && base.siteSnapshot.title) || project.client,
        );
  const description =
    profile.tagline ||
    profile.whoTheyAre.slice(0, 220) ||
    brandingSummary(project) ||
    (!isJunkCopy(base.siteSnapshot.description) ? base.siteSnapshot.description : undefined) ||
    `${clientName} gets a clear public face, an ops portal to run the work, and a member home that keeps people connected.`;

  const rawHints = pickOpportunities(project, [
    ...profile.frictionSignals,
    ...base.recommendations.filter((r) => !isJunkCopy(r)),
    ...scorecard.gaps,
  ]).slice(0, 5);

  const signalNote = profile.sourceNote;

  const consultant = buildConsultantEval({
    clientName,
    scorecard,
    signalNote,
    summary: description,
    rawOpportunityHints: rawHints,
    profile: { ...profile, name: clientName },
  });

  const cta = profile.primaryAsk || brandingCta(project) || 'Get started';

  return {
    version: 1,
    label: 'Concept Pack',
    clientName,
    projectId: project.id,
    coverLine: `A consultant briefing for ${clientName}: who they are, evidence, plain-English opportunities, and custom product concepts.`,
    sourceUrl: project.url && !/\/api\/ctp\/assets\//i.test(project.url) ? project.url : undefined,
    heroImageUrl: base.imageUrls[0] || base.siteSnapshot.imageUrl,
    scorecard,
    consultant,
    eval: {
      headline: consultant.headline,
      bullets: consultant.bullets,
      opportunities: consultant.opportunityLines,
    },
    landing: {
      headline: clientName,
      subhead: description.slice(0, 220),
      cta: cta.slice(0, 40),
      points: ['Get started', 'Learn', 'Engage', 'Belong'],
    },
    portal: {
      headline: `${clientName} Ops Portal`,
      modules: [
        'Dashboard',
        'People / members',
        'Teams / programs',
        'Events & schedule',
        'Payments',
        'Communications',
      ],
    },
    member: {
      headline: `${clientName} Member Home`,
      modules: ['Dashboard', 'My journey', 'Schedule', 'Resources', 'Messages', 'Profile'],
    },
    ask: 'If this direction feels right, the next step is approval to refine the Skin Brief and move toward build — with your brand on these concepts.',
  };
}

/** Prefer this for ready email / print — includes LLM entity synthesis when available. */
export async function buildFactoryConceptPackAsync(
  project: FactoryProject,
): Promise<FactoryConceptPack> {
  const profile = await synthesizeFactoryEntityProfile(project);
  return buildFactoryConceptPack(project, { profile });
}

export function exportFactoryConceptPackMarkdown(pack: FactoryConceptPack): string {
  const s = pack.scorecard;
  return [
    `# ${pack.clientName} — ${pack.label}`,
    '',
    `_${pack.coverLine}_`,
    '',
    `Project: ${pack.projectId}`,
    pack.sourceUrl ? `Website: ${pack.sourceUrl}` : '',
    '',
    pack.heroImageUrl ? `Source image: ${pack.heroImageUrl}` : '',
    '',
    '## Capacity score',
    '',
    `**${s.overallScore}/100** (benchmark ~${s.benchmark}/100)`,
    '',
    `- Visibility ${s.scores.visibility}/100`,
    `- Exposure ${s.scores.exposure}/100`,
    `- Conversion ${s.scores.conversion}/100`,
    `- Differentiation ${s.scores.differentiation}/100`,
    `- Modernity ${s.scores.modernity}/100`,
    `- Trust ${s.scores.trust}/100`,
    '',
    '## Capacity lost (annual estimate)',
    '',
    s.capacityLost.headline,
    '',
    ...s.capacityLost.breakdown.map(
      (line) =>
        `- **${line.label}:** ${formatUsdRange(line.annualLow, line.annualHigh)}/yr — ${line.why}`,
    ),
    '',
    '## Potential opportunity gained',
    '',
    s.opportunityGained.headline,
    '',
    `_${s.opportunityGained.assumption}_`,
    '',
    `## ${pack.consultant.headline}`,
    '',
    pack.consultant.guideIntro,
    '',
    '## Who they are',
    '',
    pack.consultant.whoTheyAre.narrative,
    '',
    pack.consultant.whoTheyAre.whoTheyServe
      ? `**Who they serve:** ${pack.consultant.whoTheyAre.whoTheyServe}`
      : '',
    pack.consultant.whoTheyAre.whatTheyOffer
      ? `**What they offer:** ${pack.consultant.whoTheyAre.whatTheyOffer}`
      : '',
    pack.consultant.whoTheyAre.primaryAsk
      ? `**Primary ask:** ${pack.consultant.whoTheyAre.primaryAsk}`
      : '',
    pack.consultant.whoTheyAre.opsReality
      ? `**Ops reality:** ${pack.consultant.whoTheyAre.opsReality}`
      : '',
    `**Confidence:** ${pack.consultant.whoTheyAre.confidence}`,
    '',
    ...pack.consultant.whoTheyAre.evidence.map((e) => `- ${e}`),
    '',
    ...pack.consultant.findings.flatMap((f) => [
      `### ${f.title}`,
      '',
      `**What we see:** ${f.observation}`,
      `**Why it matters:** ${f.whyItMatters}`,
      `**Recommendation:** ${f.recommendation}`,
      `**Evidence:** ${f.evidence}`,
      '',
    ]),
    '## Opportunities (plain English)',
    '',
    ...pack.consultant.opportunities.flatMap((o) => [
      `### ${o.title}`,
      '',
      o.plainEnglish,
      '',
      `**What changes:** ${o.whatChanges}`,
      `**Impact:** ${o.impact}`,
      `**Evidence:** ${o.evidence}`,
      '',
    ]),
    '## Custom product concepts (see HTML email for images)',
    '',
    '1. Website / landing',
    '2. Ops / client portal',
    '3. Member home',
    '',
    '## The ask',
    '',
    pack.ask,
    '',
    '## Conversation Strategy',
    '',
    '1. Start with the website and ask, "Does this feel like your organization?"',
    '2. Transition to the portal: "What if your staff started every morning here?"',
    '3. End with the member page: "Imagine every person you serve having a space like this."',
    '4. Ask which concept generated the most excitement.',
    '5. Let the client tell you what matters most before discussing implementation.',
    '',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n');
}

/**
 * Canonical Launch Complete email — meeting companion for the founder.
 * Use this every time a Concept Pack is ready.
 */
export function renderFactoryConceptPackEmailHtml(
  pack: FactoryConceptPack,
  escHtml: (s: string) => string,
  options?: ConceptPackEmailOptions,
): string {
  const s = pack.scorecard;
  const org = pack.clientName;
  const recipient = (options?.recipientName || 'Robert').trim() || 'Robert';
  const generatedIn = options?.generatedInLabel || 'a few minutes';
  const base = EA_PLATFORM_URL.replace(/\/$/, '');
  const reviewUrl =
    options?.reviewUrl || `${base}/api/projects/${encodeURIComponent(pack.projectId)}/concept-pack`;
  const regenerateUrl =
    options?.regenerateUrl || `${base}/admin/ea-factory/projects`;
  const newLaunchUrl = options?.newLaunchUrl || `${base}/admin/ea-factory/launch`;
  const useCid = options?.inlineSamples !== false;
  const opportunityRange = formatUsdRange(
    s.opportunityGained.annualLow,
    s.opportunityGained.annualHigh,
  );
  const talkingPoints = defaultTalkingPoints(pack);
  const who = pack.consultant.whoTheyAre;

  const talkingList = talkingPoints
    .map(
      (point) =>
        `<tr><td style="padding:0 0 10px 0;font-size:14px;color:#333;line-height:1.55;">• ${escHtml(point)}</td></tr>`,
    )
    .join('');

  const whoLine = who?.narrative
    ? `<p style="margin:0 0 18px;font-size:14px;color:#555;line-height:1.6;"><strong style="color:${NAVY};">Who they are:</strong> ${escHtml(who.narrative.slice(0, 320))}${who.narrative.length > 320 ? '…' : ''}</p>`
    : '';

  return `
    <p style="margin:0 0 16px;font-size:16px;color:#1A1A2E;line-height:1.7;">Hi ${escHtml(recipient)},</p>
    <p style="margin:0 0 14px;font-size:16px;color:#1A1A2E;line-height:1.7;">Your Launch Concept Pack for <strong>${escHtml(org)}</strong> is complete and ready for review.</p>
    <p style="margin:0 0 22px;font-size:15px;color:#444;line-height:1.7;">This version is designed to help you lead a live conversation with the client by showing them what their organization could become.</p>

    ${whoLine}

    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Arial,Helvetica,sans-serif;">Executive Snapshot</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;border:1px solid #e8e4dc;">
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #eee;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;font-family:Arial,Helvetica,sans-serif;">Organization</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:${NAVY};">${escHtml(org)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #eee;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;font-family:Arial,Helvetica,sans-serif;">Overall Opportunity</p>
          <p style="margin:0;font-size:22px;font-weight:800;color:${NAVY};">${s.overallScore} <span style="font-size:14px;font-weight:600;color:#777;">/ 100</span></p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #eee;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;font-family:Arial,Helvetica,sans-serif;">Estimated Annual Opportunity</p>
          <p style="margin:0;font-size:18px;font-weight:800;color:${NAVY};">${escHtml(opportunityRange)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;font-family:Arial,Helvetica,sans-serif;">Generated In</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:${NAVY};">${escHtml(generatedIn)}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Arial,Helvetica,sans-serif;">What's Ready</p>

    ${conceptPreviewBlock(
      'landing',
      '🌐 Website Experience',
      'A custom homepage concept designed around their mission, audience, and first impression.',
      escHtml,
      useCid,
    )}
    ${conceptPreviewBlock(
      'portal',
      '🖥 Executive Operations Portal',
      'A working concept showing how leadership could manage registrations, communication, reporting, events, documents, and daily operations from one place.',
      escHtml,
      useCid,
    )}
    ${conceptPreviewBlock(
      'member',
      '👤 Member Experience',
      'A personalized member page showing how participants, families, donors, volunteers, clients, or employees could stay connected through one digital home.',
      escHtml,
      useCid,
    )}

    <p style="margin:8px 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Arial,Helvetica,sans-serif;">Talking Points</p>
    <p style="margin:0 0 12px;font-size:14px;color:#555;line-height:1.55;">Based on the information provided, these are likely to resonate during your conversation.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
      ${talkingList}
    </table>

    <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Arial,Helvetica,sans-serif;">Before You Walk Into The Meeting</p>
    <p style="margin:0 0 12px;font-size:14px;color:#555;line-height:1.55;">Ask yourself three questions.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
      <tr><td style="padding:0 0 10px;font-size:14px;color:#333;line-height:1.55;">✅ Does the website accurately reflect who they are?</td></tr>
      <tr><td style="padding:0 0 10px;font-size:14px;color:#333;line-height:1.55;">✅ Does the portal look like something their leadership team would actually use every day?</td></tr>
      <tr><td style="padding:0 0 10px;font-size:14px;color:#333;line-height:1.55;">✅ Does the member page feel like it belongs to this organization?</td></tr>
    </table>
    <p style="margin:0 0 8px;font-size:15px;color:#1A1A2E;line-height:1.6;">If the answer is yes, you're ready.</p>
    <p style="margin:0 0 22px;font-size:15px;color:#444;line-height:1.6;">If not — select <strong>Regenerate</strong> and Launch will create a new concept.</p>

    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Arial,Helvetica,sans-serif;">Open Your Concept Pack</p>
    ${emailCtaButton('Review Concept Pack', reviewUrl, escHtml, true)}
    ${emailCtaButton('Regenerate Concepts', regenerateUrl, escHtml, false)}
    ${emailCtaButton('Start New Launch', newLaunchUrl, escHtml, false)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;border-top:1px solid #e8e4dc;">
      <tr><td style="padding:22px 0 0;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:${NAVY};">Efficiency Architects</p>
        <p style="margin:0;font-size:13px;color:#777;line-height:1.55;font-style:italic;">"Helping organizations see what's possible before a single line of code is written."</p>
      </td></tr>
    </table>

    <p style="margin:28px 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Arial,Helvetica,sans-serif;">Conversation Strategy</p>
    <p style="margin:0 0 12px;font-size:13px;color:#666;line-height:1.5;">Executive Conversation Guide — glance at these before you walk in.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;background:${CREAM};border-left:4px solid ${GOLD};">
      <tr><td style="padding:16px 18px;">
        <p style="margin:0 0 10px;font-size:14px;color:#333;line-height:1.55;">1. Start with the website and ask, "Does this feel like your organization?"</p>
        <p style="margin:0 0 10px;font-size:14px;color:#333;line-height:1.55;">2. Transition to the portal: "What if your staff started every morning here?"</p>
        <p style="margin:0 0 10px;font-size:14px;color:#333;line-height:1.55;">3. End with the member page: "Imagine every person you serve having a space like this."</p>
        <p style="margin:0 0 10px;font-size:14px;color:#333;line-height:1.55;">4. Ask which concept generated the most excitement.</p>
        <p style="margin:0;font-size:14px;color:#333;line-height:1.55;">5. Let the client tell you what matters most before discussing implementation.</p>
      </td></tr>
    </table>
  `;
}

/** Standalone printable HTML document for in-room demos. */
export function renderFactoryConceptPackDocument(pack: FactoryConceptPack): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const body = renderFactoryConceptPackEmailHtml(pack, esc, { inlineSamples: false });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(pack.clientName)} — Concept Pack</title>
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

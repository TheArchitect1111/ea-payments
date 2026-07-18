/**
 * Sit-down Concept Pack visuals — high-fidelity product sample images
 * (website / ops portal / member home), labeled for the client.
 *
 * Samples live in public/factory-concept-samples/ and are inlined in email via CID
 * so the prospect sees a real product, not an HTML wireframe.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

const GOLD = '#C9A844';
const NAVY = '#1B2B4D';
const BLACK = '#0A0A0A';
const MUTED = '#888888';

export type ConceptSampleKind = 'landing' | 'portal' | 'member';

export const CONCEPT_SAMPLE_FILES: Record<ConceptSampleKind, string> = {
  landing: 'website-landing.png',
  portal: 'ops-portal.png',
  member: 'member-home.png',
};

export const CONCEPT_SAMPLE_CONTENT_IDS: Record<ConceptSampleKind, string> = {
  landing: 'concept-sample-landing',
  portal: 'concept-sample-portal',
  member: 'concept-sample-member',
};

const SAMPLE_META: Record<
  ConceptSampleKind,
  { eyebrow: string; role: string; blurb: string }
> = {
  landing: {
    eyebrow: '1 · Website / landing',
    role: 'public face',
    blurb: 'Hero, journey, community, media, and a clear register / join path.',
  },
  portal: {
    eyebrow: '2 · Client / ops portal',
    role: 'where you run the system',
    blurb: 'Dashboard, people, programs, events, payments, and communications in one ops home.',
  },
  member: {
    eyebrow: '3 · Member home',
    role: 'where their people live',
    blurb: 'Journey, schedule, highlights, messages, and belonging after they join.',
  },
};

function publicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    EA_PLATFORM_URL ||
    'https://efficiencyarchitects.online'
  ).replace(/\/$/, '');
}

export function conceptSamplePublicUrl(kind: ConceptSampleKind): string {
  return `${publicBaseUrl()}/factory-concept-samples/${CONCEPT_SAMPLE_FILES[kind]}`;
}

export async function loadConceptSampleInlineImages(): Promise<
  Array<{
    kind: ConceptSampleKind;
    filename: string;
    contentBase64: string;
    contentId: string;
    mimeType: string;
  }>
> {
  const out: Array<{
    kind: ConceptSampleKind;
    filename: string;
    contentBase64: string;
    contentId: string;
    mimeType: string;
  }> = [];

  for (const kind of ['landing', 'portal', 'member'] as ConceptSampleKind[]) {
    const filename = CONCEPT_SAMPLE_FILES[kind];
    const filePath = path.join(process.cwd(), 'public', 'factory-concept-samples', filename);
    try {
      const bytes = await readFile(filePath);
      out.push({
        kind,
        filename,
        contentBase64: bytes.toString('base64'),
        contentId: CONCEPT_SAMPLE_CONTENT_IDS[kind],
        mimeType: 'image/png',
      });
    } catch (err) {
      console.error('[factory-concept-mockups] missing sample', filename, err);
    }
  }

  return out;
}

export type ConceptSampleRenderInput = {
  clientName: string;
  heroImageUrl?: string;
  /** When true, use cid: URLs for the three samples (email). */
  useCid?: boolean;
  sampleUrls?: Partial<Record<ConceptSampleKind, string>>;
  escHtml: (s: string) => string;
};

function sampleSrc(
  kind: ConceptSampleKind,
  input: ConceptSampleRenderInput,
): string {
  if (input.useCid) return `cid:${CONCEPT_SAMPLE_CONTENT_IDS[kind]}`;
  return input.sampleUrls?.[kind] || conceptSamplePublicUrl(kind);
}

function sampleBlock(
  kind: ConceptSampleKind,
  input: ConceptSampleRenderInput,
): string {
  const meta = SAMPLE_META[kind];
  const { escHtml, clientName } = input;
  const src = escHtml(sampleSrc(kind, input));

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;border:1px solid #e5e5e5;background:#fff;">
    <tr>
      <td style="padding:14px 16px;background:${BLACK};">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">${escHtml(meta.eyebrow)}</p>
        <p style="margin:6px 0 0;font-size:16px;font-weight:800;color:#fff;">${escHtml(clientName)} — ${escHtml(meta.role)}</p>
        <p style="margin:6px 0 0;font-size:12px;color:#cfcfcf;line-height:1.45;">${escHtml(meta.blurb)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0;background:${BLACK};">
        <img src="${src}" alt="${escHtml(clientName)} ${escHtml(meta.role)} concept sample" width="560" style="width:100%;max-width:560px;height:auto;display:block;border:0;" />
      </td>
    </tr>
    <tr>
      <td style="padding:10px 14px;background:#f7f5f0;">
        <p style="margin:0;font-size:11px;color:${MUTED};line-height:1.45;">Branded concept sample for sit-down discussion. Final build uses <strong style="color:${NAVY};">${escHtml(clientName)}</strong> photography, colors, and offer — not a finished production site.</p>
      </td>
    </tr>
  </table>`;
}

/** Full visual pack: optional client signal photo + three product samples. */
export function renderConceptSampleMockups(input: ConceptSampleRenderInput): string {
  const { escHtml } = input;
  const signal = input.heroImageUrl
    ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
      <tr>
        <td>
          <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">Your signal</p>
          <img src="${escHtml(input.heroImageUrl)}" alt="Launch signal" width="560" style="width:100%;max-width:560px;height:180px;object-fit:cover;display:block;border:0;" />
          <p style="margin:8px 0 0;font-size:11px;color:${MUTED};">We brand the product samples below to this direction.</p>
        </td>
      </tr>
    </table>`
    : '';

  return `
    ${signal}
    <p style="margin:0 0 14px;font-size:13px;color:#333;line-height:1.5;">Three <strong>product concept samples</strong> — website, ops portal, and member home — so you can show the system in a sit-down.</p>
    ${sampleBlock('landing', input)}
    ${sampleBlock('portal', input)}
    ${sampleBlock('member', input)}
  `;
}

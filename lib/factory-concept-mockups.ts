/**
 * Concept Pack product visuals — custom Apple-style PNG mockups (CID in email).
 */
import {
  renderAllAppleMockupPngs,
  type AppleMockupBrand,
} from '@/lib/factory-apple-mockup-images';

export type ConceptSampleKind = 'landing' | 'portal' | 'member';

export const CONCEPT_CUSTOM_CONTENT_IDS: Record<ConceptSampleKind, string> = {
  landing: 'concept-custom-landing',
  portal: 'concept-custom-portal',
  member: 'concept-custom-member',
};

const SAMPLE_META: Record<
  ConceptSampleKind,
  { eyebrow: string; role: string; blurb: string }
> = {
  landing: {
    eyebrow: '1 · Website / landing',
    role: 'public face',
    blurb: 'Custom concept for this client — Apple-simple, conversion-first.',
  },
  portal: {
    eyebrow: '2 · Client / ops portal',
    role: 'where you run the system',
    blurb: 'Custom ops home for today’s work, people, events, and money.',
  },
  member: {
    eyebrow: '3 · Member home',
    role: 'where their people live',
    blurb: 'Custom member home for journey, schedule, and belonging.',
  },
};

export async function generateCustomConceptInlineImages(brand: AppleMockupBrand): Promise<
  Array<{
    kind: ConceptSampleKind;
    filename: string;
    contentBase64: string;
    contentId: string;
    mimeType: string;
  }>
> {
  const pngs = await renderAllAppleMockupPngs(brand);
  return [
    {
      kind: 'landing',
      filename: `concept-landing-${brand.clientName.slice(0, 24)}.png`,
      contentBase64: pngs.landing.toString('base64'),
      contentId: CONCEPT_CUSTOM_CONTENT_IDS.landing,
      mimeType: 'image/png',
    },
    {
      kind: 'portal',
      filename: `concept-portal-${brand.clientName.slice(0, 24)}.png`,
      contentBase64: pngs.portal.toString('base64'),
      contentId: CONCEPT_CUSTOM_CONTENT_IDS.portal,
      mimeType: 'image/png',
    },
    {
      kind: 'member',
      filename: `concept-member-${brand.clientName.slice(0, 24)}.png`,
      contentBase64: pngs.member.toString('base64'),
      contentId: CONCEPT_CUSTOM_CONTENT_IDS.member,
      mimeType: 'image/png',
    },
  ];
}

export type ConceptSampleRenderInput = {
  clientName: string;
  heroImageUrl?: string;
  useCid?: boolean;
  escHtml: (s: string) => string;
};

function sampleSrc(kind: ConceptSampleKind, useCid?: boolean): string {
  if (useCid) return `cid:${CONCEPT_CUSTOM_CONTENT_IDS[kind]}`;
  // Preview fallback — email path always uses CID after generate.
  return `cid:${CONCEPT_CUSTOM_CONTENT_IDS[kind]}`;
}

function sampleBlock(kind: ConceptSampleKind, input: ConceptSampleRenderInput): string {
  const meta = SAMPLE_META[kind];
  const { escHtml, clientName } = input;
  const src = escHtml(sampleSrc(kind, input.useCid));

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;border:1px solid #e5e5e5;background:#fff;">
    <tr>
      <td style="padding:14px 16px;background:#f5f5f7;">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6e6e73;">${escHtml(meta.eyebrow)}</p>
        <p style="margin:6px 0 0;font-size:16px;font-weight:800;color:#1d1d1f;">${escHtml(clientName)} — ${escHtml(meta.role)}</p>
        <p style="margin:6px 0 0;font-size:12px;color:#6e6e73;line-height:1.45;">${escHtml(meta.blurb)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0;background:#f5f5f7;">
        <img src="${src}" alt="${escHtml(clientName)} ${escHtml(meta.role)} concept" width="560" style="width:100%;max-width:560px;height:auto;display:block;border:0;" />
      </td>
    </tr>
    <tr>
      <td style="padding:10px 14px;background:#fff;">
        <p style="margin:0;font-size:11px;color:#86868b;line-height:1.45;">Custom concept mockup for sit-down discussion — not a finished production build.</p>
      </td>
    </tr>
  </table>`;
}

export function renderConceptSampleMockups(input: ConceptSampleRenderInput): string {
  const { escHtml } = input;
  const signal = input.heroImageUrl
    ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
      <tr>
        <td>
          <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6e6e73;">Your signal</p>
          <img src="${escHtml(input.heroImageUrl)}" alt="Launch signal" width="560" style="width:100%;max-width:560px;height:160px;object-fit:cover;display:block;border:0;border-radius:12px;" />
        </td>
      </tr>
    </table>`
    : '';

  return `
    ${signal}
    <p style="margin:0 0 14px;font-size:13px;color:#333;line-height:1.5;">Three <strong>custom product concepts</strong> generated for this client — website, ops portal, and member home.</p>
    ${sampleBlock('landing', input)}
    ${sampleBlock('portal', input)}
    ${sampleBlock('member', input)}
  `;
}

/** @deprecated Coalition static samples — kept only so old imports do not break. */
export async function loadConceptSampleInlineImages(): Promise<
  Array<{
    kind: ConceptSampleKind;
    filename: string;
    contentBase64: string;
    contentId: string;
    mimeType: string;
  }>
> {
  return [];
}

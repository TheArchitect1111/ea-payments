/**
 * Map ContentPackage + concept fields → care-continuum OrganizationStoryInput extensions.
 * Uses verified/inferred claims only — never creative-direction language.
 */
import type { ContentPackage } from '@/lib/factory-content-package';
import { scrubForbiddenPublicCopy } from '@/lib/factory-forbidden-copy.mjs';
import type { OrganizationStoryInput } from '@/lib/website-director';
import { CARE_CONTINUUM_MEDIA_POOL } from '@/lib/layout-composer/grammars/care-continuum-editorial';

function scrub(value: string | undefined): string | undefined {
  return scrubForbiddenPublicCopy(value);
}

function parseRoleAndOrg(detail: string | undefined): { role?: string; org?: string } {
  const text = scrub(detail) || '';
  const at = text.match(/^(.+?)\s+at\s+(.+)$/i);
  if (at) return { role: at[1]!.trim(), org: at[2]!.trim() };
  const withOrg = text.match(/^(.+?)\s+with\s+(.+)$/i);
  if (withOrg) return { role: withOrg[1]!.trim(), org: withOrg[2]!.trim() };
  if (/liaison|nurse|clinician|coordinator|hospice|home\s*health/i.test(text)) {
    return { role: text };
  }
  return {};
}

function extractPhone(claims: ContentPackage['claims'], sources: ContentPackage['sources']): string | undefined {
  const blob = [...claims.map((c) => c.text), ...sources.map((s) => s.label || '')].join(' ');
  const m = blob.match(/1[-.\s]?\(?800\)?[-.\s]?\d{3}[-.\s]?\d{4}|\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return m?.[0]?.replace(/\s+/g, '-');
}

function extractPathways(
  pack: ContentPackage,
): Array<{ title: string; body: string }> {
  const fromWork = (pack.currentWork || [])
    .map((text) => scrub(text))
    .filter(Boolean)
    .slice(0, 3)
    .map((text) => {
      const parts = String(text).split(/[:—–]/);
      if (parts.length >= 2) {
        return { title: parts[0]!.trim().slice(0, 48), body: parts.slice(1).join('—').trim() };
      }
      return { title: String(text).slice(0, 40), body: String(text) };
    });
  if (fromWork.length >= 3) return fromWork;

  const serviceClaims = (pack.claims || [])
    .map((c) => ({ text: scrub(c.text) || '', url: c.sourceUrl }))
    .filter((c) =>
      /home\s*health|hospice|therapy|nursing|veteran|pediatric|after[- ]?hours|palliative|aide/i.test(
        c.text,
      ),
    )
    .slice(0, 3)
    .map((c) => {
      const titleMatch = c.text.match(
        /\b(home\s*health(?:\s*care)?|hospice(?:\s*care)?|after[- ]?hours|veterans?(?:\s*care)?|pediatric(?:\s*hospice)?|physical\s*therapy|occupational\s*therapy|speech\s*therapy)\b/i,
      );
      return {
        title: titleMatch?.[1] || c.text.slice(0, 36),
        body: c.text,
      };
    });

  const merged = [...fromWork, ...serviceClaims];
  return merged.slice(0, 3);
}

function extractGeography(pack: ContentPackage): {
  geography?: string;
  body?: string;
  accent?: string;
  caption?: string;
  address?: string;
} {
  const geoClaim = (pack.claims || []).find((c) =>
    /north\s*carolina|\bNC\b|county|goldsboro|region|since\s+\d{4}|headquarters|serves/i.test(
      c.text,
    ),
  );
  const since = (pack.milestones || []).find((m) => /since\s+\d{4}|founded|established/i.test(m));
  const text = scrub(geoClaim?.text);
  const addressMatch = text?.match(/\d{2,5}\s+[\w\s]+\b(?:Drive|Dr|Road|Rd|Street|St|Avenue|Ave)\b[^.]*/i);
  return {
    geography: text?.match(/Eastern\s+North\s+Carolina|North\s+Carolina|[\w\s]+County/i)?.[0],
    body: text,
    accent: scrub(since)?.match(/since\s+\d{4}|\d{4}/i)?.[0],
    caption: pack.organizations[0] ? scrub(pack.organizations[0]) : undefined,
    address: addressMatch?.[0]?.trim(),
  };
}

/**
 * Enrich OrganizationStoryInput with care-continuum fields derived from the research pack.
 */
export function enrichOrganizationWithCareContinuumFields(
  base: OrganizationStoryInput,
  pack: ContentPackage | null | undefined,
  options?: { distinguishingDetail?: string; heroImageUrl?: string; organizationUrl?: string },
): OrganizationStoryInput {
  if (!pack && !options?.distinguishingDetail) return base;

  const fromDetail = parseRoleAndOrg(options?.distinguishingDetail);
  const fromBio = parseRoleAndOrg(pack?.biography?.slice(0, 120));
  const role = fromDetail.role || fromBio.role || base.subjectRole;
  const affiliated =
    fromDetail.org ||
    fromBio.org ||
    scrub(pack?.organizations?.[0]) ||
    base.affiliatedOrganizationName;

  const phone = extractPhone(pack?.claims || [], pack?.sources || []);
  const pathways = extractPathways(
    pack ||
      ({
        claims: [],
        currentWork: [],
        accomplishments: [],
        milestones: [],
        organizations: [],
        sources: [],
      } as unknown as ContentPackage),
  );
  const geo = extractGeography(
    pack ||
      ({
        claims: [],
        milestones: [],
        organizations: [],
      } as unknown as ContentPackage),
  );

  const orgUrl =
    scrub(options?.organizationUrl) ||
    scrub(pack?.sources?.find((s) => s.url)?.url) ||
    base.organizationUrl;

  // Temporary Preview media is environmental unless a verified/licensed subject portrait exists.
  const subjectPortraitVerified = Boolean(base.subjectPortraitVerified);

  return {
    ...base,
    subjectRole: role,
    affiliatedOrganizationName: affiliated,
    biographyPublic: scrub(pack?.biography) || base.biographyPublic,
    roleExplainer: scrub(pack?.claims?.find((c) => /liaison|educat|pathway|coordinat/i.test(c.text))?.text),
    roleAttributionNote:
      affiliated && affiliated !== base.organizationName
        ? `Organizational capabilities attributed to ${affiliated}, not as personal accomplishments.`
        : base.roleAttributionNote,
    carePathways: pathways.length ? pathways : base.carePathways,
    pathwaysIntro: base.pathwaysIntro,
    serviceGeography: geo.geography || base.serviceGeography,
    serviceGeographyBody: geo.body || base.serviceGeographyBody,
    geographyAccent: geo.accent || base.geographyAccent,
    geographyCaption: geo.caption || base.geographyCaption,
    footerAddress: geo.address || base.footerAddress,
    contactPhone: phone || base.contactPhone,
    contactPhoneHref: phone
      ? `tel:+${phone.replace(/\D/g, '').replace(/^1?/, '1')}`
      : base.contactPhoneHref,
    organizationUrl: orgUrl,
    industry: base.industry || (role || pathways.length ? 'Home health and hospice care' : base.industry),
    primaryColor: base.primaryColor || '#1B3A4B',
    accentColor: base.accentColor || '#7BA3A8',
    subjectPortraitVerified,
    mediaSlots: {
      hero: {
        url: CARE_CONTINUUM_MEDIA_POOL.hero,
        focal: 'environment',
      },
      clinician: { url: CARE_CONTINUUM_MEDIA_POOL.clinician, focal: 'environment' },
      homeCare: { url: CARE_CONTINUUM_MEDIA_POOL.homeCare, focal: 'environment' },
      family: { url: CARE_CONTINUUM_MEDIA_POOL.family, focal: 'environment' },
      calm: { url: CARE_CONTINUUM_MEDIA_POOL.calm, focal: 'environment' },
      ...base.mediaSlots,
      ...(subjectPortraitVerified && (scrub(options?.heroImageUrl) || scrub(base.heroImageUrl))
        ? {
            hero: {
              url: (scrub(options?.heroImageUrl) || scrub(base.heroImageUrl))!,
              focal: 'face-right' as const,
            },
          }
        : {}),
    },
  };
}

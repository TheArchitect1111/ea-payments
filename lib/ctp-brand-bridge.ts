import { getBrandProfile, saveBrandProfile } from '@/lib/creative-studio/brand-store';
import type { BrandProfile } from '@/lib/creative-studio/types';
import type { CtpAssetManifest, CtpAssetManifestEntry } from '@/lib/ctp-asset-store';
import type { CtpSubmission } from '@/lib/ctp-submissions';

function appBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;
  return 'https://ea-payments.vercel.app';
}

export function absoluteCtpAssetUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = appBaseUrl();
  return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

export function pickCtpLogoEntry(manifest?: CtpAssetManifest): CtpAssetManifestEntry | undefined {
  if (!manifest) return undefined;
  return manifest.logo ?? Object.values(manifest).find((entry) => entry.assetType === 'logo');
}

/** Discovery `brand_feel` choice IDs → Creative Studio palette. */
const BRAND_FEEL_PALETTES: Record<string, { primaryColor: string; secondaryColor: string }> = {
  warm: { primaryColor: '#5C3D2E', secondaryColor: '#D4A373' },
  premium: { primaryColor: '#1B2B4D', secondaryColor: '#C9A844' },
  energetic: { primaryColor: '#9B2226', secondaryColor: '#EE9B00' },
  calm: { primaryColor: '#2F4858', secondaryColor: '#86BBD8' },
  trustworthy: { primaryColor: '#1B3A4B', secondaryColor: '#5C8A9E' },
  bold: { primaryColor: '#111111', secondaryColor: '#E63946' },
  'community-centered': { primaryColor: '#2D6A4F', secondaryColor: '#95D5B2' },
};

export function mapBrandFeelToColors(
  feels: string[],
): { primaryColor: string; secondaryColor: string } | null {
  for (const feel of feels) {
    const key = String(feel).trim().toLowerCase();
    if (BRAND_FEEL_PALETTES[key]) return BRAND_FEEL_PALETTES[key];
  }
  return null;
}

function readBrandFeels(submission: CtpSubmission): string[] {
  const raw = submission.discoveryAnswers?.brand_feel;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
  return [];
}

/**
 * Sync CTP discovery brand into Creative Studio.
 * Logo is optional — brand-feel colors still apply when logo is missing.
 */
export async function applyCtpBrandFromSubmission(
  submission: CtpSubmission,
  organizationId: string,
): Promise<BrandProfile | null> {
  const logoEntry = pickCtpLogoEntry(submission.assetManifest);
  const colors = mapBrandFeelToColors(readBrandFeels(submission));

  if (!logoEntry?.url && !colors) return null;

  const brand = await getBrandProfile(organizationId);
  const updated = await saveBrandProfile({
    ...brand,
    organizationId,
    organizationName: submission.businessName.trim() || brand.organizationName,
    ...(logoEntry?.url ? { logoUrl: absoluteCtpAssetUrl(logoEntry.url) } : {}),
    ...(colors
      ? { primaryColor: colors.primaryColor, secondaryColor: colors.secondaryColor }
      : {}),
  });

  return updated;
}

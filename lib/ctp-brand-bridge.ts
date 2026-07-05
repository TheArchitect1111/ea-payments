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

export async function applyCtpBrandFromSubmission(
  submission: CtpSubmission,
  organizationId: string,
): Promise<BrandProfile | null> {
  const logoEntry = pickCtpLogoEntry(submission.assetManifest);
  if (!logoEntry?.url) return null;

  const brand = await getBrandProfile(organizationId);
  const updated = await saveBrandProfile({
    ...brand,
    organizationId,
    organizationName: submission.businessName.trim() || brand.organizationName,
    logoUrl: absoluteCtpAssetUrl(logoEntry.url),
  });

  return updated;
}

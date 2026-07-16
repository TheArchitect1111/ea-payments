/**
 * Creative Profile persistence — merges Creative Studio brand + CTP Design Studio inputs.
 */

import { getBrandProfile } from '@/lib/creative-studio/brand-store';
import type { CtpDesignStudioField } from '@/lib/ctp-design-studio';
import type { BrandProfile } from '@/lib/creative-studio/types';
import { inferIndustryVertical } from './industry-library';
import type { CreativeProfile, StorySentence } from './types';

export function creativeProfileFromBrand(
  organizationId: string,
  brand: BrandProfile,
  story?: StorySentence,
): CreativeProfile {
  const vertical = inferIndustryVertical(brand.organizationName);
  return {
    organizationId,
    organizationName: brand.organizationName,
    industryVertical: vertical,
    story: story ?? {
      sentence: brand.missionStatement ?? '',
      source: brand.missionStatement ? 'client-input' : undefined,
    },
    mission: brand.missionStatement ?? '',
    audience: brand.audience ?? '',
    differentiators: brand.preferredHeadlines ?? [],
    photographyStyle: brand.photographyStyle,
    typography: brand.typography,
    colorPalette: {
      primary: brand.primaryColor,
      secondary: brand.secondaryColor,
    },
    portalStyle: brand.voice,
    updatedAt: brand.updatedAt ?? new Date().toISOString(),
  };
}

export async function loadCreativeProfile(organizationId: string): Promise<CreativeProfile | null> {
  const brand = await getBrandProfile(organizationId);
  if (!brand) return null;
  return creativeProfileFromBrand(organizationId, brand);
}

export function mergeDesignStudioIntoProfile(
  profile: CreativeProfile,
  studio: Partial<Record<CtpDesignStudioField, string>>,
): CreativeProfile {
  return {
    ...profile,
    story: studio.offer_summary
      ? { sentence: studio.offer_summary, source: 'client-input', validatedAt: new Date().toISOString() }
      : profile.story,
    typography: studio.brand_fonts ?? profile.typography,
    photographyStyle: studio.inspiration ?? profile.photographyStyle,
    colorPalette: studio.brand_colors
      ? parseColorPalette(studio.brand_colors) ?? profile.colorPalette
      : profile.colorPalette,
    portalStyle: studio.brand_voice ?? profile.portalStyle,
    differentiators: studio.competitors
      ? studio.competitors.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
      : profile.differentiators,
    updatedAt: new Date().toISOString(),
  };
}

function parseColorPalette(raw: string): CreativeProfile['colorPalette'] | null {
  const parts = raw.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  return {
    primary: parts[0],
    secondary: parts[1] ?? parts[0],
    accent: parts[2],
  };
}

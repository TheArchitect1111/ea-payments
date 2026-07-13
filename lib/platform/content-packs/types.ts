import type { LandingPageConfig } from '@/lib/landing-chassis/types';

export type VerticalContentPackId =
  | 'cpr-athletics'
  | 'etfm-coaching'
  | '3hc-readiness'
  | 'bob-rumball-learning'
  | 'ea-platform';

export type ContentPackContext = {
  brandName: string;
  workspaceName: string;
  portalSlug: string;
  members: string;
  logo: string;
};

export type VerticalContentPack = {
  id: VerticalContentPackId;
  platformClientId: string;
  vertical: string;
  label: string;
  summary: string;
  /** Apply vertical copy onto a base LandingPageConfig (keeps theme colors). */
  apply: (base: LandingPageConfig, ctx: ContentPackContext) => LandingPageConfig;
};

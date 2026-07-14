/** Coarse CRM package enum written to Airtable Package Purchased. */
export type AirtablePackageName =
  | 'Capacity Assessment'
  | 'Capacity Blueprint'
  | 'Implementation Package'
  | 'Simplifi'
  | 'Launch Verification';

export type CommerceOfferKind = 'one_time' | 'subscription';

export type CommerceInterval = 'month' | 'year';

export type PortalPlatform =
  | 'efficiency-architects'
  | 'cpr'
  | 'brotherhub'
  | 'sisterhub'
  | 'partner';

export type PortalConfig = {
  platform: PortalPlatform;
  loginPath: string;
};

export type FulfillmentType =
  | 'landing-page'
  | 'client-portal'
  | 'website-portal-auto'
  | 'connect-profile'
  | 'assessment'
  | 'blueprint'
  | 'implementation'
  | 'simplifi'
  | 'launch-verification';

/** Union of one-time PackageId + subscription plan ids. */
export type CommerceOfferId =
  | 'launch_verification'
  | 'connect_profile'
  | 'landing_page'
  | 'client_portal'
  | 'website_portal_starter'
  | 'simplifi_early_access'
  | 'capacity_assessment'
  | 'capacity_blueprint'
  | 'implementation_starter'
  | 'implementation_professional'
  | 'implementation_premium'
  | 'implementation_enterprise'
  | 'simplifi_monthly'
  | 'simplifi_annual'
  | 'platform_monthly'
  | 'platform_annual';

/** Canonical commerce offer ? single source for entitlements + checkout metadata. */
export type CommerceOffer = {
  id: CommerceOfferId;
  kind: CommerceOfferKind;
  name: string;
  displayName: string;
  description: string;
  priceCents: number;
  stripePriceEnvKey: string;
  allowInlineStripePrice?: boolean;
  airtablePackageName: AirtablePackageName;
  /** Module ids granted when this offer is the entitlement source. */
  moduleIds: string[];
  interval?: CommerceInterval;
  trialDays?: number;
  portalConfig?: PortalConfig;
  fulfillmentType?: FulfillmentType;
  fulfillmentLabel?: string;
  reviewRequired?: boolean;
  intakePath?: string;
};

export type EntitlementSnapshot = {
  offerId: CommerceOfferId;
  kind: CommerceOfferKind;
  airtablePackageName: AirtablePackageName;
  displayName: string;
  moduleIds: string[];
  capabilityIds: string[];
  includesBilling: boolean;
  includesConnect: boolean;
};

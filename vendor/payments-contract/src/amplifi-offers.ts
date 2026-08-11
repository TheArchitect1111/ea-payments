import type { CommerceOffer } from './types';
import { AMPLIFI_COMPLETE_MODULES, AMPLIFI_SOCIAL_MODULES } from './presets';

const EA_PORTAL = {
  platform: 'efficiency-architects' as const,
  loginPath: '/portal/login',
};

/** Commercial Amplifi V1 plans. Smartchitecture add-ons are managed inside Amplifi billing. */
export const AMPLIFI_COMMERCE_OFFERS: CommerceOffer[] = [
  {
    id: 'amplifi_social',
    kind: 'subscription',
    name: 'Amplifi Social',
    displayName: 'Amplifi Social',
    description:
      'One brand, up to three social channels, AI-assisted social posts and graphics, content calendar, scheduling, approval controls, publishing, brand voice, and one active campaign.',
    interval: 'month',
    priceCents: 2900,
    stripePriceEnvKey: 'STRIPE_PRICE_AMPLIFI_SOCIAL',
    allowInlineStripePrice: true,
    airtablePackageName: 'Implementation Package',
    moduleIds: [...AMPLIFI_SOCIAL_MODULES],
    portalConfig: EA_PORTAL,
    fulfillmentType: 'amplifi',
    fulfillmentLabel: 'Provision Amplifi Social and begin brand onboarding.',
    reviewRequired: false,
    intakePath: '/amplifi/onboarding',
  },
  {
    id: 'amplifi_complete',
    kind: 'subscription',
    name: 'Amplifi Complete',
    displayName: 'Amplifi Complete',
    description:
      'Amplifi Social plus Smart Research, Content Engine, Campaign Architect, and Autopilot in one bundled plan.',
    interval: 'month',
    priceCents: 12900,
    stripePriceEnvKey: 'STRIPE_PRICE_AMPLIFI_COMPLETE',
    allowInlineStripePrice: true,
    airtablePackageName: 'Implementation Package',
    moduleIds: [...AMPLIFI_COMPLETE_MODULES],
    portalConfig: EA_PORTAL,
    fulfillmentType: 'amplifi',
    fulfillmentLabel: 'Provision Amplifi Complete and begin brand onboarding.',
    reviewRequired: false,
    intakePath: '/amplifi/onboarding',
  },
];

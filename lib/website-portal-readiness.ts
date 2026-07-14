/**
 * Readiness for automated Website + Portal Starter commerce.
 */
import { getCommerceOffer } from '@ea/payments-contract';
import { checkAirtableLaunchSchema } from '@/lib/airtable-schema-check';
import { airtableConfigured } from '@/lib/data/airtable-client';
import { magicLinkConfigured } from '@/lib/magic-link';

export type WebsitePortalReadiness = {
  ready: boolean;
  airtableConfigured: boolean;
  creativeStudioSchemaOk: boolean;
  offerPresent: boolean;
  offerPurchasable: boolean;
  magicLinkConfigured: boolean;
  buyPath: string;
  blockers: string[];
};

export async function getWebsitePortalReadiness(): Promise<WebsitePortalReadiness> {
  const offer = getCommerceOffer('website_portal_starter');
  const offerPresent = Boolean(offer);
  const offerPurchasable = Boolean(
    offer &&
      ((offer.allowInlineStripePrice && offer.priceCents > 0) ||
        Boolean(process.env[offer.stripePriceEnvKey]?.trim())),
  );
  const airtableOk = airtableConfigured();
  const magicOk = magicLinkConfigured();

  let creativeStudioSchemaOk = false;
  if (airtableOk) {
    try {
      const schema = await checkAirtableLaunchSchema();
      creativeStudioSchemaOk = schema.creativeStudio.ok;
    } catch {
      creativeStudioSchemaOk = false;
    }
  }

  const blockers: string[] = [];
  if (!offerPresent) blockers.push('website_portal_starter offer missing from payments contract');
  if (!offerPurchasable) blockers.push('Starter offer is not purchasable (price / Stripe Price ID)');
  if (!airtableOk) blockers.push('Airtable not configured (AIRTABLE_API_KEY + base)');
  if (airtableOk && !creativeStudioSchemaOk) {
    blockers.push('Creative Studio table schema incomplete — run /api/health/setup-schema');
  }
  if (!magicOk) blockers.push('Magic link not configured (ADMIN_SESSION_SECRET)');

  return {
    ready: blockers.length === 0,
    airtableConfigured: airtableOk,
    creativeStudioSchemaOk,
    offerPresent,
    offerPurchasable,
    magicLinkConfigured: magicOk,
    buyPath: '/buy',
    blockers,
  };
}

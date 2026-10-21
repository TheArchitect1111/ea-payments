import { moduleIdsToCapabilityIds } from '@ea/capability-registry';
import { COMMERCE_OFFERS } from './offers';
import { AIRTABLE_PACKAGE_MODULES } from './presets';

export function validateOffersIntegrity(): {
  ok: boolean;
  errors: string[];
  offerCount: number;
  oneTimeCount: number;
  subscriptionCount: number;
} {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const offer of COMMERCE_OFFERS) {
    if (seen.has(offer.id)) errors.push(`Duplicate offer id: ${offer.id}`);
    seen.add(offer.id);

    if (!offer.moduleIds.length) {
      errors.push(`Offer ${offer.id} has empty moduleIds`);
    }
    if (!offer.stripePriceEnvKey) {
      errors.push(`Offer ${offer.id} missing stripePriceEnvKey`);
    }
    if (!AIRTABLE_PACKAGE_MODULES[offer.airtablePackageName]) {
      errors.push(`Offer ${offer.id} unknown airtable package ${offer.airtablePackageName}`);
    }

    try {
      moduleIdsToCapabilityIds(offer.moduleIds);
    } catch (err) {
      errors.push(`Offer ${offer.id} capability map failed: ${String(err)}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    offerCount: COMMERCE_OFFERS.length,
    oneTimeCount: COMMERCE_OFFERS.filter((o) => o.kind === 'one_time').length,
    subscriptionCount: COMMERCE_OFFERS.filter((o) => o.kind === 'subscription').length,
  };
}

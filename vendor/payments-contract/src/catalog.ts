import type { CommerceOffer } from './types';
import { COMMERCE_OFFERS as BASE_COMMERCE_OFFERS } from './offers';
import { AMPLIFI_COMMERCE_OFFERS } from './amplifi-offers';

/** Canonical combined offer list used by checkout, entitlements, and webhooks. */
export const COMMERCE_OFFERS: CommerceOffer[] = [
  ...BASE_COMMERCE_OFFERS,
  ...AMPLIFI_COMMERCE_OFFERS,
];

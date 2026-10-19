import { AIRTABLE_BASE_ID } from '@/lib/data/airtable-client';
import { tarrisPrices } from './prices';
/** Placeholder only: production booking requires a provisioned client account. */
export const tarrisJaneConfig = {
  id: 'tarris',
  janeUrl: process.env.TARRIS_JANE_URL || 'https://tarris.janeapp.com/',
  prices: tarrisPrices,
  catalogSource: AIRTABLE_BASE_ID,
  note: 'CONTRACT ONLY — Jane placeholder — replace with real client Jane URL before production launch',
} as const;

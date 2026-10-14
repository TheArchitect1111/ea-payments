/** Placeholder only: production booking requires a provisioned client account. */
export const tarrisJaneConfig = {
  id: 'tarris',
  janeUrl: process.env.TARRIS_JANE_URL || 'https://tarris.janeapp.com/',
  prices: { tb3: 24900 },
  catalogSource: process.env.TARRIS_AIRTABLE_BASE_ID || 'contract-tarris-12-5',
  note: 'CONTRACT ONLY — Jane placeholder — replace with real client Jane URL before production launch',
} as const;

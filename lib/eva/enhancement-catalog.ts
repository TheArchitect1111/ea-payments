export type EnhancementRecipe = {
  id: string;
  label: string;
  priceCents: number | null;
  autoExecutable: boolean;
  risk: 'low' | 'medium' | 'high';
  terms: string[];
};

export const ENHANCEMENT_CATALOG: EnhancementRecipe[] = [
  { id: 'new-section', label: 'Add a standard website section', priceCents: 9900, autoExecutable: true, risk: 'low', terms: ['new section', 'add section'] },
  { id: 'new-page', label: 'Add a standard website page', priceCents: 14900, autoExecutable: true, risk: 'low', terms: ['new page', 'add page', 'create page'] },
  { id: 'form-change', label: 'Modify an existing form or workflow', priceCents: 14900, autoExecutable: true, risk: 'medium', terms: ['change form', 'modify form', 'update form', 'change workflow'] },
  { id: 'new-form', label: 'Add a standard form or workflow', priceCents: 24900, autoExecutable: true, risk: 'medium', terms: ['new form', 'add form', 'new workflow', 'add workflow'] },
  { id: 'checkout-change', label: 'Modify checkout or payment configuration', priceCents: 24900, autoExecutable: false, risk: 'high', terms: ['checkout', 'payment', 'stripe'] },
  { id: 'integration', label: 'Add or modify an integration', priceCents: 39900, autoExecutable: false, risk: 'high', terms: ['integration', 'connect to', 'api'] },
  { id: 'portal-feature', label: 'Add a standard portal feature', priceCents: 39900, autoExecutable: false, risk: 'high', terms: ['portal feature', 'portal function'] },
  { id: 'major-redesign', label: 'Major redesign or custom functionality', priceCents: null, autoExecutable: false, risk: 'high', terms: ['redesign', 'custom functionality', 'custom feature'] },
];

export function findEnhancementRecipe(request: string) {
  const text = request.toLowerCase();
  return ENHANCEMENT_CATALOG.find((recipe) => recipe.terms.some((term) => text.includes(term)));
}

export function formatEnhancementPrice(priceCents: number | null) {
  if (priceCents === null) return 'EA review required';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(priceCents / 100);
}

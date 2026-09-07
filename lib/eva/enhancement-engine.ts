import { findEnhancementRecipe, formatEnhancementPrice } from './enhancement-catalog';

export type EnhancementDecision = {
  kind: 'included' | 'paid' | 'review';
  recipeId?: string;
  title: string;
  clientMessage: string;
  priceCents?: number;
  priceLabel?: string;
  autoExecutable: boolean;
  requiresPayment: boolean;
};

const PROTECTED_TERMS = ['domain', 'dns', 'security', 'login', 'password', 'authentication', 'delete page', 'delete site', 'custom code'];

export function classifyEnhancement(request: string): EnhancementDecision {
  const text = request.trim().toLowerCase();
  const protectedHit = PROTECTED_TERMS.some((term) => text.includes(term));
  const recipe = findEnhancementRecipe(request);

  if (protectedHit || (recipe && recipe.priceCents === null)) {
    return {
      kind: 'review',
      recipeId: recipe?.id,
      title: 'EA review required',
      clientMessage: 'This request goes beyond the website updates included with your portal and needs a custom review. Your current website will remain unchanged while we review the request and prepare the scope.',
      autoExecutable: false,
      requiresPayment: false,
    };
  }

  if (recipe && recipe.priceCents !== null) {
    return {
      kind: 'paid',
      recipeId: recipe.id,
      title: recipe.label,
      clientMessage: `This enhancement goes beyond the website updates included with your portal. We can complete it for ${formatEnhancementPrice(recipe.priceCents)}. Nothing will be changed or charged unless you approve.`,
      priceCents: recipe.priceCents,
      priceLabel: formatEnhancementPrice(recipe.priceCents),
      autoExecutable: recipe.autoExecutable,
      requiresPayment: true,
    };
  }

  return {
    kind: 'included',
    title: 'Included website update',
    clientMessage: 'This request is covered by your portal update privileges. Eva can prepare it as a draft for your approval.',
    autoExecutable: true,
    requiresPayment: false,
  };
}

export type ExecutionGateInput = {
  paymentConfirmed: boolean;
  requiredInputsPresent: boolean;
  snapshotCreated: boolean;
  stagingSucceeded: boolean;
  functionalQaPassed: boolean;
  visualQaPassed: boolean;
  protectedInfrastructureUntouched: boolean;
  rollbackPointCreated: boolean;
};

export function canAutoPublish(input: ExecutionGateInput) {
  const gates = [
    ['paymentConfirmed', input.paymentConfirmed],
    ['requiredInputsPresent', input.requiredInputsPresent],
    ['snapshotCreated', input.snapshotCreated],
    ['stagingSucceeded', input.stagingSucceeded],
    ['functionalQaPassed', input.functionalQaPassed],
    ['visualQaPassed', input.visualQaPassed],
    ['protectedInfrastructureUntouched', input.protectedInfrastructureUntouched],
    ['rollbackPointCreated', input.rollbackPointCreated],
  ] as const;
  const failed = gates.filter(([, passed]) => !passed).map(([name]) => name);
  return { allowed: failed.length === 0, failed };
}

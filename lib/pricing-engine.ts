// lib/pricing-engine.ts
//
// Phase E pricing engine. Calculates a raw fee from scope inputs and
// maps it down to the nearest predefined psychological price tier.
// All numeric constants are marked CALIBRATE.

import type { ProjectType } from '@/lib/analysis-engine';
export type { ProjectType } from '@/lib/analysis-engine';

export interface ScopeInput {
  projectType: ProjectType;
  workflowCount: number;
  automationCount: number;
  integrationCount: number;
  dashboardRequired: boolean;
  portalRequired: boolean;
  userCount: number;
}

export interface PricingResult {
  projectType: ProjectType;
  projectTypeLabel: string;
  rawFee: number;
  recommendedFee: number;
}

// Base fee by project type. CALIBRATE: all values
const BASE_FEES: Record<ProjectType, number> = {
  workflow_optimization:    800,
  operational_systems:     2000,
  business_transformation: 5000,
  enterprise_solution:     8000,
};

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  workflow_optimization:   'Workflow Optimization',
  operational_systems:     'Operational Systems',
  business_transformation: 'Business Transformation',
  enterprise_solution:     'Enterprise Solution',
};

// Per-unit add-ons. CALIBRATE: all values
const PER_WORKFLOW    = 200;
const PER_AUTOMATION  = 200;
const PER_INTEGRATION = 200;
const DASHBOARD_FEE   = 600;
const PORTAL_FEE      = 600;
const PER_USER_ABOVE  = 5;    // CALIBRATE: user threshold before per-user billing starts
const PER_USER_RATE   = 30;   // CALIBRATE: dollars per user above threshold

// Predefined price tiers. Raw fee rounds DOWN to the largest tier that fits.
// Tiers end in 97 — a common consulting psychological price convention.
// CALIBRATE: add, remove, or change tiers to match actual pricing
const PRICE_TIERS = [
  1497, 2497, 3497, 4997, 6997,
  9997, 14997, 24997, 34997, 49997,
];

function roundToNearestTier(raw: number): number {
  let result = PRICE_TIERS[0];
  for (const tier of PRICE_TIERS) {
    if (tier <= raw) result = tier;
  }
  return result;
}

export function calculateFee(input: ScopeInput): PricingResult {
  const base = BASE_FEES[input.projectType];

  const addOns =
    input.workflowCount    * PER_WORKFLOW +
    input.automationCount  * PER_AUTOMATION +
    input.integrationCount * PER_INTEGRATION +
    (input.dashboardRequired ? DASHBOARD_FEE : 0) +
    (input.portalRequired    ? PORTAL_FEE    : 0) +
    Math.max(0, input.userCount - PER_USER_ABOVE) * PER_USER_RATE;

  const rawFee         = base + addOns;
  const recommendedFee = roundToNearestTier(rawFee);

  return {
    projectType:      input.projectType,
    projectTypeLabel: PROJECT_TYPE_LABELS[input.projectType],
    rawFee,
    recommendedFee,
  };
}

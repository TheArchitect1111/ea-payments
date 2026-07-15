/**
 * Decision Intelligence — quiet fallback queue until certified decision sources are online.
 */

export type DecisionHorizon = 'Immediate' | 'Today' | 'This Week' | 'Strategic';

export type DecisionIntelligenceItem = {
  id: string;
  title: string;
  reason: string;
  whyThisMatters?: string;
  recommendedAction: string;
  expectedOutcome?: string;
  confidence: 'High' | 'Medium' | 'Low';
  source: string;
  href?: string;
  sourceSystems: string[];
  relatedOrganizations: string[];
  relatedCapabilities: string[];
};

export type DecisionIntelligenceBundle = {
  generatedAt: string;
  dashboard: {
    highestPriorityDecision: string;
    why: string;
    ifIgnored: string;
    greatestBusinessValueAction: string;
    expectedOutcome: string;
    confidence: 'High' | 'Medium' | 'Low';
    source: string;
    lastUpdated: string;
  };
  queue: Record<DecisionHorizon, DecisionIntelligenceItem[]>;
  opportunities: unknown[];
  risks: unknown[];
  businessSignals: unknown[];
  recommendations: DecisionIntelligenceItem[];
  decisionHistory: unknown[];
  confidenceStandard: unknown[];
};

export async function getDecisionIntelligence(): Promise<DecisionIntelligenceBundle> {
  const generatedAt = new Date().toISOString();
  return {
    generatedAt,
    dashboard: {
      highestPriorityDecision: '',
      why: '',
      ifIgnored: '',
      greatestBusinessValueAction: '',
      expectedOutcome: '',
      confidence: 'Low',
      source: 'Decision Intelligence fallback',
      lastUpdated: generatedAt,
    },
    queue: {
      Immediate: [],
      Today: [],
      'This Week': [],
      Strategic: [],
    },
    opportunities: [],
    risks: [],
    businessSignals: [],
    recommendations: [],
    decisionHistory: [],
    confidenceStandard: [],
  };
}

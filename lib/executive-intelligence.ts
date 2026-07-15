/**
 * Executive Intelligence — quiet certified-fallback until Org360 sources are online.
 */

export type IntelligenceConfidence = 'High' | 'Medium' | 'Low';

export type IntelligenceProvenance = {
  source: string;
  confidence: IntelligenceConfidence;
  lastUpdated: string;
  supportingSystems: string[];
};

export type ExecutiveIntelligenceRecommendation = {
  id: string;
  title: string;
  reason: string;
  nextAction: string;
  horizon: string;
  confidence: IntelligenceConfidence;
  href?: string;
  provenance: IntelligenceProvenance;
};

export type ExecutiveIntelligenceBundle = {
  generatedAt: string;
  summary: {
    businessHealth: string;
    businessHealthDetail: string;
    executiveConfidence: IntelligenceConfidence;
    topOpportunity: string;
    topRisk: string;
    mostImportantRecommendation: string;
    provenance: IntelligenceProvenance;
  };
  opportunities: unknown[];
  risks: unknown[];
  trends: unknown[];
  recommendations: ExecutiveIntelligenceRecommendation[];
  questions: unknown[];
  decisionSupport: Record<'Immediate' | 'Today' | 'This Week' | 'Strategic', unknown[]>;
  changes: unknown[];
};

export async function getExecutiveIntelligence(): Promise<ExecutiveIntelligenceBundle> {
  const generatedAt = new Date().toISOString();
  return {
    generatedAt,
    summary: {
      businessHealth: 'Not currently determinable.',
      businessHealthDetail:
        'Executive Intelligence is temporarily unavailable from certified sources.',
      executiveConfidence: 'Low',
      topOpportunity: 'Not currently determinable.',
      topRisk: 'No critical risk currently evidenced.',
      mostImportantRecommendation: '',
      provenance: {
        source: 'Executive Intelligence fallback',
        confidence: 'Low',
        lastUpdated: generatedAt,
        supportingSystems: [],
      },
    },
    opportunities: [],
    risks: [],
    trends: [],
    recommendations: [],
    questions: [],
    decisionSupport: {
      Immediate: [],
      Today: [],
      'This Week': [],
      Strategic: [],
    },
    changes: [],
  };
}

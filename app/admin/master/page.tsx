import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import { buildMissionControlPayload } from '@/lib/mission-control-data';
import { getExecutiveOperatingRhythm } from '@/lib/executive-operating-rhythm';
import {
  getExecutiveIntelligence,
  type ExecutiveIntelligenceBundle,
} from '@/lib/executive-intelligence';
import {
  getDecisionIntelligence,
  type DecisionIntelligenceBundle,
} from '@/lib/executive-decision-intelligence';
import { ExecutiveShellPhaseOne } from './ExecutiveShellPhaseOne';

export const dynamic = 'force-dynamic';

/** Quiet fallback when EI cannot load (e.g. Org360 schema). Compose-only — no new intelligence. */
function emptyIntelligence(): ExecutiveIntelligenceBundle {
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
        source: 'Executive Home fallback',
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

/** Quiet fallback when DI cannot load. Queue falls back to Mission Control cards in the shell. */
function emptyDecisions(): DecisionIntelligenceBundle {
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
      source: 'Executive Home fallback',
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

export default async function MasterPortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    redirectToAdminLogin('/admin/master');
  }

  const [mission, rhythm, intelligenceResult, decisionsResult] = await Promise.all([
    buildMissionControlPayload({ role: 'executive', userName: 'Freedom' }),
    getExecutiveOperatingRhythm(),
    getExecutiveIntelligence().then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const, value: emptyIntelligence() }),
    ),
    getDecisionIntelligence().then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const, value: emptyDecisions() }),
    ),
  ]);

  const intelligence = intelligenceResult.value;
  const decisions = decisionsResult.value;
  const lastUpdated = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
      <ExecutiveShellPhaseOne
        mission={mission}
        rhythm={rhythm}
        intelligence={intelligence}
        decisions={decisions}
        lastUpdated={lastUpdated}
      />
    </main>
  );
}

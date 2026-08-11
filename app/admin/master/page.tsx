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
import { MasterCommandCenterLight } from './MasterCommandCenterLight';
import WebsitePortalOpsPanel from './WebsitePortalOpsPanel';

export const dynamic = 'force-dynamic';

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
    <main className="min-h-screen bg-[#F6F4EF] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <MasterCommandCenterLight
          mission={mission}
          rhythm={rhythm}
          intelligence={intelligence}
          decisions={decisions}
          lastUpdated={lastUpdated}
        />
        <section className="mt-8 rounded-[24px] border border-[#E8E4DB] bg-white p-5 shadow-[0_14px_40px_rgba(50,45,35,0.05)] sm:p-6">
          <WebsitePortalOpsPanel />
        </section>
      </div>
    </main>
  );
}

import { CANONICAL_PROJECT_REGISTRY, type CanonicalProjectRecord } from '@/lib/canonical-project-registry';

export type OperationsHealth = 'healthy' | 'attention' | 'action-required';
export type LiveCheck = 'online' | 'offline' | 'not-applicable' | 'unverified';

export type OperationsRecord = {
  id: string;
  name: string;
  kind: CanonicalProjectRecord['kind'];
  health: OperationsHealth;
  liveCheck: LiveCheck;
  liveStatusCode: number | null;
  website: string | null;
  portal: string | null;
  githubRepo: string | null;
  vercelProjects: string[];
  unresolved: string[];
  monitoring: string;
  controlPlane: string;
  nextAction: string | null;
};

const CONTROL_PLANE: Record<string, { state: 'resolved' | 'partial' | 'ambiguous'; note: string }> = {
  AMANDA: { state: 'resolved', note: 'Canonical ownership locked in Run 5.' },
  'EA-PLATFORM': { state: 'resolved', note: 'Canonical shared production platform.' },
  AMPLIFI: { state: 'resolved', note: 'Canonical production route is ea-payments /amplifi.' },
  CPR: { state: 'resolved', note: 'Canonical repo cpr-site and Vercel cpr-site.' },
  NSP: { state: 'resolved', note: 'Canonical repo and Vercel target verified.' },
  ETFM: { state: 'partial', note: 'Assessment deployment verified; broader product ownership remains to be reconciled.' },
  SIMPLIFI: { state: 'partial', note: 'Shared ea-payments route is current working ownership; legacy repo preserved.' },
  MAGNIFI: { state: 'partial', note: 'Vercel target verified; source repo ownership unresolved.' },
  'EA-TRAIN': { state: 'partial', note: 'Vercel target verified; source repo ownership unresolved.' },
  'EA-COMMS': { state: 'partial', note: 'Vercel target verified; source repo ownership unresolved.' },
  'EA-BBALL': { state: 'partial', note: 'Product folder verified; canonical deployment ownership not fully proven.' },
  MAGIC: { state: 'partial', note: 'Client folder verified; production mapping requires final reconciliation.' },
  GSA: { state: 'resolved', note: 'BrotherHub repo and Vercel deployment verified.' },
  RUMBALL: { state: 'partial', note: 'Client folder verified; experience-lab deployment is not yet canonical production ownership.' },
  'EA-IP': { state: 'resolved', note: 'Canonical IP and platform knowledge vault; intentionally not deployed.' },
  'EA-EXEC': { state: 'ambiguous', note: 'Executive OS relationship to current deployment remains unresolved.' },
  MBI: { state: 'partial', note: 'Product source exists in ea-payments; canonical route remains unresolved.' },
};

const GUARDED_IDS = new Set(['AMANDA', 'EA-PLATFORM']);

async function checkUrl(url: string | null): Promise<{ state: LiveCheck; status: number | null }> {
  if (!url) return { state: 'not-applicable', status: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'user-agent': 'EA-Operations-Command-Center/1.0' },
    });
    return { state: response.ok ? 'online' : 'offline', status: response.status };
  } catch {
    return { state: 'offline', status: null };
  } finally {
    clearTimeout(timer);
  }
}

function ownershipFor(project: CanonicalProjectRecord) {
  return CONTROL_PLANE[project.id] ?? {
    state: project.status === 'active' || project.status === 'repository-only' ? ('resolved' as const) : ('partial' as const),
    note: project.status === 'active' ? 'Canonical registry verified.' : 'Requires Control Plane reconciliation.',
  };
}

function classify(project: CanonicalProjectRecord, live: LiveCheck, ownership: ReturnType<typeof ownershipFor>): OperationsHealth {
  if (live === 'offline') return 'action-required';
  if (ownership.state === 'ambiguous') return 'action-required';
  if (ownership.state === 'partial' || project.status === 'attention' || project.missing.length > 0) return 'attention';
  return 'healthy';
}

export async function getOperationsCommandCenter(): Promise<OperationsRecord[]> {
  const checks = await Promise.all(CANONICAL_PROJECT_REGISTRY.map((project) => checkUrl(project.officialWebsite)));

  return CANONICAL_PROJECT_REGISTRY.map((project, index) => {
    const live = checks[index];
    const ownership = ownershipFor(project);
    const health = classify(project, live.state, ownership);
    let nextAction: string | null = null;
    if (live.state === 'offline') nextAction = 'Investigate live availability before making any production change.';
    else if (ownership.state === 'ambiguous') nextAction = 'Resolve canonical ownership in the Control Plane.';
    else if (ownership.state === 'partial') nextAction = 'Complete source/deployment/asset reconciliation.';
    else if (project.missing.length) nextAction = `Resolve: ${project.missing.join(', ')}.`;

    return {
      id: project.id,
      name: project.name,
      kind: project.kind,
      health,
      liveCheck: live.state,
      liveStatusCode: live.status,
      website: project.officialWebsite,
      portal: project.officialPortal,
      githubRepo: project.githubRepo,
      vercelProjects: project.vercelProjects,
      unresolved: project.missing,
      monitoring: GUARDED_IDS.has(project.id)
        ? 'EA Production Guard every 15 minutes'
        : project.officialWebsite
          ? 'Live route checked on command-center refresh'
          : 'No live route required',
      controlPlane: `${ownership.state.toUpperCase()}: ${ownership.note}`,
      nextAction,
    };
  });
}

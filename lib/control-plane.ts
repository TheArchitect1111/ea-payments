import { CANONICAL_PROJECT_REGISTRY, type CanonicalProjectRecord } from './canonical-project-registry';

export type ControlPlaneState = 'MATCH' | 'DRIFT' | 'FAILED' | 'UNKNOWN';

export type ActualProjectState = {
  vercelProjects?: string[];
  githubRepo?: string | null;
  officialWebsite?: string | null;
  officialPortal?: string | null;
  assetLocations?: string[];
  healthy?: boolean | null;
};

export type ReconciliationCheck = {
  key: 'vercel' | 'github' | 'website' | 'portal' | 'assets' | 'health';
  state: ControlPlaneState;
  desired: unknown;
  actual: unknown;
  detail: string;
};

export type ProjectReconciliation = {
  id: string;
  name: string;
  kind: CanonicalProjectRecord['kind'];
  state: ControlPlaneState;
  checks: ReconciliationCheck[];
  missing: string[];
  verifiedOn: string | null;
};

const sameStrings = (a: string[] = [], b: string[] = []) =>
  a.length === b.length && [...a].sort().every((value, index) => value === [...b].sort()[index]);

function scalarCheck(key: ReconciliationCheck['key'], desired: string | null, actual: string | null | undefined): ReconciliationCheck {
  if (!desired) return { key, state: 'UNKNOWN', desired, actual: actual ?? null, detail: 'No canonical desired value is registered.' };
  if (actual === undefined) return { key, state: 'UNKNOWN', desired, actual: null, detail: 'Actual state has not been observed.' };
  return actual === desired
    ? { key, state: 'MATCH', desired, actual, detail: 'Actual state matches canonical desired state.' }
    : { key, state: 'DRIFT', desired, actual, detail: 'Actual state differs from canonical desired state.' };
}

export function reconcileProject(project: CanonicalProjectRecord, actual: ActualProjectState = {}): ProjectReconciliation {
  const checks: ReconciliationCheck[] = [];
  const desiredVercel = project.vercelProjects;
  const actualVercel = actual.vercelProjects;
  checks.push(actualVercel === undefined
    ? { key: 'vercel', state: 'UNKNOWN', desired: desiredVercel, actual: null, detail: 'Vercel inventory has not been observed.' }
    : sameStrings(desiredVercel, actualVercel)
      ? { key: 'vercel', state: 'MATCH', desired: desiredVercel, actual: actualVercel, detail: 'Vercel project ownership matches.' }
      : { key: 'vercel', state: 'DRIFT', desired: desiredVercel, actual: actualVercel, detail: 'Vercel project ownership differs.' });
  checks.push(scalarCheck('github', project.githubRepo, actual.githubRepo));
  checks.push(scalarCheck('website', project.officialWebsite, actual.officialWebsite));
  checks.push(scalarCheck('portal', project.officialPortal, actual.officialPortal));
  checks.push(actual.assetLocations === undefined
    ? { key: 'assets', state: 'UNKNOWN', desired: project.assetLocations, actual: null, detail: 'Asset inventory has not been observed.' }
    : sameStrings(project.assetLocations, actual.assetLocations)
      ? { key: 'assets', state: 'MATCH', desired: project.assetLocations, actual: actual.assetLocations, detail: 'Asset locations match.' }
      : { key: 'assets', state: 'DRIFT', desired: project.assetLocations, actual: actual.assetLocations, detail: 'Asset locations differ.' });
  checks.push(actual.healthy === undefined || actual.healthy === null
    ? { key: 'health', state: 'UNKNOWN', desired: true, actual: actual.healthy ?? null, detail: 'Health has not been observed.' }
    : actual.healthy
      ? { key: 'health', state: 'MATCH', desired: true, actual: true, detail: 'Observed surface is healthy.' }
      : { key: 'health', state: 'FAILED', desired: true, actual: false, detail: 'Observed surface is unhealthy.' });

  const state: ControlPlaneState = checks.some((check) => check.state === 'FAILED')
    ? 'FAILED'
    : checks.some((check) => check.state === 'DRIFT')
      ? 'DRIFT'
      : checks.every((check) => check.state === 'MATCH')
        ? 'MATCH'
        : 'UNKNOWN';

  return { id: project.id, name: project.name, kind: project.kind, state, checks, missing: project.missing, verifiedOn: project.verifiedOn };
}

export function buildControlPlaneSnapshot(actualById: Record<string, ActualProjectState> = {}) {
  const projects = CANONICAL_PROJECT_REGISTRY.map((project) => reconcileProject(project, actualById[project.id]));
  const counts = projects.reduce((acc, project) => {
    acc[project.state] += 1;
    return acc;
  }, { MATCH: 0, DRIFT: 0, FAILED: 0, UNKNOWN: 0 } as Record<ControlPlaneState, number>);
  return { generatedAt: new Date().toISOString(), counts, projects };
}

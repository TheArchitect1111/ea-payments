import assert from 'node:assert/strict';
import { CANONICAL_PROJECT_REGISTRY } from '../lib/canonical-project-registry';
import { buildControlPlaneSnapshot, reconcileProject } from '../lib/control-plane';

const ea = CANONICAL_PROJECT_REGISTRY.find((project) => project.id === 'EA-PLATFORM');
assert(ea, 'EA-PLATFORM must exist');

const match = reconcileProject(ea, {
  vercelProjects: [...ea.vercelProjects],
  githubRepo: ea.githubRepo,
  officialWebsite: ea.officialWebsite,
  officialPortal: ea.officialPortal,
  assetLocations: [...ea.assetLocations],
  healthy: true,
});
assert.equal(match.state, 'MATCH');

const drift = reconcileProject(ea, {
  vercelProjects: ['wrong-project'],
  githubRepo: ea.githubRepo,
  officialWebsite: ea.officialWebsite,
  officialPortal: ea.officialPortal,
  assetLocations: [...ea.assetLocations],
  healthy: true,
});
assert.equal(drift.state, 'DRIFT');
assert.equal(drift.checks.find((check) => check.key === 'vercel')?.state, 'DRIFT');

const failed = reconcileProject(ea, {
  vercelProjects: [...ea.vercelProjects],
  githubRepo: ea.githubRepo,
  officialWebsite: ea.officialWebsite,
  officialPortal: ea.officialPortal,
  assetLocations: [...ea.assetLocations],
  healthy: false,
});
assert.equal(failed.state, 'FAILED');

const snapshot = buildControlPlaneSnapshot();
assert.equal(snapshot.projects.length, CANONICAL_PROJECT_REGISTRY.length);
assert(snapshot.counts.UNKNOWN > 0, 'Unobserved projects must be UNKNOWN, never guessed healthy.');
console.log('EA Control Plane reconciliation contract passed.');

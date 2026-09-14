import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export type GateEvidence = {
  sourceCommit?: string;
  status: string;
  completedAt?: string;
  gates: Record<string, { status: string; proof?: string }>;
};

export type EvidenceAssessment = {
  pass: boolean;
  repairable: boolean;
  rollback: boolean;
  evidence: string[];
  failedGates: string[];
  visualRequired: boolean;
  functionalPassed: boolean;
  visualPassed: boolean;
  productionPassed: boolean;
};

export async function loadAuthoritativeGateEvidence(path = process.env.EA_GATE_EVIDENCE_PATH ?? '.ea/gates/latest.json'): Promise<GateEvidence> {
  const raw = await readFile(resolve(process.cwd(), path), 'utf8');
  const parsed = JSON.parse(raw) as GateEvidence;
  if (!parsed || typeof parsed !== 'object' || !parsed.gates) throw new Error('authoritative EA gate evidence is invalid');
  return parsed;
}

export function assessGateEvidence(gate: GateEvidence): EvidenceAssessment {
  const entries = Object.entries(gate.gates);
  const failedGates = entries.filter(([, value]) => value.status !== 'PASS').map(([name]) => name);
  const visualNames = ['desktopVisual', 'mobileVisual', 'creativeCritic'];
  const visualEntries = visualNames.filter((name) => gate.gates[name]);
  const visualPassed = visualEntries.every((name) => gate.gates[name]?.status === 'PASS');
  const functionalPassed = gate.gates.functional?.status === 'PASS';
  const productionPassed = gate.status === 'PASS' && entries.every(([, value]) => value.status === 'PASS');
  const evidence = [
    `gate-status:${gate.status}`,
    ...(gate.sourceCommit ? [`gate-source-commit:${gate.sourceCommit}`] : []),
    ...entries.map(([name, value]) => `gate:${name}:${value.status}${value.proof ? `:${value.proof}` : ''}`),
  ];
  return {
    pass: productionPassed,
    repairable: failedGates.length > 0,
    rollback: false,
    evidence,
    failedGates,
    visualRequired: visualEntries.length > 0,
    functionalPassed,
    visualPassed,
    productionPassed,
  };
}

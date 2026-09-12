import { createHash } from 'node:crypto';
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import type { AssemblyPlan } from '@/lib/modules/assembly';

export type AssemblyEvidenceReceipt = {
  version: 1;
  portalSlug: string;
  organizationId: string;
  packagePurchased: string;
  mode: 'certified';
  requested: string[];
  admitted: string[];
  certificationRun: number;
  fingerprint: string;
  recordedAt: string;
};

const ORG_ID = 'ea-assembly-evidence';

function recordId(portalSlug: string): string {
  return `assembly-evidence-${portalSlug.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}`;
}

function fingerprint(input: Omit<AssemblyEvidenceReceipt, 'fingerprint' | 'recordedAt'>): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

export function buildAssemblyEvidenceReceipt(input: {
  portalSlug: string;
  organizationId: string;
  packagePurchased: string;
  plan: AssemblyPlan;
  certificationRun: number;
  recordedAt?: string;
}): AssemblyEvidenceReceipt {
  if (input.plan.blocked) throw new Error('Cannot record blocked EA assembly evidence.');
  const base = {
    version: 1 as const,
    portalSlug: input.portalSlug,
    organizationId: input.organizationId,
    packagePurchased: input.packagePurchased,
    mode: 'certified' as const,
    requested: [...input.plan.requested],
    admitted: [...input.plan.admitted],
    certificationRun: input.certificationRun,
  };
  return {
    ...base,
    fingerprint: fingerprint(base),
    recordedAt: input.recordedAt ?? new Date().toISOString(),
  };
}

export async function persistAssemblyEvidenceReceipt(
  receipt: AssemblyEvidenceReceipt,
): Promise<AssemblyEvidenceReceipt> {
  const result = await saveStudioRecord({
    recordType: 'media',
    id: recordId(receipt.portalSlug),
    organizationId: ORG_ID,
    payload: receipt,
    title: `Assembly Evidence — ${receipt.portalSlug}`,
  });
  if (!result.ok) throw new Error(result.error || 'Could not persist EA assembly evidence.');
  return receipt;
}

export async function loadAssemblyEvidenceReceipt(
  portalSlug: string,
): Promise<AssemblyEvidenceReceipt | null> {
  const stored = await loadStudioRecord<AssemblyEvidenceReceipt>('media', recordId(portalSlug));
  if (!stored || stored.version !== 1 || stored.mode !== 'certified') return null;
  return stored;
}

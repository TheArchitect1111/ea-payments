import { createHash } from 'node:crypto';
import { loadStudioRecordFromAirtable, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { requireAssemblyPlan, type AssemblyPlan } from './assembly';
import { assertBrickTenant, type BrickTenant } from '@/lib/portal-universal/bricks/amanda';

export type TenantInstall = BrickTenant & { version: 1; admitted: AssemblyPlan['admitted'];
  requested: string[]; industryPackId?: string; brickIds: string[]; state: 'installing' | 'installed' };
const id = (org: string) => 'chassis-install-' + createHash('sha256').update(org).digest('hex');
export async function loadTenantInstall(organizationId: string) {
  const row = await loadStudioRecordFromAirtable<TenantInstall>('experience', id(organizationId));
  if (!row) return null;
  if (row.organizationId !== organizationId || row.version !== 1) throw new Error('Invalid tenant installation');
  const plan = requireAssemblyPlan(row.admitted);
  if (plan.admitted.length !== new Set(row.admitted).size) throw new Error('Incomplete tenant installation');
  return row;
}
export async function persistTenantInstall(row: TenantInstall) {
  assertBrickTenant(row);
  const plan = requireAssemblyPlan(row.admitted);
  if (plan.admitted.length !== new Set(row.admitted).size) throw new Error('Incomplete tenant installation');
  const saved = await saveStudioRecord({ recordType: 'experience', id: id(row.organizationId),
    organizationId: row.organizationId, title: 'Certified chassis installation', payload: row });
  if (!saved.ok || !saved.persistedToAirtable) throw new Error('Tenant installation was not durably saved');
  const actual = await loadTenantInstall(row.organizationId);
  if (!actual || JSON.stringify(actual) !== JSON.stringify(row)) throw new Error('Tenant installation read-back mismatch');
  return actual;
}

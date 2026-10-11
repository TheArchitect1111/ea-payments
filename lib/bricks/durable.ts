import { createHash } from 'node:crypto';
import { loadStudioRecordFromAirtable, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { assertBrickTenant, type BrickTenant } from '@/lib/portal-universal/bricks/amanda';
export type { BrickTenant };
export const brickHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function readBrickRecord<T extends BrickTenant>(tenant: BrickTenant, id: string): Promise<T | null> {
  assertBrickTenant(tenant);
  const row = await loadStudioRecordFromAirtable<T>('experience', id);
  if (row && (row.organizationId !== tenant.organizationId || row.portalSlug !== tenant.portalSlug)) throw new Error('Brick record tenant mismatch');
  return row;
}
export async function writeBrickRecord<T extends BrickTenant>(tenant: BrickTenant, id: string, row: T): Promise<T> {
  assertBrickTenant(tenant);
  if (row.organizationId !== tenant.organizationId || row.portalSlug !== tenant.portalSlug) throw new Error('Brick write tenant mismatch');
  const result = await saveStudioRecord({ recordType: 'experience', id, organizationId: tenant.organizationId, title: 'Tenant brick record', payload: row });
  if (!result.ok || !result.persistedToAirtable) throw new Error('Brick durable write failed');
  const actual = await readBrickRecord<T>(tenant, id);
  if (!actual || JSON.stringify(actual) !== JSON.stringify(row)) throw new Error('Brick durable read-back mismatch');
  return actual;
}

import { z } from 'zod';
import { listPortalNylasEvents } from '@/lib/calendar/nylas';
import { CalendarConfig, installCalendar } from '@/lib/calendar/storage';
import { DiscoveryConfig, installDiscovery } from '@/lib/discovery/storage';
import { getPeopleRepository } from '@/lib/people/adapter';
import { isPeopleRuntimeAllowed, isUniversalPeoplePersistEnabled } from '@/lib/people/flags';
import { brickHash, readBrickRecord, writeBrickRecord, type BrickTenant } from './durable';
import type { ModuleId } from '@/lib/modules/registry';
export const ModuleConfigsSchema = z.object({ calendar: CalendarConfig.optional(),
  people: z.object({ provider: z.literal('postgres') }).strict().optional(), discovery: DiscoveryConfig.optional() }).strict();
export type ModuleConfigs = z.infer<typeof ModuleConfigsSchema>;
export async function requireModuleProviders(ids: readonly ModuleId[], input: unknown = {}) {
  const config = ModuleConfigsSchema.parse(input);
  for (const key of Object.keys(config)) if (!ids.includes(key as ModuleId)) throw new Error('Configuration supplied for unselected module');
  if (config.calendar?.provider === 'nylas') await listPortalNylasEvents({ ...config.calendar, start: new Date(), end: new Date(Date.now() + 86400000) });
  if (ids.includes('people')) {
    if (!isPeopleRuntimeAllowed() || !isUniversalPeoplePersistEnabled()) throw new Error('People requires enabled durable Postgres runtime');
    const repo = getPeopleRepository();
    if (repo.kind !== 'postgres') throw new Error('People requires Postgres, never memory');
    // Readiness probes the actual schema/profile/RLS mapping before creating an organization.
    await repo.listPersonsByOrg('recCERTREADINESS');
  }
  return config;
}
export async function installAdmittedModules(tenant: BrickTenant, ids: readonly ModuleId[], input: unknown = {}) {
  const config = await requireModuleProviders(ids, input);
  if (ids.includes('calendar')) {
    const prior = await readBrickRecord<BrickTenant & {config: unknown}>(tenant, 'calendar-install-' + brickHash(tenant.organizationId));
    await installCalendar(tenant, config.calendar ?? prior?.config);
  }
  if (ids.includes('discovery')) {
    const prior = await readBrickRecord<BrickTenant & {config: unknown}>(tenant, 'discovery-install-' + brickHash(tenant.organizationId));
    await installDiscovery(tenant, config.discovery ?? prior?.config);
  }
  if (ids.includes('people')) {
    const repo = getPeopleRepository();
    const rows = await repo.listPersonsByOrg(tenant.organizationId);
    if (rows.some(x => x.organizationId !== tenant.organizationId)) throw new Error('People provider tenant mismatch');
    await writeBrickRecord(tenant, 'people-install-' + brickHash(tenant.organizationId),
      { ...tenant, version: 2 as const, provider: 'postgres' as const });
  }
}

'use client';

import { NAVY, GOLD } from '@/lib/design-system';

export type CprReadinessView = {
  ok: boolean;
  mapped: string[];
  unmapped: string[];
  migrationStatus: string;
  note: string;
  rows: Array<{
    hubModuleId: string;
    capabilityId: string | null;
    moduleId: string | null;
    enableKey: string | null;
  }>;
  cprTenant: {
    hubModuleCount: number;
    manifestCount: number;
    unmappedHubModuleIds: string[];
    capabilityIds: string[];
  };
  familyHub: {
    hubModuleCount: number;
    manifestCount: number;
    unmappedHubModuleIds: string[];
    capabilityIds: string[];
  };
};

export default function CprReadinessPanel({ readiness }: { readiness: CprReadinessView }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-5 space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            CPR readiness
          </p>
          <h3 className="text-lg font-bold mt-1" style={{ color: NAVY }}>
            Hub module ID map coverage
          </h3>
          <p className="text-sm text-neutral-500 mt-1">{readiness.note}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span
            className={`px-2 py-1 rounded font-bold uppercase ${
              readiness.ok ? 'bg-green-50 text-green-800' : 'bg-rose-50 text-rose-800'
            }`}
          >
            {readiness.ok ? 'Ready' : 'Gaps'}
          </span>
          <span className="px-2 py-1 rounded font-bold uppercase bg-neutral-100 text-neutral-700">
            {readiness.mapped.length} mapped
          </span>
          <span className="px-2 py-1 rounded font-bold uppercase bg-amber-50 text-amber-900">
            migration: {readiness.migrationStatus}
          </span>
        </div>
        <p className="text-xs text-neutral-500">
          API: <code>/api/platform/cpr-readiness</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article className="bg-white border border-neutral-200 p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            CPR tenant
          </p>
          <p className="text-2xl font-bold mt-2" style={{ color: NAVY }}>
            {readiness.cprTenant.manifestCount}/{readiness.cprTenant.hubModuleCount}
          </p>
          <p className="text-sm text-neutral-500 mt-1">manifests discovered from hub modules</p>
          <p className="text-xs font-mono text-neutral-400 mt-3">
            {readiness.cprTenant.capabilityIds.slice(0, 8).join(', ')}
            {readiness.cprTenant.capabilityIds.length > 8 ? '?' : ''}
          </p>
        </article>
        <article className="bg-white border border-neutral-200 p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            Family hub
          </p>
          <p className="text-2xl font-bold mt-2" style={{ color: NAVY }}>
            {readiness.familyHub.manifestCount}/{readiness.familyHub.hubModuleCount}
          </p>
          <p className="text-sm text-neutral-500 mt-1">manifests discovered from hub modules</p>
          <p className="text-xs font-mono text-neutral-400 mt-3">
            {readiness.familyHub.capabilityIds.slice(0, 8).join(', ')}
            {readiness.familyHub.capabilityIds.length > 8 ? '?' : ''}
          </p>
        </article>
      </div>

      <div className="bg-white border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3">Hub module</th>
              <th className="px-4 py-3">Capability</th>
              <th className="px-4 py-3">Module id</th>
              <th className="px-4 py-3">Enable key</th>
            </tr>
          </thead>
          <tbody>
            {readiness.rows.map((row) => (
              <tr key={row.hubModuleId} className="border-t border-neutral-100">
                <td className="px-4 py-2 font-mono text-xs">{row.hubModuleId}</td>
                <td className="px-4 py-2 font-mono text-xs">{row.capabilityId ?? '?'}</td>
                <td className="px-4 py-2 font-mono text-xs">{row.moduleId ?? '?'}</td>
                <td className="px-4 py-2 font-mono text-xs">{row.enableKey ?? '?'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {readiness.unmapped.length > 0 && (
        <p className="text-sm text-rose-700">Unmapped: {readiness.unmapped.join(', ')}</p>
      )}
    </div>
  );
}

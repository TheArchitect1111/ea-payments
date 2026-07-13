'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import { useCallback, useEffect, useMemo, useState } from 'react';
import OrganizationPicker, { type OrgPreset } from './OrganizationPicker';

type EntitlementModule = {
  moduleId: string;
  name: string;
  title: string;
  description: string;
  requiredRole: string;
  navGroup?: string;
  capabilityId: string | null;
  capabilityLabel: string;
  platformCapabilityId: string | null;
  experienceCapabilityId: string | null;
  enableKey: string | null;
  hubModuleId: string | null;
  mapStatus: 'mapped' | 'unmapped' | 'partial';
  enabled: boolean;
  entitlement: {
    id: string;
    status: string;
    source: string;
  } | null;
};

type EntitlementsResponse = {
  organizationId: string;
  modules: EntitlementModule[];
  summary?: {
    moduleCount: number;
    enabledCount: number;
    mappedCount: number;
    unmappedCount: number;
    partialCount: number;
    entitlementRowCount: number;
  };
  storeConfigured: boolean;
  isSynthetic: boolean;
  writable: boolean;
  error?: string;
};

type MapFilter = '' | 'mapped' | 'unmapped' | 'partial' | 'enabled' | 'disabled';

export default function EntitlementsPanel({ orgPresets }: { orgPresets: OrgPreset[] }) {
  const [organizationId, setOrganizationId] = useState(orgPresets[0]?.organizationId ?? 'ea');
  const [customOrgId, setCustomOrgId] = useState('');
  const [data, setData] = useState<EntitlementsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [mapFilter, setMapFilter] = useState<MapFilter>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const activeOrgId = customOrgId.trim() || organizationId;

  const load = useCallback(async (orgId: string) => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/entitlements?organizationId=${encodeURIComponent(orgId)}`,
        { credentials: 'include' },
      );
      const json = (await res.json()) as EntitlementsResponse & { error?: string };
      if (!res.ok) {
        setData(null);
        setError(json.error || 'Failed to load entitlements.');
        return;
      }
      setData(json);
      setSelected(new Set());
    } catch {
      setData(null);
      setError('Network error loading entitlements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(activeOrgId);
  }, [activeOrgId, load]);

  const filtered = useMemo(() => {
    const rows = data?.modules ?? [];
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (mapFilter === 'mapped' && row.mapStatus !== 'mapped') return false;
      if (mapFilter === 'unmapped' && row.mapStatus !== 'unmapped') return false;
      if (mapFilter === 'partial' && row.mapStatus !== 'partial') return false;
      if (mapFilter === 'enabled' && !row.enabled) return false;
      if (mapFilter === 'disabled' && row.enabled) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.moduleId.toLowerCase().includes(q) ||
        row.capabilityLabel.toLowerCase().includes(q) ||
        (row.platformCapabilityId ?? '').toLowerCase().includes(q) ||
        (row.experienceCapabilityId ?? '').toLowerCase().includes(q) ||
        (row.enableKey ?? '').toLowerCase().includes(q) ||
        (row.hubModuleId ?? '').toLowerCase().includes(q)
      );
    });
  }, [data, query, mapFilter]);

  function toggleSelected(moduleId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function selectFiltered() {
    setSelected(new Set(filtered.map((row) => row.moduleId)));
  }

  async function toggle(moduleId: string, enabled: boolean) {
    setSavingId(moduleId);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/entitlements', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: activeOrgId,
          action: 'set',
          moduleId,
          enabled,
          source: 'manual',
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error || 'Update failed.');
        return;
      }
      setMessage(`${moduleId} ${enabled ? 'enabled' : 'disabled'}.`);
      await load(activeOrgId);
    } catch {
      setError('Network error updating entitlement.');
    } finally {
      setSavingId(null);
    }
  }

  async function runBulk(
    action: 'bulk-enable' | 'bulk-disable' | 'enable-all' | 'disable-all' | 'enable-mapped',
  ) {
    if (!data?.writable) return;
    setBulkBusy(true);
    setError(null);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {
        organizationId: activeOrgId,
        action,
        source: 'manual',
      };
      if (action === 'bulk-enable' || action === 'bulk-disable') {
        const moduleIds = [...selected];
        if (!moduleIds.length) {
          setError('Select at least one module for bulk enable/disable.');
          return;
        }
        body.moduleIds = moduleIds;
      }
      const res = await fetch('/api/admin/entitlements', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        updatedCount?: number;
        failedCount?: number;
      };
      if (!res.ok) {
        setError(json.error || 'Bulk update failed.');
        return;
      }
      setMessage(
        `Bulk ${action}: ${json.updatedCount ?? 0} updated` +
          (json.failedCount ? `, ${json.failedCount} failed` : ''),
      );
      await load(activeOrgId);
    } catch {
      setError('Network error during bulk update.');
    } finally {
      setBulkBusy(false);
    }
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-5 space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            Entitlements
          </p>
          <h3 className="text-lg font-bold mt-1" style={{ color: NAVY }}>
            Modules ↔ capabilities ↔ Airtable
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Each row shows portal module id, platform capability id, and Airtable entitlement
            status. Bulk actions write real Organizations only — synthetic{' '}
            <span className="font-mono">org_*</span> ids stay read-only.
          </p>
        </div>

        <OrganizationPicker
          orgPresets={orgPresets}
          organizationId={organizationId}
          customOrgId={customOrgId}
          onSelectPreset={setOrganizationId}
          onCustomOrgIdChange={setCustomOrgId}
          onRefresh={() => void load(activeOrgId)}
          refreshing={loading}
        />

        {data && (
          <div className="flex flex-wrap gap-3 text-xs">
            <span
              className={`px-2 py-1 rounded font-bold uppercase ${
                data.storeConfigured ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'
              }`}
            >
              Store {data.storeConfigured ? 'configured' : 'missing'}
            </span>
            <span
              className={`px-2 py-1 rounded font-bold uppercase ${
                data.writable ? 'bg-green-50 text-green-800' : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {data.writable ? 'Writable' : 'Read-only'}
            </span>
            {data.isSynthetic && (
              <span className="px-2 py-1 rounded font-bold uppercase bg-amber-50 text-amber-900">
                Synthetic org id
              </span>
            )}
            {summary && (
              <>
                <span className="px-2 py-1 rounded bg-neutral-100 text-neutral-700">
                  {summary.enabledCount}/{summary.moduleCount} enabled
                </span>
                <span className="px-2 py-1 rounded bg-neutral-100 text-neutral-700">
                  {summary.mappedCount} mapped
                </span>
                {summary.unmappedCount > 0 && (
                  <span className="px-2 py-1 rounded bg-amber-50 text-amber-900">
                    {summary.unmappedCount} unmapped
                  </span>
                )}
                {summary.partialCount > 0 && (
                  <span className="px-2 py-1 rounded bg-amber-50 text-amber-900">
                    {summary.partialCount} partial
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {data?.writable && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void runBulk('enable-mapped')}
              className="border border-neutral-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
            >
              Enable all mapped
            </button>
            <button
              type="button"
              disabled={bulkBusy || selected.size === 0}
              onClick={() => void runBulk('bulk-enable')}
              className="border border-neutral-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
            >
              Enable selected ({selected.size})
            </button>
            <button
              type="button"
              disabled={bulkBusy || selected.size === 0}
              onClick={() => void runBulk('bulk-disable')}
              className="border border-neutral-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
            >
              Disable selected
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void runBulk('disable-all')}
              className="border border-rose-200 bg-rose-50 text-rose-800 px-3 py-2 text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
            >
              Disable all
            </button>
            <button
              type="button"
              disabled={bulkBusy || filtered.length === 0}
              onClick={selectFiltered}
              className="border border-neutral-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
            >
              Select filtered
            </button>
          </div>
        )}

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {message && <p className="text-sm text-green-800">{message}</p>}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-neutral-500 mb-1">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="module, capability, enableKey, hub..."
            className="border border-neutral-200 rounded px-3 py-2 text-sm min-w-[240px]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-500 mb-1">Filter</label>
          <select
            value={mapFilter}
            onChange={(e) => setMapFilter(e.target.value as MapFilter)}
            className="border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
          >
            <option value="">All</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
            <option value="mapped">Mapped</option>
            <option value="unmapped">Unmapped</option>
            <option value="partial">Partial map</option>
          </select>
        </div>
      </div>

      {loading && <p className="text-sm text-neutral-400">Loading entitlements...</p>}

      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((row) => (
            <article
              key={row.moduleId}
              className="bg-white border border-neutral-200 p-4 flex items-start gap-3"
            >
              {data.writable && (
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.has(row.moduleId)}
                  onChange={() => toggleSelected(row.moduleId)}
                  aria-label={`Select ${row.moduleId}`}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {row.capabilityLabel}
                  </p>
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      row.mapStatus === 'mapped'
                        ? 'bg-green-50 text-green-800'
                        : row.mapStatus === 'partial'
                          ? 'bg-amber-50 text-amber-900'
                          : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {row.mapStatus}
                  </span>
                </div>
                <h4 className="font-bold mt-1" style={{ color: NAVY }}>
                  {row.name}
                </h4>
                <dl className="mt-2 grid grid-cols-1 gap-1 text-[11px] font-mono text-neutral-500">
                  <div>
                    <span className="text-neutral-400">module </span>
                    {row.moduleId}
                  </div>
                  <div>
                    <span className="text-neutral-400">platform </span>
                    {row.platformCapabilityId ?? '—'}
                  </div>
                  <div>
                    <span className="text-neutral-400">experience </span>
                    {row.experienceCapabilityId ?? '—'}
                  </div>
                  <div>
                    <span className="text-neutral-400">enableKey </span>
                    {row.enableKey ?? '—'}
                    {row.hubModuleId ? ` · hub ${row.hubModuleId}` : ''}
                  </div>
                </dl>
                <p className="text-xs text-neutral-500 mt-2">{row.description}</p>
                {row.entitlement && (
                  <p className="text-[11px] text-neutral-400 mt-2">
                    Airtable: {row.entitlement.status} · {row.entitlement.source}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={!data.writable || savingId === row.moduleId || bulkBusy}
                onClick={() => void toggle(row.moduleId, !row.enabled)}
                className={`shrink-0 px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded border ${
                  row.enabled
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                } disabled:opacity-50`}
              >
                {savingId === row.moduleId ? '...' : row.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </article>
          ))}
        </div>
      )}

      {!loading && data && filtered.length === 0 && (
        <p className="text-center text-neutral-400 text-sm py-8">No modules match.</p>
      )}
    </div>
  );
}

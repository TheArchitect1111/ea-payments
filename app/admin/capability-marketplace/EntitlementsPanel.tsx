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
  capabilityId: string | null;
  capabilityLabel: string;
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
  storeConfigured: boolean;
  isSynthetic: boolean;
  writable: boolean;
  error?: string;
};

export default function EntitlementsPanel({ orgPresets }: { orgPresets: OrgPreset[] }) {
  const [organizationId, setOrganizationId] = useState(orgPresets[0]?.organizationId ?? 'ea');
  const [customOrgId, setCustomOrgId] = useState('');
  const [data, setData] = useState<EntitlementsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

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
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.moduleId.toLowerCase().includes(q) ||
        row.capabilityLabel.toLowerCase().includes(q) ||
        (row.capabilityId ?? '').toLowerCase().includes(q),
    );
  }, [data, query]);

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

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-5 space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            Entitlements
          </p>
          <h3 className="text-lg font-bold mt-1" style={{ color: NAVY }}>
            Enable / disable portal modules
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Writes to the Airtable Entitlements table for real organization ids. Synthetic{' '}
            <span className="font-mono">org_*</span> ids are read-only fallbacks. Pick from
            Airtable Organizations when the store is configured.
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
          </div>
        )}

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {message && <p className="text-sm text-green-800">{message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-neutral-500 mb-1">Search modules</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="documents, billing, pulse..."
          className="border border-neutral-200 rounded px-3 py-2 text-sm min-w-[240px]"
        />
      </div>

      {loading && <p className="text-sm text-neutral-400">Loading entitlements...</p>}

      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((row) => (
            <article
              key={row.moduleId}
              className="bg-white border border-neutral-200 p-4 flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  {row.capabilityLabel}
                  {row.capabilityId ? ` · ${row.capabilityId}` : ''}
                </p>
                <h4 className="font-bold mt-1" style={{ color: NAVY }}>
                  {row.name}
                </h4>
                <p className="text-xs font-mono text-neutral-400 mt-1">{row.moduleId}</p>
                <p className="text-xs text-neutral-500 mt-2">{row.description}</p>
                {row.entitlement && (
                  <p className="text-[11px] text-neutral-400 mt-2">
                    {row.entitlement.status} · {row.entitlement.source}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={!data.writable || savingId === row.moduleId}
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
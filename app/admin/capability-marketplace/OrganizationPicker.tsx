'use client';

import { useEffect, useMemo, useState } from 'react';

export type OrgPreset = { id: string; label: string; organizationId: string };

type ListedOrg = {
  id: string;
  name: string;
  slug: string;
  portalSlug: string | null;
  status: string;
  platformClientId: string | null;
};

type OrganizationsResponse = {
  storeConfigured: boolean;
  count: number;
  organizations: ListedOrg[];
  error?: string;
};

export default function OrganizationPicker({
  orgPresets,
  organizationId,
  customOrgId,
  onSelectPreset,
  onCustomOrgIdChange,
  onRefresh,
  refreshing,
}: {
  orgPresets: OrgPreset[];
  organizationId: string;
  customOrgId: string;
  onSelectPreset: (organizationId: string) => void;
  onCustomOrgIdChange: (value: string) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  const [listed, setListed] = useState<ListedOrg[]>([]);
  const [storeConfigured, setStoreConfigured] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadOrgs() {
      setLoadingList(true);
      setLoadError(null);
      try {
        const res = await fetch('/api/admin/organizations?status=Active', {
          credentials: 'include',
        });
        const json = (await res.json()) as OrganizationsResponse;
        if (!res.ok) {
          if (!cancelled) {
            setListed([]);
            setLoadError(json.error || 'Failed to load organizations.');
          }
          return;
        }
        if (!cancelled) {
          setStoreConfigured(json.storeConfigured);
          setListed(json.organizations ?? []);
        }
      } catch {
        if (!cancelled) {
          setListed([]);
          setLoadError('Network error loading organizations.');
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    }
    void loadOrgs();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectOptions = useMemo(() => {
    const rows: Array<{ value: string; label: string; group: string }> = [];

    for (const preset of orgPresets) {
      rows.push({
        value: preset.organizationId,
        label: `${preset.label} (${preset.organizationId})`,
        group: 'Platform presets',
      });
    }

    for (const org of listed) {
      const slug = org.portalSlug || org.slug || '';
      rows.push({
        value: org.id,
        label: slug ? `${org.name} · ${slug}` : org.name,
        group: 'Airtable Organizations',
      });
    }

    return rows;
  }, [orgPresets, listed]);

  const selectValue = customOrgId.trim()
    ? customOrgId.trim()
    : organizationId;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[260px] flex-1">
          <label className="block text-xs font-semibold text-neutral-500 mb-1">
            Organization
          </label>
          <select
            value={
              selectOptions.some((o) => o.value === selectValue)
                ? selectValue
                : organizationId
            }
            onChange={(e) => {
              onCustomOrgIdChange('');
              onSelectPreset(e.target.value);
            }}
            className="w-full border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
          >
            {['Platform presets', 'Airtable Organizations'].map((group) => {
              const options = selectOptions.filter((o) => o.group === group);
              if (!options.length) return null;
              return (
                <optgroup key={group} label={group}>
                  {options.map((opt) => (
                    <option key={`${group}-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-semibold text-neutral-500 mb-1">
            Or paste Airtable organization id
          </label>
          <input
            value={customOrgId}
            onChange={(e) => onCustomOrgIdChange(e.target.value)}
            placeholder="recXXX"
            className="w-full border border-neutral-200 rounded px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="border border-neutral-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider"
        >
          {refreshing ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
        <span>
          {loadingList
            ? 'Loading Airtable orgs…'
            : storeConfigured
              ? `${listed.length} active Airtable org${listed.length === 1 ? '' : 's'}`
              : 'Airtable store not configured — presets only'}
        </span>
        {loadError && <span className="text-rose-700">{loadError}</span>}
      </div>
    </div>
  );
}

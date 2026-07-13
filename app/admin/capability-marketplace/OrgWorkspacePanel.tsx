'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import { useCallback, useEffect, useState } from 'react';
import OrganizationPicker, { type OrgPreset } from './OrganizationPicker';

type Resolved = {
  platformClientId: string;
  themeId: string;
  personalityId: string;
  workspaceName: string;
  brandName?: string;
  logo?: string;
};

type OrgWorkspaceResponse = {
  organizationId: string;
  synthetic?: boolean;
  writable: boolean;
  organization: {
    id: string;
    name: string;
    portalSlug?: string | null;
    platformClientId?: string | null;
    themeId?: string | null;
    personalityId?: string | null;
    workspaceName?: string | null;
    logo?: string | null;
    brandColors?: string | null;
  } | null;
  resolved: Resolved;
  shell?: {
    name: string;
    workspaceName: string;
    themeId: string;
    personalityId: string;
  };
  airtableFields?: string[];
  error?: string;
};

const PLATFORM_CLIENT_OPTIONS = [
  { id: 'ea', label: 'Efficiency Architects' },
  { id: 'cpr', label: 'CPR' },
  { id: 'etfm', label: 'ETFM' },
  { id: '3hc', label: '3HC' },
  { id: 'bob-rumball', label: 'Bob Rumball' },
];

const THEME_OPTIONS = [
  { id: 'ea-default-theme', label: 'EA default' },
  { id: 'cpr-theme', label: 'CPR' },
  { id: 'etfm-theme', label: 'ETFM' },
  { id: '3hc-theme', label: '3HC' },
  { id: 'bob-rumball-theme', label: 'Bob Rumball' },
];

const PERSONALITY_OPTIONS = [
  { id: 'executive', label: 'Executive' },
  { id: 'operations', label: 'Operations' },
  { id: 'creative', label: 'Creative' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'athletics', label: 'Athletics' },
  { id: 'financial-coaching', label: 'Financial coaching' },
  { id: 'training-learning', label: 'Training / learning' },
];

type FormState = {
  platformClientId: string;
  themeId: string;
  personalityId: string;
  workspaceName: string;
  logo: string;
  brandColors: string;
};

const EMPTY_FORM: FormState = {
  platformClientId: '',
  themeId: '',
  personalityId: '',
  workspaceName: '',
  logo: '',
  brandColors: '',
};

export default function OrgWorkspacePanel({ orgPresets }: { orgPresets: OrgPreset[] }) {
  const [organizationId, setOrganizationId] = useState(orgPresets[0]?.organizationId ?? 'ea');
  const [customOrgId, setCustomOrgId] = useState('');
  const [data, setData] = useState<OrgWorkspaceResponse | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeOrgId = customOrgId.trim() || organizationId;

  const load = useCallback(async (orgId: string) => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/organization-workspace?organizationId=${encodeURIComponent(orgId)}`,
        { credentials: 'include' },
      );
      const json = (await res.json()) as OrgWorkspaceResponse;
      if (!res.ok) {
        setData(null);
        setError(json.error || 'Failed to load organization workspace config.');
        return;
      }
      setData(json);
      const org = json.organization;
      setForm({
        platformClientId: org?.platformClientId ?? '',
        themeId: org?.themeId ?? '',
        personalityId: org?.personalityId ?? '',
        workspaceName: org?.workspaceName ?? '',
        logo: org?.logo ?? '',
        brandColors: org?.brandColors ?? '',
      });
    } catch {
      setData(null);
      setError('Network error loading organization workspace config.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(activeOrgId);
  }, [activeOrgId, load]);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/organization-workspace', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: activeOrgId,
          platformClientId: form.platformClientId.trim(),
          themeId: form.themeId.trim(),
          personalityId: form.personalityId.trim(),
          workspaceName: form.workspaceName.trim(),
          logo: form.logo.trim(),
          brandColors: form.brandColors.trim(),
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error || 'Save failed.');
        return;
      }
      setMessage('Workspace config saved to Organizations.');
      await load(activeOrgId);
    } catch {
      setError('Network error saving workspace config.');
    } finally {
      setSaving(false);
    }
  }

  function applyPreset(clientId: string) {
    const preset = PLATFORM_CLIENT_OPTIONS.find((p) => p.id === clientId);
    if (!preset) return;
    const theme =
      clientId === 'ea'
        ? 'ea-default-theme'
        : clientId === 'bob-rumball'
          ? 'bob-rumball-theme'
          : `${clientId}-theme`;
    const personalityMap: Record<string, string> = {
      ea: 'executive',
      cpr: 'athletics',
      etfm: 'financial-coaching',
      '3hc': 'compliance',
      'bob-rumball': 'training-learning',
    };
    setForm((prev) => ({
      ...prev,
      platformClientId: clientId,
      themeId: theme,
      personalityId: personalityMap[clientId] || prev.personalityId,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-5 space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            Organization workspace
          </p>
          <h3 className="text-lg font-bold mt-1" style={{ color: NAVY }}>
            Theme & personality overrides
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Writes optional Airtable Organizations fields. Empty values keep slug-heuristic / preset
            fallbacks. Synthetic <span className="font-mono">org_*</span> ids are read-only. Pick
            from Airtable Organizations when the store is configured.
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
                data.writable ? 'bg-green-50 text-green-800' : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {data.writable ? 'Writable' : 'Read-only'}
            </span>
            {data.synthetic && (
              <span className="px-2 py-1 rounded font-bold uppercase bg-amber-50 text-amber-900">
                Synthetic org id
              </span>
            )}
            {!data.organization && !data.synthetic && (
              <span className="px-2 py-1 rounded font-bold uppercase bg-amber-50 text-amber-900">
                Org not found in Airtable
              </span>
            )}
          </div>
        )}

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {message && <p className="text-sm text-green-800">{message}</p>}
      </div>

      {loading && <p className="text-sm text-neutral-400">Loading workspace config...</p>}

      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-neutral-200 p-5 space-y-4">
            <h4 className="font-bold" style={{ color: NAVY }}>
              Stored overrides
            </h4>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">
                Platform client preset
              </label>
              <div className="flex flex-wrap gap-2">
                <select
                  value={form.platformClientId}
                  onChange={(e) => setForm((f) => ({ ...f, platformClientId: e.target.value }))}
                  disabled={!data.writable}
                  className="border border-neutral-200 rounded px-3 py-2 text-sm bg-white min-w-[180px] disabled:opacity-50"
                >
                  <option value="">(unset ? use heuristic)</option>
                  {PLATFORM_CLIENT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} ({opt.id})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!data.writable || !form.platformClientId}
                  onClick={() => applyPreset(form.platformClientId)}
                  className="border border-neutral-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  Fill theme/personality
                </button>
              </div>
            </div>

            <Field
              label="Theme Id"
              disabled={!data.writable}
              value={form.themeId}
              onChange={(v) => setForm((f) => ({ ...f, themeId: v }))}
              options={THEME_OPTIONS}
            />
            <Field
              label="Personality Id"
              disabled={!data.writable}
              value={form.personalityId}
              onChange={(v) => setForm((f) => ({ ...f, personalityId: v }))}
              options={PERSONALITY_OPTIONS}
            />
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">Workspace Name</label>
              <input
                value={form.workspaceName}
                onChange={(e) => setForm((f) => ({ ...f, workspaceName: e.target.value }))}
                disabled={!data.writable}
                placeholder="e.g. CPR Team Portal"
                className="w-full border border-neutral-200 rounded px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">Logo URL / path</label>
              <input
                value={form.logo}
                onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                disabled={!data.writable}
                placeholder="/ea-logo.png"
                className="w-full border border-neutral-200 rounded px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">
                Brand Colors
              </label>
              <input
                value={form.brandColors}
                onChange={(e) => setForm((f) => ({ ...f, brandColors: e.target.value }))}
                disabled={!data.writable}
                placeholder="#050505,#CC0000 or JSON"
                className="w-full border border-neutral-200 rounded px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              disabled={!data.writable || saving}
              onClick={() => void save()}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
              style={{ background: NAVY }}
            >
              {saving ? 'Saving?' : 'Save to Airtable'}
            </button>
          </div>

          <div className="bg-white border border-neutral-200 p-5 space-y-3">
            <h4 className="font-bold" style={{ color: NAVY }}>
              Effective resolution
            </h4>
            <p className="text-xs text-neutral-500">
              What the live portal will use after Airtable ? heuristic ? EA default.
            </p>
            <dl className="text-sm space-y-2">
              <Row label="Brand" value={data.shell?.name || data.resolved.brandName || '?'} />
              <Row label="Workspace" value={data.resolved.workspaceName} />
              <Row label="Platform client" value={data.resolved.platformClientId} />
              <Row label="Theme" value={data.shell?.themeId || data.resolved.themeId} />
              <Row
                label="Personality"
                value={data.shell?.personalityId || data.resolved.personalityId}
              />
              <Row label="Logo" value={data.resolved.logo || '(theme default)'} />
            </dl>
            {data.airtableFields && (
              <p className="text-[11px] text-neutral-400 pt-2">
                Airtable columns: {data.airtableFields.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ id: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border border-neutral-200 rounded px-3 py-2 text-sm bg-white disabled:opacity-50"
      >
        <option value="">(unset ? use preset)</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label} ({opt.id})
          </option>
        ))}
      </select>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-neutral-100 pb-2">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-mono text-xs text-right" style={{ color: NAVY }}>
        {value}
      </dd>
    </div>
  );
}

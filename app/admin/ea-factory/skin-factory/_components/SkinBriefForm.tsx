'use client';

import { useMemo, useState } from 'react';
import { EA_FACTORY_PROTOCOLS, buildRepoIntelligence } from '@/lib/ea-factory';
import {
  CHASSIS_MODULE_OPTIONS,
  SKIN_PROJECT_TYPES,
  generateSkinBrief,
  type SkinBriefAsset,
  type SkinBriefInput,
  type SkinBriefRecord,
  type SkinProjectType,
} from '@/lib/skin-factory';

export type SkinBriefFormState = {
  client_name: string;
  organization_type: string;
  website_social_url: string;
  mission: string;
  audience: string;
  primary_goal: string;
  desired_emotion: string;
  transformation_promise: string;
  project_type: SkinProjectType;
  selected_protocol: string[];
  selected_repos: string[];
  chassis_modules: string[];
  brand_colors: string;
  notes: string;
};

export const initialSkinBriefForm: SkinBriefFormState = {
  client_name: '',
  organization_type: '',
  website_social_url: '',
  mission: '',
  audience: '',
  primary_goal: '',
  desired_emotion: '',
  transformation_promise: '',
  project_type: 'website',
  selected_protocol: ['ea-master', 'ea-skin', 'ea-chassis', 'ea-website', 'ea-image'],
  selected_repos: ['ea-payments', 'aceternity', 'motion'],
  chassis_modules: [],
  brand_colors: '',
  notes: '',
};

export function recordToFormState(record: SkinBriefRecord): SkinBriefFormState {
  return {
    client_name: record.client_name,
    organization_type: record.organization_type,
    website_social_url: record.website_social_url,
    mission: record.mission,
    audience: record.audience,
    primary_goal: record.primary_goal,
    desired_emotion: record.desired_emotion,
    transformation_promise: record.transformation_promise,
    project_type: record.project_type,
    selected_protocol: record.selected_protocol,
    selected_repos: record.selected_repos,
    chassis_modules: record.chassis_modules,
    brand_colors: record.brand_colors.join(', '),
    notes: record.notes,
  };
}

export function formStateToInput(form: SkinBriefFormState, assets: SkinBriefAsset[]): SkinBriefInput {
  return {
    client_name: form.client_name,
    organization_type: form.organization_type,
    website_social_url: form.website_social_url,
    mission: form.mission,
    audience: form.audience,
    primary_goal: form.primary_goal,
    desired_emotion: form.desired_emotion,
    transformation_promise: form.transformation_promise,
    project_type: form.project_type,
    selected_protocol: form.selected_protocol,
    selected_repos: form.selected_repos,
    chassis_modules: form.chassis_modules,
    brand_colors: form.brand_colors
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    assets,
    notes: form.notes,
  };
}

export function canSubmitSkinBriefForm(form: SkinBriefFormState) {
  return (
    form.client_name.trim() &&
    form.organization_type.trim() &&
    form.mission.trim() &&
    form.audience.trim() &&
    form.primary_goal.trim() &&
    form.desired_emotion.trim() &&
    form.transformation_promise.trim() &&
    form.selected_protocol.includes('ea-skin')
  );
}

type SkinBriefFormProps = {
  initial?: SkinBriefFormState;
  initialAssets?: SkinBriefAsset[];
  submitLabel: string;
  onSubmit: (brief: SkinBriefRecord) => void;
};

export default function SkinBriefForm({ initial = initialSkinBriefForm, initialAssets = [], submitLabel, onSubmit }: SkinBriefFormProps) {
  const [form, setForm] = useState<SkinBriefFormState>(initial);
  const [assets, setAssets] = useState<SkinBriefAsset[]>(initialAssets);
  const protocols = EA_FACTORY_PROTOCOLS;
  const repositories = useMemo(() => buildRepoIntelligence(), []);

  function updateField<K extends keyof SkinBriefFormState>(key: K, value: SkinBriefFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleList(key: 'selected_protocol' | 'selected_repos' | 'chassis_modules', id: string) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(id) ? current[key].filter((item) => item !== id) : [...current[key], id],
    }));
  }

  async function handleAssetUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next: SkinBriefAsset[] = [];
    for (const file of Array.from(fileList)) {
      const dataUrl = await readFileAsDataUrl(file);
      next.push({ name: file.name, type: file.type, dataUrl });
    }
    setAssets((current) => [...current, ...next].slice(0, 8));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmitSkinBriefForm(form)) return;
    onSubmit(generateSkinBrief(formStateToInput(form, assets)));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-neutral-200 bg-white p-5 shadow-sm">
      <Input label="Client name" value={form.client_name} onChange={(value) => updateField('client_name', value)} />
      <Input label="Organization type" value={form.organization_type} onChange={(value) => updateField('organization_type', value)} />
      <Input label="Website / social URL" value={form.website_social_url} onChange={(value) => updateField('website_social_url', value)} />
      <Textarea label="Mission" value={form.mission} onChange={(value) => updateField('mission', value)} />
      <Input label="Audience" value={form.audience} onChange={(value) => updateField('audience', value)} />
      <Input label="Primary goal" value={form.primary_goal} onChange={(value) => updateField('primary_goal', value)} />
      <Input label="Desired emotion" value={form.desired_emotion} onChange={(value) => updateField('desired_emotion', value)} />
      <Textarea label="Transformation promise" value={form.transformation_promise} onChange={(value) => updateField('transformation_promise', value)} />
      <label className="block text-sm font-bold text-neutral-700">
        Project type
        <select
          value={form.project_type}
          onChange={(event) => updateField('project_type', event.target.value as SkinProjectType)}
          className="mt-2 w-full border border-neutral-200 px-4 py-3 text-sm"
        >
          {SKIN_PROJECT_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </label>
      <Input label="Brand colors (comma separated)" value={form.brand_colors} onChange={(value) => updateField('brand_colors', value)} />
      <label className="block text-sm font-bold text-neutral-700">
        Logo / image uploads
        <input type="file" accept="image/*" multiple onChange={(event) => void handleAssetUpload(event.target.files)} className="mt-2 block w-full text-sm" />
      </label>
      {assets.length > 0 ? (
        <ul className="space-y-1 text-xs text-neutral-500">
          {assets.map((asset) => (
            <li key={asset.name}>{asset.name}</li>
          ))}
        </ul>
      ) : null}
      <Textarea label="Notes" value={form.notes} onChange={(value) => updateField('notes', value)} />
      <Chooser title="Selected protocols (EA Skin required)" items={protocols.map((item) => ({ id: item.id, label: item.name }))} selected={form.selected_protocol} onToggle={(id) => toggleList('selected_protocol', id)} />
      <Chooser title="Selected repos" items={repositories.map((item) => ({ id: item.id, label: item.name }))} selected={form.selected_repos} onToggle={(id) => toggleList('selected_repos', id)} />
      <Chooser title="Chassis modules needed" items={CHASSIS_MODULE_OPTIONS.map((item) => ({ id: item, label: item }))} selected={form.chassis_modules} onToggle={(id) => toggleList('chassis_modules', id)} />
      <button
        type="submit"
        disabled={!canSubmitSkinBriefForm(form)}
        className="w-full bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#1B2B4D] disabled:opacity-40"
      >
        {submitLabel}
      </button>
      {!form.selected_protocol.includes('ea-skin') ? (
        <p className="text-xs font-semibold text-rose-600">EA Skin Protocol must be selected to generate a Skin Brief.</p>
      ) : null}
    </form>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-bold text-neutral-700">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-neutral-200 px-4 py-3 text-sm outline-none" />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-bold text-neutral-700">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-24 w-full border border-neutral-200 px-4 py-3 text-sm outline-none" />
    </label>
  );
}

function Chooser({ title, items, selected, onToggle }: { title: string; items: Array<{ id: string; label: string }>; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <p className="text-sm font-bold text-neutral-700">{title}</p>
      <div className="mt-2 max-h-48 space-y-2 overflow-auto">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 border border-neutral-200 px-3 py-2 text-sm">
            <input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
            {item.label}
          </label>
        ))}
      </div>
    </div>
  );
}

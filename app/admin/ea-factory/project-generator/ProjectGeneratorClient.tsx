'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  EA_FACTORY_PROTOCOLS,
  buildRepoIntelligence,
  generateEAFactoryProjectBrief,
  type EAFactoryProjectBrief,
} from '@/lib/ea-factory';

const PROJECT_TYPES = ['Website', 'Landing Page', 'Portal', 'Membership Experience', 'Training Experience', 'Event Experience', 'Recruiting Experience', 'Creator Experience'];

type FormState = {
  clientName: string;
  organization: string;
  website: string;
  industry: string;
  mission: string;
  goals: string;
  desiredOutcome: string;
  projectType: string;
  selectedProtocolIds: string[];
};

const initialForm: FormState = {
  clientName: '',
  organization: '',
  website: '',
  industry: '',
  mission: '',
  goals: '',
  desiredOutcome: '',
  projectType: 'Website',
  selectedProtocolIds: ['ea-master', 'ea-skin', 'ea-chassis', 'ea-website'],
};

export default function ProjectGeneratorPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [brief, setBrief] = useState<EAFactoryProjectBrief | null>(null);
  const [savedMessage, setSavedMessage] = useState('');
  const repositories = useMemo(() => buildRepoIntelligence(), []);

  function updateField(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleProtocol(id: string) {
    setForm((current) => ({
      ...current,
      selectedProtocolIds: current.selectedProtocolIds.includes(id)
        ? current.selectedProtocolIds.filter((item) => item !== id)
        : [...current.selectedProtocolIds, id],
    }));
  }

  function generate() {
    const goals = form.goals.split(',').map((item) => item.trim()).filter(Boolean);
    const nextBrief = generateEAFactoryProjectBrief({
      clientName: form.clientName,
      organization: form.organization,
      website: form.website,
      industry: form.industry,
      mission: form.mission,
      goals,
      desiredOutcome: form.desiredOutcome,
      projectType: form.projectType,
      selectedProtocolIds: form.selectedProtocolIds,
    });
    setBrief(nextBrief);
    setSavedMessage('');
  }

  function saveProject() {
    if (!brief) return;
    const saved = JSON.parse(window.localStorage.getItem('eaFactoryProjects') ?? '[]') as EAFactoryProjectBrief[];
    window.localStorage.setItem('eaFactoryProjects', JSON.stringify([brief, ...saved].slice(0, 20)));
    setSavedMessage('Saved to this browser workspace.');
  }

  function exportProject() {
    if (!brief) return;
    const blob = new Blob([brief.exportPackage.payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = brief.exportPackage.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const canGenerate = form.clientName.trim() && form.industry.trim() && form.mission.trim() && form.goals.trim() && form.desiredOutcome.trim() && form.selectedProtocolIds.length > 0;

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>Pulse / EA Factory</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>Project Generator&trade;</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600">
                Convert client context and selected protocols into a structured Project Brief, Codex prompt, and exportable build package.
              </p>
            </div>
            <Link href="/admin/ea-factory/skin-factory" className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
              Skin Factory
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[420px_1fr]">
        <section className="space-y-4 border border-neutral-200 bg-white p-5 shadow-sm">
          <Input label="Client Name" value={form.clientName} onChange={(value) => updateField('clientName', value)} />
          <Input label="Organization" value={form.organization} onChange={(value) => updateField('organization', value)} />
          <Input label="Website" value={form.website} onChange={(value) => updateField('website', value)} />
          <Input label="Industry" value={form.industry} onChange={(value) => updateField('industry', value)} />
          <Textarea label="Mission" value={form.mission} onChange={(value) => updateField('mission', value)} />
          <Textarea label="Goals, comma separated" value={form.goals} onChange={(value) => updateField('goals', value)} />
          <Input label="Desired Outcome" value={form.desiredOutcome} onChange={(value) => updateField('desiredOutcome', value)} />
          <label className="block text-sm font-bold text-neutral-700">
            Project Type
            <select value={form.projectType} onChange={(event) => updateField('projectType', event.target.value)} className="mt-2 w-full border border-neutral-200 px-4 py-3 text-sm">
              {PROJECT_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <div>
            <p className="text-sm font-bold text-neutral-700">Protocol Selection</p>
            <div className="mt-2 grid gap-2">
              {EA_FACTORY_PROTOCOLS.map((protocol) => (
                <label key={protocol.id} className="flex items-center gap-2 border border-neutral-200 px-3 py-2 text-sm">
                  <input type="checkbox" checked={form.selectedProtocolIds.includes(protocol.id)} onChange={() => toggleProtocol(protocol.id)} />
                  {protocol.name}
                </label>
              ))}
            </div>
          </div>
          <button
            type="button"
            disabled={!canGenerate}
            onClick={generate}
            className="w-full bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#1B2B4D] disabled:opacity-40"
          >
            Generate Project Brief
          </button>
        </section>

        <section className="space-y-5">
          {brief ? (
            <>
              <article className="border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>Project Brief</p>
                    <h2 className="mt-2 text-3xl font-black" style={{ color: NAVY }}>{brief.clientName}</h2>
                    <p className="mt-3 text-sm leading-7 text-neutral-600">{brief.transformationNarrative}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={saveProject} className="border border-neutral-200 px-4 py-2 text-xs font-black uppercase tracking-wider">Save Project</button>
                    <button type="button" onClick={exportProject} className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">Export Package</button>
                  </div>
                </div>
                {savedMessage ? <p className="mt-3 text-xs font-bold text-neutral-500">{savedMessage}</p> : null}
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <BriefList title="Current Reality" items={brief.currentReality} />
                  <BriefList title="Consider The Possibilities" items={brief.considerThePossibilities} />
                  <BriefList title="Story Framework" items={brief.storyFramework} />
                  <BriefList title="Website Structure" items={brief.websiteStructure} />
                  <BriefList title="Portal Recommendations" items={brief.portalRecommendations} />
                  <BriefList title="Module Recommendations" items={brief.moduleRecommendations} />
                  <BriefList title="Image Requirements" items={brief.imageRequirements} />
                  <BriefList title="Suggested Next Steps" items={brief.suggestedNextSteps} />
                  <BriefList title="Build Requirements" items={brief.buildRequirements} />
                  <BriefList title="Repo Recommendations" items={brief.repoRecommendations.map((repo) => repo.name)} />
                </div>
                <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-neutral-400">Codex Build Prompt</label>
                <textarea readOnly value={brief.codexBuildPrompt} className="mt-2 h-64 w-full border border-neutral-200 bg-[#FAF8F3] p-4 text-sm leading-6" />
              </article>
            </>
          ) : (
            <article className="border border-dashed border-neutral-300 bg-white p-8 text-sm leading-7 text-neutral-600">
              Fill the client fields, select one or more protocols, then generate the Project Brief. Recommended repositories will be selected from {repositories.length} approved systems.
            </article>
          )}
        </section>
      </div>
    </main>
  );
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

function BriefList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-[#FAF8F3] p-4">
      <h3 className="text-sm font-black" style={{ color: NAVY }}>{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

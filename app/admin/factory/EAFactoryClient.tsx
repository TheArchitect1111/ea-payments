'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  buildExportPackage,
  createProjectBrief,
  createSkinBrief,
  projectTypes,
  repoCategories,
  type EAProtocol,
  type ProjectBrief,
  type ProjectGeneratorInput,
  type RepoLibraryItem,
  type SkinBrief,
} from '@/lib/ea-factory';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const INK = '#202124';
const PAPER = '#FBFAF7';

type View = 'protocols' | 'repos' | 'project' | 'skin' | 'package' | 'future';

interface Props {
  protocols: EAProtocol[];
  repos: RepoLibraryItem[];
}

const futureSections = [
  'Approval Center',
  'Codex Builder',
  'Chassis Deployment',
  'AI Research Agent',
  'Magnifi Integration',
  'Simplifi Integration',
];

const emptyInput: ProjectGeneratorInput = {
  clientName: '',
  organization: '',
  website: '',
  industry: '',
  mission: '',
  goals: '',
  desiredOutcome: '',
  projectType: 'Website',
  protocolId: 'ea-website',
  repoIds: ['shadcn', 'motion', 'magic-ui'],
};

function pill(text: string, active = false) {
  return (
    <span
      key={text}
      className="inline-flex items-center border px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
      style={{
        borderColor: active ? GOLD : '#E5E0D7',
        color: active ? NAVY : '#6B7280',
        backgroundColor: active ? '#FFF9E6' : '#FFFFFF',
      }}
    >
      {text}
    </span>
  );
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function scoreColor(score: number) {
  if (score >= 85) return '#176B4D';
  if (score >= 70) return '#8A6200';
  return '#7C2D12';
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </span>
      {textarea ? (
        <textarea
          className="min-h-28 w-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none focus:border-[#1B2B4D]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="w-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none focus:border-[#1B2B4D]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-neutral-200 bg-white p-5 sm:p-6">
      <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em]" style={{ color: NAVY }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function EAFactoryClient({ protocols, repos }: Props) {
  const [view, setView] = useState<View>('protocols');
  const [protocolQuery, setProtocolQuery] = useState('');
  const [protocolType, setProtocolType] = useState('All');
  const [selectedProtocolId, setSelectedProtocolId] = useState(protocols[0]?.id ?? '');
  const [repoQuery, setRepoQuery] = useState('');
  const [repoCategory, setRepoCategory] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [projectInput, setProjectInput] = useState<ProjectGeneratorInput>(emptyInput);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null);
  const [savedProjects, setSavedProjects] = useState<ProjectBrief[]>([]);
  const [skinBrief, setSkinBrief] = useState<SkinBrief | null>(null);

  const selectedProtocol = protocols.find((protocol) => protocol.id === selectedProtocolId) ?? protocols[0];

  const filteredProtocols = useMemo(() => {
    const query = protocolQuery.toLowerCase();
    return protocols.filter((protocol) => {
      const matchesQuery =
        protocol.name.toLowerCase().includes(query) ||
        protocol.summary.toLowerCase().includes(query) ||
        protocol.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesType = protocolType === 'All' || protocol.type === protocolType;
      return matchesQuery && matchesType;
    });
  }, [protocolQuery, protocolType, protocols]);

  const filteredRepos = useMemo(() => {
    const query = repoQuery.toLowerCase();
    return repos.filter((repo) => {
      const matchesQuery =
        repo.name.toLowerCase().includes(query) ||
        repo.description.toLowerCase().includes(query) ||
        repo.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesCategory = repoCategory === 'All' || repo.category === repoCategory;
      return matchesQuery && matchesCategory;
    });
  }, [repoCategory, repoQuery, repos]);

  const generateProject = () => {
    const brief = createProjectBrief(projectInput);
    setProjectBrief(brief);
    setSkinBrief(null);
    setView('project');
  };

  const saveProject = () => {
    if (!projectBrief) return;
    setSavedProjects((current) => {
      const withoutDuplicate = current.filter((item) => item.id !== projectBrief.id);
      return [projectBrief, ...withoutDuplicate].slice(0, 8);
    });
  };

  const generateSkin = () => {
    if (!projectBrief) return;
    const brief = createSkinBrief(projectBrief, 'ea-skin');
    setSkinBrief(brief);
    setView('skin');
  };

  const packageText = projectBrief ? buildExportPackage(projectBrief, skinBrief) : '';

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAPER, color: INK }}>
      <header className="border-b border-[#D9D1C3] bg-white px-5 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Image src="/images/ea-logo-hd.png" alt="Efficiency Architects" width={96} height={48} className="h-12 w-auto" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                Pulse Administration
              </p>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: NAVY }}>
                EA Factory
              </h1>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]">
            <a className="border border-neutral-200 bg-white px-3 py-2 text-neutral-600" href="/admin/master">
              Pulse
            </a>
            <a className="border border-neutral-200 bg-white px-3 py-2 text-neutral-600" href="/admin/dashboard">
              Clients
            </a>
            <a className="border border-neutral-200 bg-white px-3 py-2 text-neutral-600" href="/admin/proposals">
              Projects
            </a>
            <a className="border border-neutral-200 bg-white px-3 py-2 text-neutral-600" href="/api/admin/logout">
              Sign Out
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6 sm:py-8">
        <div className="mb-6 grid gap-3 md:grid-cols-6">
          {[
            ['protocols', 'Protocol Center'],
            ['repos', 'Repo Library'],
            ['project', 'Project Generator'],
            ['skin', 'Skin Factory'],
            ['package', 'Export Package'],
            ['future', 'Future'],
          ].map(([id, label]) => (
            <button
              key={id}
              className="border px-3 py-3 text-left text-xs font-black uppercase tracking-[0.14em] transition"
              style={{
                borderColor: view === id ? NAVY : '#E5E0D7',
                backgroundColor: view === id ? NAVY : '#FFFFFF',
                color: view === id ? '#FFFFFF' : '#5F6368',
              }}
              onClick={() => setView(id as View)}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'protocols' && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <SectionCard title="Protocol Center">
              <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
                <input
                  className="border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1B2B4D]"
                  placeholder="Search protocols, tags, or summaries"
                  value={protocolQuery}
                  onChange={(event) => setProtocolQuery(event.target.value)}
                />
                <select
                  className="border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1B2B4D]"
                  value={protocolType}
                  onChange={(event) => setProtocolType(event.target.value)}
                >
                  <option>All</option>
                  {protocols.map((protocol) => (
                    <option key={protocol.id}>{protocol.type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                {filteredProtocols.map((protocol) => (
                  <button
                    key={protocol.id}
                    className="w-full border p-4 text-left transition hover:bg-[#FBFAF7]"
                    style={{ borderColor: selectedProtocolId === protocol.id ? GOLD : '#E5E0D7' }}
                    onClick={() => setSelectedProtocolId(protocol.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-black" style={{ color: NAVY }}>
                          {protocol.name}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">{protocol.summary}</p>
                      </div>
                      {pill(protocol.approvalStatus, protocol.approvalStatus === 'Approved')}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {protocol.tags.map((tag) => pill(tag))}
                    </div>
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Protocol Detail">
              {selectedProtocol && (
                <div className="space-y-5">
                  <div>
                    <p className="text-2xl font-black" style={{ color: NAVY }}>
                      {selectedProtocol.name}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">{selectedProtocol.summary}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ['Version', selectedProtocol.version],
                      ['Owner', selectedProtocol.owner],
                      ['Created', selectedProtocol.createdDate],
                      ['Modified', selectedProtocol.modifiedDate],
                      ['Approved By', selectedProtocol.approvedBy],
                      ['Status', selectedProtocol.status],
                    ].map(([label, value]) => (
                      <div key={label} className="border border-neutral-200 bg-[#FBFAF7] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">{label}</p>
                        <p className="mt-1 text-sm font-bold text-neutral-800">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>
                      Principles
                    </p>
                    <div className="space-y-2">
                      {selectedProtocol.principles.map((principle) => (
                        <p key={principle} className="border-l-2 border-[#C9A844] bg-[#FBFAF7] px-3 py-2 text-sm text-neutral-700">
                          {principle}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>
                      Version History
                    </p>
                    <div className="space-y-2">
                      {selectedProtocol.versions.map((version) => (
                        <div key={version.version} className="flex gap-3 border border-neutral-200 p-3 text-sm">
                          <span className="font-black" style={{ color: NAVY }}>
                            {version.version}
                          </span>
                          <span className="text-neutral-400">{version.date}</span>
                          <span className="text-neutral-600">{version.notes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-neutral-200 bg-[#FBFAF7] p-4 text-sm text-neutral-600">
                    Source: <a className="font-bold" style={{ color: NAVY }} href={selectedProtocol.source.url}>{selectedProtocol.source.repository}</a>
                    <span className="block pt-1 text-xs">{selectedProtocol.source.path}</span>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {view === 'repos' && (
          <SectionCard title="Repo Library">
            <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px]">
              <input
                className="border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1B2B4D]"
                placeholder="Search approved repositories"
                value={repoQuery}
                onChange={(event) => setRepoQuery(event.target.value)}
              />
              <select
                className="border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1B2B4D]"
                value={repoCategory}
                onChange={(event) => setRepoCategory(event.target.value)}
              >
                <option>All</option>
                {repoCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredRepos.map((repo) => (
                <article key={repo.id} className="border border-neutral-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black" style={{ color: NAVY }}>
                        {repo.name}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">{repo.description}</p>
                    </div>
                    <button
                      className="h-10 w-10 shrink-0 border text-lg"
                      style={{
                        borderColor: favorites.includes(repo.id) ? GOLD : '#E5E0D7',
                        color: favorites.includes(repo.id) ? GOLD : '#A3A3A3',
                      }}
                      title="Favorite"
                      onClick={() =>
                        setFavorites((current) =>
                          current.includes(repo.id)
                            ? current.filter((id) => id !== repo.id)
                            : [...current, repo.id]
                        )
                      }
                    >
                      *
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {pill(repo.category, repo.recommended)}
                    {repo.tags.map((tag) => pill(tag))}
                  </div>
                  <div className="mt-5 grid grid-cols-5 gap-2">
                    {[
                      ['Story', repo.storytellingScore],
                      ['Anim.', repo.animationScore],
                      ['Mobile', repo.mobileScore],
                      ['Complex', repo.complexityScore],
                      ['Perf.', repo.performanceScore],
                    ].map(([label, score]) => (
                      <div key={label} className="bg-[#FBFAF7] p-2 text-center">
                        <p className="text-base font-black" style={{ color: scoreColor(Number(score)) }}>
                          {score}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-neutral-400">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-xs leading-5 text-neutral-500">
                    <p className="font-black uppercase tracking-[0.14em] text-neutral-400">Use Cases</p>
                    <p>{repo.recommendedUseCases.join(', ')}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <a className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: NAVY }} href={repo.githubUrl}>
                      GitHub
                    </a>
                    <button
                      className="border border-neutral-200 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-neutral-600"
                      onClick={() =>
                        setProjectInput((current) => ({
                          ...current,
                          repoIds: current.repoIds.includes(repo.id) ? current.repoIds : [...current.repoIds, repo.id],
                        }))
                      }
                    >
                      Add To Project
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        )}

        {view === 'project' && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <SectionCard title="Project Generator">
              <div className="grid gap-4">
                <Field label="Client Name" value={projectInput.clientName} onChange={(value) => setProjectInput({ ...projectInput, clientName: value })} />
                <Field label="Organization" value={projectInput.organization} onChange={(value) => setProjectInput({ ...projectInput, organization: value })} />
                <Field label="Website" value={projectInput.website} onChange={(value) => setProjectInput({ ...projectInput, website: value })} placeholder="https://" />
                <Field label="Industry" value={projectInput.industry} onChange={(value) => setProjectInput({ ...projectInput, industry: value })} />
                <Field label="Mission" value={projectInput.mission} onChange={(value) => setProjectInput({ ...projectInput, mission: value })} textarea />
                <Field label="Goals" value={projectInput.goals} onChange={(value) => setProjectInput({ ...projectInput, goals: value })} textarea />
                <Field label="Desired Outcome" value={projectInput.desiredOutcome} onChange={(value) => setProjectInput({ ...projectInput, desiredOutcome: value })} textarea />
                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-neutral-500">Project Type</span>
                  <select className="w-full border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1B2B4D]" value={projectInput.projectType} onChange={(event) => setProjectInput({ ...projectInput, projectType: event.target.value })}>
                    {projectTypes.map((type) => <option key={type}>{type}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-neutral-500">Protocol Selection</span>
                  <select className="w-full border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1B2B4D]" value={projectInput.protocolId} onChange={(event) => setProjectInput({ ...projectInput, protocolId: event.target.value })}>
                    {protocols.map((protocol) => <option key={protocol.id} value={protocol.id}>{protocol.name}</option>)}
                  </select>
                </label>
                <button className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-white" style={{ backgroundColor: NAVY }} onClick={generateProject}>
                  Generate Project Brief
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Project Brief Output">
              {projectBrief ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-2xl font-black" style={{ color: NAVY }}>{projectBrief.organization}</p>
                    <p className="mt-1 text-sm text-neutral-500">{projectBrief.projectType} using {projectBrief.protocolName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {projectBrief.repoNames.map((name) => pill(name, true))}
                  </div>
                  <div className="space-y-4">
                    {projectBrief.sections.map((section) => (
                      <div key={section.title} className="border-l-2 border-[#C9A844] bg-[#FBFAF7] p-4">
                        <p className="text-sm font-black" style={{ color: NAVY }}>{section.title}</p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-neutral-600">{section.body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <button className="border border-neutral-200 px-4 py-3 text-xs font-black uppercase tracking-[0.14em]" onClick={saveProject}>Save</button>
                    <button className="border border-neutral-200 px-4 py-3 text-xs font-black uppercase tracking-[0.14em]" onClick={() => downloadText(`${projectBrief.organization}-project-brief.md`, buildExportPackage(projectBrief, null))}>Export</button>
                    <button className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white" style={{ backgroundColor: NAVY }} onClick={generateSkin}>Generate Skin Brief</button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-80 items-center justify-center border border-dashed border-neutral-300 bg-[#FBFAF7] p-8 text-center text-sm text-neutral-500">
                  Fill out the project inputs to generate a complete EA Project Brief.
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {view === 'skin' && (
          <SectionCard title="Skin Factory">
            {skinBrief ? (
              <div className="space-y-5">
                <div>
                  <p className="text-2xl font-black" style={{ color: NAVY }}>{skinBrief.title}</p>
                  <p className="mt-2 text-sm text-neutral-500">Design direction only. No code generation.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {skinBrief.sections.map((section) => (
                    <div key={section.title} className="border border-neutral-200 bg-[#FBFAF7] p-5">
                      <p className="text-sm font-black" style={{ color: NAVY }}>{section.title}</p>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">{section.body}</p>
                    </div>
                  ))}
                </div>
                <button className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-white" style={{ backgroundColor: NAVY }} onClick={() => setView('package')}>
                  Review Export Package
                </button>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="border border-dashed border-neutral-300 bg-[#FBFAF7] p-8 text-sm leading-6 text-neutral-600">
                  Generate a Project Brief first, then Skin Factory will produce the approved creative direction: hero concept, visual story, emotion, color, typography, layout, animation, image requirements, and experience narrative.
                </div>
                <div className="border border-neutral-200 bg-white p-6">
                  <p className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Skin Rules</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['Tell a story', 'Create emotion', 'Feel custom built', 'Avoid SaaS templates', 'Avoid AI gloss'].map((rule) => pill(rule, true))}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        )}

        {view === 'package' && (
          <SectionCard title="Codex-Ready Build Package">
            {projectBrief ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <button className="border border-neutral-200 px-4 py-3 text-xs font-black uppercase tracking-[0.14em]" onClick={() => navigator.clipboard.writeText(packageText)}>Copy Package</button>
                  <button className="border border-neutral-200 px-4 py-3 text-xs font-black uppercase tracking-[0.14em]" onClick={() => downloadText(`${projectBrief.organization}-ea-factory-package.md`, packageText)}>Export Package</button>
                  <a className="px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white" style={{ backgroundColor: NAVY }} href="/admin/factory">Phone Launch URL</a>
                </div>
                <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap border border-neutral-200 bg-[#111827] p-5 text-xs leading-5 text-neutral-100">{packageText}</pre>
              </div>
            ) : (
              <div className="border border-dashed border-neutral-300 bg-[#FBFAF7] p-8 text-center text-sm text-neutral-500">
                Generate a Project Brief before exporting a build package.
              </div>
            )}
          </SectionCard>
        )}

        {view === 'future' && (
          <SectionCard title="Future Placeholders">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {futureSections.map((section) => (
                <div key={section} className="border border-neutral-200 bg-[#FBFAF7] p-5">
                  <p className="text-base font-black" style={{ color: NAVY }}>{section}</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">Placeholder only. Functionality intentionally not built in Phases 1-4.</p>
                </div>
              ))}
            </div>
            {savedProjects.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Saved Projects</p>
                <div className="space-y-2">
                  {savedProjects.map((project) => (
                    <button key={project.id} className="w-full border border-neutral-200 bg-white p-4 text-left" onClick={() => { setProjectBrief(project); setView('project'); }}>
                      <p className="font-black" style={{ color: NAVY }}>{project.organization}</p>
                      <p className="text-xs text-neutral-500">{project.projectType} - {new Date(project.createdAt).toLocaleString('en-US')}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        )}
      </main>
    </div>
  );
}

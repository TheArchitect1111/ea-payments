import { NAVY, GOLD } from '@/lib/design-system';
import Link from 'next/link';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import {
  buildRepoIntelligence,
  EA_FACTORY_PHASES,
  EA_FACTORY_PROTOCOLS,
  generateEAFactoryProjectBrief,
  generateEAFactorySkinBrief,
  searchProtocols,
} from '@/lib/ea-factory';
import AdminLogin from '../master/AdminLogin';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function value(params: Record<string, string | string[] | undefined>, key: string, fallback = '') {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] ?? fallback : raw ?? fallback;
}

function splitList(input: string) {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
      {children}
    </span>
  );
}

function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight" style={{ color: NAVY }}>
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">{body}</p>
    </div>
  );
}

export default async function EAFactoryPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return <AdminLogin />;

  const params = (await searchParams) ?? {};
  const protocolQuery = value(params, 'protocolSearch');
  const repoQuery = value(params, 'repoSearch');
  const activeProtocols = protocolQuery ? searchProtocols(protocolQuery) : EA_FACTORY_PROTOCOLS;
  const repos = buildRepoIntelligence();
  const filteredRepos = repos.filter((repo) => {
    const needle = repoQuery.toLowerCase().trim();
    if (!needle) return true;
    return [repo.name, repo.category, repo.compatibility, ...repo.tags, ...repo.useCases, ...repo.strengths]
      .join(' ')
      .toLowerCase()
      .includes(needle);
  });

  const clientName = value(params, 'clientName');
  const organization = value(params, 'organization');
  const website = value(params, 'website');
  const industry = value(params, 'industry');
  const mission = value(params, 'mission');
  const goals = value(params, 'goals');
  const desiredOutcome = value(params, 'desiredOutcome');
  const projectType = value(params, 'projectType', 'Website');
  const selectedProtocolIds = splitList(value(params, 'protocols', 'ea-master,ea-skin,ea-chassis,ea-website'));
  const selectedRepositoryIds = splitList(value(params, 'repos', 'ea-payments,shadcn'));

  const canGenerate = clientName && industry && mission && goals && desiredOutcome;
  const projectBrief = canGenerate
    ? generateEAFactoryProjectBrief({
        clientName,
        organization,
        website,
        industry,
        mission,
        goals: splitList(goals),
        desiredOutcome,
        projectType,
        selectedProtocolIds,
      })
    : null;
  const skinBrief = projectBrief ? generateEAFactorySkinBrief(projectBrief, selectedProtocolIds, selectedRepositoryIds) : null;

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            Pulse / EA Factory
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                EA Factory
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                Protocol-driven intelligence for approved websites, portals, experiences, and future deployments.
                No agents. No automatic deployment. Human approval remains the gate.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/ea-factory/quick-launch" className="rounded-full bg-[#B9894D] px-4 py-2 text-xs font-black text-white">
                Quick Launch
              </Link>
              <Link href="/admin/ea-factory/new-experience" className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">
                New Experience
              </Link>
              <Link href="/admin/ea-factory/training-transformations" className="rounded-full bg-[#111] px-4 py-2 text-xs font-black text-white">
                Training Transformations
              </Link>
              <Link
                href="/admin/ea-factory/launch"
                className="rounded-full bg-[#C9A844] px-4 py-2 text-xs font-black text-[#1B2B4D]"
              >
                Launch
              </Link>
              <Link href="/admin/ea-factory/projects" className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">
                Projects
              </Link>
              <Link href="/admin/ea-factory/experience-director" className="rounded-full bg-[#1B2B4D] px-4 py-2 text-xs font-black text-white">
                Experience Director
              </Link>
              <Link href="/admin/ea-factory/launches" className="rounded-full bg-[#C9A844] px-4 py-2 text-xs font-black text-[#1B2B4D]">
                EACP Launches
              </Link>
              <a href="#protocol-center" className="rounded-full bg-[#1B2B4D] px-4 py-2 text-xs font-bold text-white">
                Protocol Center
              </a>
              <a href="#repo-library" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200">
                Repo Library
              </a>
              <a href="#project-generator" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200">
                Project Generator
              </a>
              <a href="#skin-factory" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200">
                Skin Factory
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-10">
        <section className="grid gap-4 md:grid-cols-4">
          {EA_FACTORY_PHASES.slice(0, 4).map((phase, index) => (
            <article key={phase.id} className="border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                Phase {index + 1}
              </p>
              <h2 className="mt-2 text-lg font-black" style={{ color: NAVY }}>
                {phase.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">{phase.purpose}</p>
            </article>
          ))}
        </section>

        <section id="protocol-center" className="scroll-mt-8">
          <SectionHeader
            eyebrow="Administration"
            title="Protocol Center"
            body="Search, review, and retrieve EA protocols with active versions, ownership, approval status, tags, categories, and version history."
          />
          <form className="mb-4 flex max-w-xl gap-2">
            <input
              name="protocolSearch"
              defaultValue={protocolQuery}
              placeholder="Search protocols, tags, categories..."
              className="min-w-0 flex-1 border border-neutral-200 bg-white px-4 py-3 text-sm outline-none"
            />
            <button className="bg-[#1B2B4D] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">
              Search
            </button>
          </form>
          <div className="grid gap-4 md:grid-cols-2">
            {activeProtocols.map((protocol) => (
              <Link
                key={protocol.id}
                href={`/admin/ea-factory/protocols/${protocol.id}`}
                className="block border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#C9A844]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black" style={{ color: NAVY }}>
                      {protocol.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      {protocol.category} / v{protocol.activeVersion}
                    </p>
                  </div>
                  <Pill>{protocol.approvalStatus ?? protocol.status}</Pill>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-500">{protocol.purpose}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {protocol.tags.slice(0, 4).map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="repo-library" className="scroll-mt-8">
          <SectionHeader
            eyebrow="EA Factory"
            title="Repo Library"
            body="Approved repositories and reusable UI systems with compatibility, scoring, tags, protocol fit, and recommended use cases."
          />
          <form className="mb-4 flex max-w-xl gap-2">
            <input
              name="repoSearch"
              defaultValue={repoQuery}
              placeholder="Search repos, use cases, tags..."
              className="min-w-0 flex-1 border border-neutral-200 bg-white px-4 py-3 text-sm outline-none"
            />
            <button className="bg-[#1B2B4D] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">
              Filter
            </button>
          </form>
          <div className="grid gap-4 lg:grid-cols-3">
            {filteredRepos.map((repo) => (
              <Link
                key={repo.id}
                href={`/admin/ea-factory/repos/${repo.id}`}
                className="block border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#C9A844]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black" style={{ color: NAVY }}>
                    {repo.name}
                  </h3>
                  <Pill>{repo.category}</Pill>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-500">{repo.strengths.join(' / ')}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#FAF8F3] p-3">
                    <strong>{repo.storytellingScore}</strong>
                    <span className="block text-neutral-400">Story</span>
                  </div>
                  <div className="bg-[#FAF8F3] p-3">
                    <strong>{repo.mobileScore}</strong>
                    <span className="block text-neutral-400">Mobile</span>
                  </div>
                  <div className="bg-[#FAF8F3] p-3">
                    <strong>{repo.performanceScore}</strong>
                    <span className="block text-neutral-400">Perf</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="project-generator" className="scroll-mt-8">
          <SectionHeader
            eyebrow="New Project"
            title="Project Generator"
            body="Convert client information and selected protocols into a structured Project Brief. This creates strategy and a Codex-ready prompt, not code."
          />
          <form className="grid gap-3 border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2">
            <input name="clientName" defaultValue={clientName} placeholder="Client Name" className="border border-neutral-200 px-4 py-3 text-sm" />
            <input name="organization" defaultValue={organization} placeholder="Organization" className="border border-neutral-200 px-4 py-3 text-sm" />
            <input name="website" defaultValue={website} placeholder="Website" className="border border-neutral-200 px-4 py-3 text-sm" />
            <input name="industry" defaultValue={industry} placeholder="Industry" className="border border-neutral-200 px-4 py-3 text-sm" />
            <input name="mission" defaultValue={mission} placeholder="Mission" className="border border-neutral-200 px-4 py-3 text-sm md:col-span-2" />
            <input name="goals" defaultValue={goals} placeholder="Goals, comma separated" className="border border-neutral-200 px-4 py-3 text-sm md:col-span-2" />
            <input name="desiredOutcome" defaultValue={desiredOutcome} placeholder="Desired Outcome" className="border border-neutral-200 px-4 py-3 text-sm" />
            <select name="projectType" defaultValue={projectType} className="border border-neutral-200 px-4 py-3 text-sm">
              {['Website', 'Landing Page', 'Portal', 'Membership Experience', 'Training Experience', 'Event Experience', 'Recruiting Experience', 'Creator Experience'].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <input name="protocols" defaultValue={selectedProtocolIds.join(',')} className="border border-neutral-200 px-4 py-3 text-sm" />
            <input name="repos" defaultValue={selectedRepositoryIds.join(',')} className="border border-neutral-200 px-4 py-3 text-sm" />
            <button className="bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#1B2B4D] md:col-span-2">
              Generate Project Brief and Skin Brief
            </button>
          </form>

          {projectBrief ? (
            <article className="mt-5 border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                Project Brief
              </p>
              <h3 className="mt-2 text-2xl font-black" style={{ color: NAVY }}>
                {projectBrief.clientName}
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{projectBrief.transformationNarrative}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <BriefList title="Current Reality" items={projectBrief.currentReality} />
                <BriefList title="Consider The Possibilities" items={projectBrief.considerThePossibilities} />
                <BriefList title="Story Framework" items={projectBrief.storyFramework} />
                <BriefList title="Module Recommendations" items={projectBrief.moduleRecommendations} />
                <BriefList title="Repo Recommendations" items={projectBrief.repoRecommendations.map((repo) => repo.name)} />
                <BriefList title="Suggested Next Steps" items={projectBrief.suggestedNextSteps} />
                <BriefList title="Build Requirements" items={projectBrief.buildRequirements} />
              </div>
              <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Codex Build Prompt
              </label>
              <textarea readOnly value={projectBrief.codexBuildPrompt} className="mt-2 h-56 w-full border border-neutral-200 bg-[#FAF8F3] p-4 text-sm leading-6" />
            </article>
          ) : null}
        </section>

        <section id="skin-factory" className="scroll-mt-8">
          <SectionHeader
            eyebrow="Creative Direction"
            title="Skin Factory"
            body="Generate visual experience requirements and review packages. Skin Factory creates approved design direction, not code."
          />
          {skinBrief ? (
            <article className="border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-black" style={{ color: NAVY }}>
                {skinBrief.projectName} Skin Brief
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{skinBrief.heroConcept}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <BriefList title="Emotional Goals" items={skinBrief.emotionalGoals} />
                <BriefList title="Color Direction" items={skinBrief.colorDirection} />
                <BriefList title="Layout Direction" items={skinBrief.layoutDirection} />
                <BriefList title="Animation Direction" items={skinBrief.animationDirection} />
                <BriefList title="Review Package" items={skinBrief.reviewPackage} />
                <BriefList title="Approval Checklist" items={skinBrief.approvalPackage.checklist} />
              </div>
            </article>
          ) : (
            <div className="border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-500">
              Generate a Project Brief above to create a Skin Brief, Review Package, Export Package, and Approval Package.
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {['Approval Center', 'Codex Builder', 'Chassis Deployment'].map((item) => (
            <article key={item} className="border border-dashed border-neutral-300 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">Future Placeholder</p>
              <h3 className="mt-2 text-lg font-black" style={{ color: NAVY }}>
                {item}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">Placeholder only. Functionality intentionally not built yet.</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function BriefList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-[#FAF8F3] p-4">
      <h4 className="text-sm font-black" style={{ color: NAVY }}>
        {title}
      </h4>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

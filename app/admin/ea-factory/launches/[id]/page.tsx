import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEACPLaunch, statusLabel } from '@/lib/eacp-launch';
import { CopyCodexPrompt, RepoReviewForm } from './LaunchDetailActions';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EACPLaunchDetailPage({ params }: PageProps) {
  const { id } = await params;
  const launch = await getEACPLaunch(id);

  if (!launch) notFound();

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/admin/ea-factory/launches" className="text-sm font-bold" style={{ color: NAVY }}>
            Back to Launches
          </Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            EACP Build Package
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                {launch.client}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                {launch.goal} / {launch.deliverable} / {launch.industry}
              </p>
            </div>
            <Link href={launch.links.approval} className="bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#1B2B4D]">
              Continue To Approval
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Status" value={statusLabel(launch.status)} />
          <Metric label="Protocols" value={String(launch.protocolNames.length)} />
          <Metric label="Repos" value={String(launch.recommendedRepos.length)} />
          <Metric label="Skin Brief" value={launch.skinBriefId} />
        </section>

        <section className="border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Executive Summary
          </p>
          <h2 className="mt-2 text-2xl font-black" style={{ color: NAVY }}>
            Build package ready
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">{launch.buildPackage.executiveSummary}</p>
          <p className="mt-3 text-sm leading-6 text-neutral-600">{launch.buildPackage.transformationStory}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={`/api/ea-factory/launch/${launch.id}/export?type=json`} className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
              Export JSON
            </a>
            <a href={`/api/ea-factory/launch/${launch.id}/export?type=markdown`} className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
              Export Markdown
            </a>
            <a href={`/api/ea-factory/launch/${launch.id}/export?type=codex`} className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
              Download Build Package
            </a>
            <CopyCodexPrompt prompt={launch.buildPackage.codexBuildPrompt} />
          </div>
        </section>

        <section id="project-brief" className="scroll-mt-8 border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Project Brief
          </p>
          <h2 className="mt-2 text-2xl font-black" style={{ color: NAVY }}>
            {launch.buildPackage.projectBrief.clientName}
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">{launch.buildPackage.projectBrief.transformationVision}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <BriefList title="Current Reality" items={launch.buildPackage.projectBrief.currentReality} />
            <BriefList title="Story Framework" items={launch.buildPackage.projectBrief.storyFramework} />
            <BriefList title="Website Structure" items={launch.buildPackage.projectBrief.websiteStructure} />
            <BriefList title="Recommended Modules" items={launch.buildPackage.recommendedModules} />
          </div>
        </section>

        <section id="skin-brief" className="scroll-mt-8 border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Skin Brief
          </p>
          <h2 className="mt-2 text-2xl font-black" style={{ color: NAVY }}>
            {launch.buildPackage.skinBrief.client_name}
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">{launch.buildPackage.skinBrief.hero_concept}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <BriefList title="Visual Story" items={[launch.buildPackage.skinBrief.visual_story_summary]} />
            <BriefList title="Color Direction" items={launch.buildPackage.skinBrief.color_direction} />
            <BriefList title="Animation Direction" items={launch.buildPackage.skinBrief.animation_direction} />
            <BriefList title="Approval Notes" items={launch.buildPackage.skinBrief.accessibility_notes} />
          </div>
        </section>

        <section className="border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Repo Recommendations
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {launch.recommendedRepos.map((repo) => (
              <article key={repo.id} className="border border-neutral-200 bg-[#FAF8F3] p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black" style={{ color: NAVY }}>{repo.name}</h3>
                  <span className="text-xs font-black" style={{ color: GOLD }}>{repo.compatibilityScore}</span>
                </div>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {repo.reviewStatus} / {repo.requirement}
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{repo.implementationRationale}</p>
                {repo.reviewerNotes ? <p className="mt-2 text-xs text-neutral-500">Notes: {repo.reviewerNotes}</p> : null}
              </article>
            ))}
          </div>
          <RepoReviewForm launchId={launch.id} repos={launch.recommendedRepos.map((repo) => ({
            id: repo.id,
            name: repo.name,
            reviewStatus: repo.reviewStatus,
            requirement: repo.requirement,
            reviewerNotes: repo.reviewerNotes,
          }))} />
        </section>

        <section className="border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Codex Build Prompt
          </p>
          <textarea readOnly value={launch.buildPackage.codexBuildPrompt} className="mt-4 h-96 w-full border border-neutral-200 bg-[#FAF8F3] p-4 text-sm leading-6" />
        </section>

        <section className="border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Audit Trail
          </p>
          <div className="mt-5 space-y-3">
            {launch.auditTrail.map((event) => (
              <article key={event.id} className="border-l-4 border-[#C9A844] bg-[#FAF8F3] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-black" style={{ color: NAVY }}>{event.label}</h3>
                  <span className="text-xs font-bold text-neutral-500">{new Date(event.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-neutral-600">{event.detail}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral-400">{event.actor}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">{label}</p>
      <p className="mt-2 truncate text-lg font-black" style={{ color: NAVY }}>{value}</p>
    </div>
  );
}

function BriefList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-[#FAF8F3] p-4">
      <h3 className="text-sm font-black" style={{ color: NAVY }}>{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

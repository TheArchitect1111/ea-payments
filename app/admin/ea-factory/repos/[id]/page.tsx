import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminLogin from '../../../master/AdminLogin';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import { getRepoIntelligenceById } from '@/lib/ea-factory';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RepoDetailPage({ params }: PageProps) {
  if (!(await hasAdminPageAccess())) return <AdminLogin />;
  const { id } = await params;
  const repo = getRepoIntelligenceById(id);

  if (!repo) notFound();

  return (
    <main className="min-h-screen bg-[#FAF8F3] px-6 py-10 text-neutral-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/ea-factory/repo-library" className="text-sm font-bold" style={{ color: GOLD }}>
          Back to Repo Library
        </Link>
        <section className="mt-5 border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Repo Library
          </p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                {repo.name}
              </h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-neutral-400">
                {repo.category} / {repo.compatibility}
              </p>
            </div>
            <a
              href={repo.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#1B2B4D] px-4 py-2 text-xs font-bold text-white"
            >
              Open Source
            </a>
          </div>
          <p className="mt-5 text-sm leading-6 text-neutral-600">{repo.description}</p>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-5">
          <Score label="Storytelling" value={repo.storytellingScore} />
          <Score label="Animation" value={repo.animationScore} />
          <Score label="Mobile" value={repo.mobileScore} />
          <Score label="Complexity" value={repo.complexityScore} />
          <Score label="Performance" value={repo.performanceScore} />
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <List title="Recommended Use Cases" items={repo.useCases} />
          <List title="Suggested Protocols" items={repo.protocolCompatibility} />
          <List title="Tags" items={repo.tags} />
          <List title="Implementation Strengths" items={repo.strengths} />
        </section>
      </div>
    </main>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-neutral-200 bg-white p-4 text-center shadow-sm">
      <p className="text-3xl font-black" style={{ color: NAVY }}>
        {value}
      </p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</p>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black" style={{ color: NAVY }}>
        {title}
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-[#FAF8F3] px-3 py-1 text-xs font-semibold text-neutral-600">
            {item}
          </span>
        ))}
      </div>
    </article>
  );
}

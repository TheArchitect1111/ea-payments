import { NAVY, GOLD } from '@/lib/design-system';
import Link from 'next/link';
import AdminLogin from '../../master/AdminLogin';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import { EA_FACTORY_REPO_CATEGORIES, searchRepositories } from '@/lib/ea-factory';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? '';
}

export default async function RepoLibraryPage({ searchParams }: PageProps) {
  if (!(await hasAdminPageAccess())) return <AdminLogin />;
  const params = (await searchParams) ?? {};
  const query = value(params, 'q');
  const category = value(params, 'category');
  const favoritesOnly = value(params, 'favorites') === 'true';
  const recommendedOnly = value(params, 'recommended') === 'true';
  const repositories = searchRepositories(query, category, favoritesOnly, recommendedOnly);

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Pulse / EA Factory
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                Repo Library&trade;
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600">
                Search approved repositories, reusable UI systems, scores, recommended use cases, and protocol compatibility.
              </p>
            </div>
            <Link href="/admin/ea-factory/project-generator" className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
              New Project
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <form className="grid gap-3 border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_180px_150px_150px_auto]">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search repos, tags, use cases, protocols..."
            className="min-w-0 border border-neutral-200 px-4 py-3 text-sm outline-none"
          />
          <select name="category" defaultValue={category} className="border border-neutral-200 px-4 py-3 text-sm">
            <option value="">All categories</option>
            {EA_FACTORY_REPO_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 border border-neutral-200 px-4 py-3 text-sm">
            <input type="checkbox" name="favorites" value="true" defaultChecked={favoritesOnly} />
            Favorites
          </label>
          <label className="flex items-center gap-2 border border-neutral-200 px-4 py-3 text-sm">
            <input type="checkbox" name="recommended" value="true" defaultChecked={recommendedOnly} />
            Recommended
          </label>
          <button className="bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#1B2B4D]">
            Filter
          </button>
        </form>

        <section className="grid gap-4 lg:grid-cols-3">
          {repositories.map((repo) => (
            <Link
              key={repo.id}
              href={`/admin/ea-factory/repos/${repo.id}`}
              className="block border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#C9A844]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black" style={{ color: NAVY }}>
                    {repo.name}
                  </h2>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral-400">{repo.category}</p>
                </div>
                {repo.favorite ? <span className="rounded-full bg-[#FAF8F3] px-3 py-1 text-xs font-bold text-neutral-600">Favorite</span> : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{repo.description}</p>
              <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
                <Score label="Story" value={repo.storytellingScore} />
                <Score label="Motion" value={repo.animationScore} />
                <Score label="Mobile" value={repo.mobileScore} />
                <Score label="Complex" value={repo.complexityScore} />
                <Score label="Perf" value={repo.performanceScore} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {repo.protocolCompatibility.slice(0, 3).map((item) => (
                  <span key={item} className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600">
                    {item.replace('EA ', '')}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#FAF8F3] p-2">
      <strong className="block" style={{ color: NAVY }}>{value}</strong>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</span>
    </div>
  );
}

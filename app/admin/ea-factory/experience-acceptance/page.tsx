import { NAVY, GOLD } from '@/lib/design-system';
import Link from 'next/link';
import AdminLogin from '../../../master/AdminLogin';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import { getFactoryProject } from '@/lib/factory-project-store';
import {
  EXPERIENCE_CREATION_WORKER,
  readExperienceCreationBundleFromProject,
} from '@/lib/experience-creation';
import { assessExperienceProviderReadiness } from '@/lib/experience-creation/provider-readiness';
import ExperienceAcceptanceClient from './ExperienceAcceptanceClient';

export const dynamic = 'force-dynamic';

/** Default acceptance subjects (override via ?ids=). */
const DEFAULT_SUBJECTS = [
  { label: 'Robert Brickey', projectId: 'proj-ms6046mq-efc59b' },
  { label: 'Brickey Botanicals', projectId: 'proj-ms5zhphf-49d75b' },
  { label: 'Ascension Circle', projectId: 'proj-ms5xnut4-517551' },
];

export default async function ExperienceAcceptancePage({
  searchParams,
}: {
  searchParams?: Promise<{ ids?: string }>;
}) {
  if (!(await hasAdminPageAccess())) return <AdminLogin />;

  const sp = searchParams ? await searchParams : {};
  const ids = (sp.ids || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const subjects =
    ids.length > 0
      ? ids.map((projectId) => ({ label: projectId, projectId }))
      : DEFAULT_SUBJECTS;

  const readiness = assessExperienceProviderReadiness();
  const rows = [];
  for (const subject of subjects) {
    const project = await getFactoryProject(subject.projectId);
    const bundle = project ? readExperienceCreationBundleFromProject(project) : null;
    const eceOut = project?.context?.outputs
      ?.filter((o) => o.worker === EXPERIENCE_CREATION_WORKER)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .at(-1);
    const conceptIds = ['a', 'b', 'c'].map(
      (_, i) =>
        (project as { conceptPreviewIds?: string[] } | null)?.conceptPreviewIds?.[i] ||
        `workorder-website-p1-concept-${String.fromCharCode(97 + i)}`,
    );
    rows.push({
      label: subject.label,
      projectId: subject.projectId,
      found: Boolean(project),
      client: project?.client || subject.label,
      knowledgeSummary: bundle
        ? {
            name: bundle.knowledge.verifiedIdentity.name,
            claims: bundle.knowledge.claims.length,
            biography: bundle.knowledge.biography.slice(0, 280),
            organizations: bundle.knowledge.organizations.slice(0, 4),
            validation: bundle.knowledge.validation,
          }
        : null,
      mediaSummary: bundle
        ? {
            assets: bundle.media.assets.map((a) => ({
              id: a.id,
              title: a.title || a.kind,
              usageStatus: a.usageStatus || a.rightsStatus,
              license: a.license,
              attribution: a.attribution,
              provider: a.mediaProvider,
              focal: a.focal?.status,
              publicationEligible: a.publicationEligible,
            })),
            typographyLed: bundle.media.intentionalTypographyLed,
          }
        : null,
      premises: bundle?.content.premises.map((p) => p.name) || [],
      compositions:
        bundle?.manifests.map((m) => m.pageStructure.map((s) => s.composition).join(' → ')) ||
        [],
      critic: bundle?.critic || null,
      ecePayload: eceOut?.payload || null,
      websitePreviewUrls: conceptIds.map(
        (id) => `/preview/factory/${subject.projectId}/${id}`,
      ),
      portalPreviewUrls: conceptIds.map(
        (id) => `/preview/factory/${subject.projectId}/${id}/portal`,
      ),
    });
  }

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            EA Factory / Experience Creation / Human Acceptance
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                Acceptance Gate
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                Review research, media, nine website concepts, nine portal concepts, critic scores,
                and warnings before any production deploy. Heuristic-only output is not GO.
              </p>
            </div>
            <Link
              href="/admin/ea-factory/quick-launch"
              className="bg-[#1B2B4D] px-5 py-3 text-xs font-black uppercase tracking-wider text-white"
            >
              Quick Launch
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 border border-neutral-200 bg-white p-5 text-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            Provider readiness
          </p>
          <p className="mt-2 font-semibold" style={{ color: NAVY }}>
            Status: {readiness.status} · packs {readiness.canGeneratePacks ? 'ready' : 'blocked'} ·
            certify {readiness.canCertify ? 'ready' : 'blocked'}
          </p>
          <ul className="mt-2 list-disc pl-5 text-neutral-600">
            {readiness.configurationHints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>

        <ExperienceAcceptanceClient rows={rows} />
      </div>
    </main>
  );
}

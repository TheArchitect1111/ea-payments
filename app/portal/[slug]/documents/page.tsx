import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listPortalDocuments } from '@/lib/portal-document-hub';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client } = await requirePortalModule(slug, 'documents');
  const documents = await listPortalDocuments(slug, client);

  return (
    <PortalSubpage
      slug={slug}
      active="documents"
      kicker="Documents"
      title="Your EA document hub"
      lede="Onboarding materials, assessments, and shared deliverables — starting with the essentials below."
    >
      <ul className="ep-module-list">
        {documents.map((doc) => (
          <li key={`${doc.source}:${doc.href}:${doc.title}`} className="ep-module-card">
            <Link href={doc.href} className="ep-module-card-title">
              {doc.title}
            </Link>
            <p className="ep-module-card-note">{doc.note}</p>
          </li>
        ))}
      </ul>
    </PortalSubpage>
  );
}

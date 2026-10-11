import { portalContentDefault } from '@/lib/bricks/content-portal';
import { listContent } from '@/lib/bricks/content-family';
import CertifiedContentUpload from '@/app/portal/components/CertifiedContentUpload';
import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listPortalDocuments } from '@/lib/portal-document-hub';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client, session } = await requirePortalModule(slug, 'documents');
  // Read back tenant-specific durable defaults after module authorization.
  const certifiedContent = slug.toLowerCase().startsWith('amanda-catherine')
    ? null : await portalContentDefault(slug, 'documents');
  const staff = ['staff','admin','owner'].includes(session.role);
  const savedContent = certifiedContent ? await listContent(
    {organizationId:certifiedContent.organizationId,portalSlug:slug},'documents',
    staff?'staff':'member') : [];
  const documents = await listPortalDocuments(slug, client);

  return (
    <PortalSubpage
      slug={slug}
      active="documents"
      kicker="Documents"
      title="Your EA document hub"
      lede="Tenant uploads, CTP deliverables, and shared Update Hub files — not a generic brochure list."
    >
      {staff && certifiedContent ? <CertifiedContentUpload kind="documents" /> : null}
      <ul className="ep-module-list">
        {savedContent.filter(item=>Boolean(item.body)).map(item=>(
          <li key={item.id} className="ep-module-card">
            <Link href={`/api/portal/content/download?kind=documents&key=${encodeURIComponent(item.key)}`}
              className="ep-module-card-title">{item.title}</Link>
            <p className="ep-module-card-note">{item.visibility==='staff'?'Staff only':'Shared with portal members'} · Private verified download</p>
          </li>
        ))}
        {documents.map((doc) => (
          <li key={`${doc.source}:${doc.href}:${doc.title}`} className="ep-module-card">
            <Link
              href={doc.href}
              className="ep-module-card-title"
              {...(doc.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {doc.title}
            </Link>
            <p className="ep-module-card-note">{doc.note}</p>
          </li>
        ))}
      </ul>
    </PortalSubpage>
  );
}

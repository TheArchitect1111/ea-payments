import { requirePortalModule } from '@/lib/modules/portal-modules';
import { portalContentDefault } from '@/lib/bricks/content-portal';
import { listContent } from '@/lib/bricks/content-family';
import Link from 'next/link';
import { roleAtLeast } from '@/lib/rbac';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import AmandaDeliveryCenter from './AmandaDeliveryCenter';

export const dynamic = 'force-dynamic';

export default async function AmandaDeliveriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { session } = await requirePortalModule(slug, 'documents');
  const isAmanda = slug.toLowerCase().startsWith('amanda-catherine');
  if (!isAmanda) {
    const tenantDefault=await portalContentDefault(slug,'documents');
    const staff=['staff','admin','owner'].includes(session.role);
    const documents=tenantDefault?await listContent({organizationId:tenantDefault.organizationId,portalSlug:slug},'documents',staff?'staff':'member'):[];
    return <PortalSubpage slug={slug} active="documents" kicker="Deliveries"
      title="Your private deliveries" lede="Tenant-only documents and completed work">
      <ul className="ep-module-list">
        {documents.filter(item=>Boolean(item.body)).map(item=>(
          <li className="ep-module-card" key={item.id}>
            <Link className="ep-module-card-title"
              href={`/api/portal/content/download?kind=documents&key=${encodeURIComponent(item.key)}`}>
              {item.title}
            </Link>
            <p className="ep-module-card-note">Access controlled · Private download</p>
          </li>
        ))}
      </ul>
    </PortalSubpage>;
  }
  const isAdmin = Boolean(session.role && roleAtLeast(session.role, 'admin'));
  return (
    <PortalSubpage
      slug={slug}
      active="documents"
      kicker="Amanda Catherine"
      title={isAdmin ? 'Client delivery center' : 'My private deliveries'}
      lede={isAdmin ? 'Deliver finished work, create client access, and see whether each item has been opened.' : 'Your recordings, photos, graphics, documents, and finished work in one private place.'}
    >
      <AmandaDeliveryCenter isAdmin={isAdmin} email={session.email || ''} />
    </PortalSubpage>
  );
}

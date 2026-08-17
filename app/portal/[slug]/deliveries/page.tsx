import { requirePortalModule } from '@/lib/modules/portal-modules';
import { roleAtLeast } from '@/lib/rbac';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import AmandaDeliveryCenter from './AmandaDeliveryCenter';

export const dynamic = 'force-dynamic';

export default async function AmandaDeliveriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { session } = await requirePortalModule(slug, 'documents');
  const isAmanda = slug.toLowerCase().startsWith('amanda-catherine');
  if (!isAmanda) return null;
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

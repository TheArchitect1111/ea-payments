import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalShell } from '@/lib/chassis/PortalShell';
import NewContentRequestForm from './NewContentRequestForm';
import '../../ea-portal.css';

export const dynamic = 'force-dynamic';

export default async function NewContentRequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requirePortalModule(slug, 'update-hub');

  return (
    <PortalShell slug={slug} active="updates">
      <main className="ep-main">
        <div className="ep-welcome">
          <p className="ep-welcome-label">Update Hub™</p>
          <h1 className="ep-welcome-heading">Submit Update Request</h1>
        </div>
        <div className="ep-card">
          <NewContentRequestForm slug={slug} />
        </div>
      </main>
    </PortalShell>
  );
}

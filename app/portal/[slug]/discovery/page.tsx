import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import DiscoveryForm from './DiscoveryForm';
export default async function DiscoveryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requirePortalModule(slug, 'discovery');
  return <PortalSubpage slug={slug} active="discovery" kicker="Discovery" title="Find your next step" lede="Share what is taking time and where you want to grow."><DiscoveryForm slug={slug} /></PortalSubpage>;
}

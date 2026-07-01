import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { BillingPortalButton } from './BillingPortalButton';

export const dynamic = 'force-dynamic';

export default async function PortalBillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requirePortalModule(slug, 'billing');

  return (
    <PortalSubpage
      slug={slug}
      active="home"
      activeModuleId="billing"
      kicker="Billing"
      title="Subscription & invoices"
      lede="Manage your plan, payment method, and invoice history through Stripe's secure billing portal."
    >
      <div className="ep-module-card" style={{ maxWidth: 520 }}>
        <p className="ep-module-card-title">Self-serve billing</p>
        <p className="ep-lede" style={{ marginBottom: '1.25rem' }}>
          Update your card, view invoices, change plans, or cancel your subscription.
        </p>
        <BillingPortalButton />
      </div>
    </PortalSubpage>
  );
}

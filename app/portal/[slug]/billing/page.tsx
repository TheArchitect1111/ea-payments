import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { BillingPortalButton } from './BillingPortalButton';
import AmandaPayments from './AmandaPayments';

export const dynamic = 'force-dynamic';

export default async function PortalBillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { session } = await requirePortalModule(slug, 'billing');
  const isAmanda = slug.toLowerCase().startsWith('amanda-catherine');

  return (
    <PortalSubpage
      slug={slug}
      active="home"
      kicker="Billing"
      title={isAmanda ? 'Payments, invoices & receipts' : 'Subscription & invoices'}
      lede={isAmanda ? 'Pay securely in Canadian dollars and receive your invoice and receipt automatically.' : "Manage your plan, payment method, and invoice history through Stripe's secure billing portal."}
    >
      {isAmanda ? <AmandaPayments email={session.email || ''} /> : null}
      {!isAmanda ? (
      <div className="ep-module-card" style={{ maxWidth: 520 }}>
        <p className="ep-module-card-title">Self-serve billing</p>
        <p className="ep-lede" style={{ marginBottom: '1.25rem' }}>
          Update your card, view invoices, change plans, or cancel your subscription.
        </p>
        <BillingPortalButton />
      </div>
      ) : null}
    </PortalSubpage>
  );
}

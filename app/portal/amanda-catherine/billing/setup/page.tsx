import Link from 'next/link';
import {requirePortalModule} from '@/lib/modules/portal-modules';
import {normalizeRole,roleAtLeast} from '@/lib/rbac';
import {AMANDA_MEMBERSHIPS} from '@/lib/amanda-catherine/config';
export const dynamic='force-dynamic';
export default async function AmandaBillingSetup(){
 const {session}=await requirePortalModule('amanda-catherine','billing');
 const canConfigure=roleAtLeast(normalizeRole(session.role),'staff');
 return <main className="ac-card"><h1>Billing setup</h1><p>Secure payments: {process.env.STRIPE_SECRET_KEY?'connected':'setup required'}.</p>
 <h2>Membership pricing</h2><ul>{AMANDA_MEMBERSHIPS.map(item=><li key={item.id}>{item.name}: {process.env[item.stripePriceEnvKey]?'ready':'pricing to be confirmed'}</li>)}</ul>
 <h2>Payment plans</h2><p>{process.env.AMANDA_FINANCING_URL?'Payment-plan provider connected.':'Amanda must select a payment-plan provider before financing opens.'}</p>
 {canConfigure?<><a data-cta-name="Open Stripe pricing setup" data-cta-key="open-stripe-pricing-setup" href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer">Open Stripe pricing setup</a><p>After creating the approved membership prices, ask your platform administrator to connect their price IDs and Amanda’s selected financing link.</p><Link data-cta-name="Open Amanda settings" data-cta-key="open-amanda-settings" href="/portal/amanda-catherine/owner/settings">Open Amanda settings</Link></>:<Link data-cta-name="Contact Amanda about payment options" data-cta-key="contact-amanda-about-payment-options" href="/portal/amanda-catherine/book">Contact Amanda about payment options</Link>}
 <p><Link data-cta-name="Back to payments" data-cta-key="back-to-payments" href="/portal/amanda-catherine/billing">Back to payments</Link></p></main>;
}

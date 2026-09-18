import { getStripe } from '@/lib/stripe';
import { recordAmandaKitOrder, isAmandaKitSession } from '@/lib/amanda-catherine/practitioner-kit-orders';
import { AMANDA_PRACTITIONER_KIT } from '@/lib/amanda-catherine/practitioner-kit-catalog';
import '../kit.css';

export const dynamic = 'force-dynamic';
export const metadata = {title:'Practitioner Kit Payment | Amanda Catherine',robots:{index:false,follow:false}};

export default async function KitSuccess({searchParams}:{searchParams:Promise<{session_id?:string}>}) {
  const {session_id} = await searchParams;
  let paid = false;let recorded = false;
  if (session_id && /^cs_(?:test_|live_)[a-zA-Z0-9]+$/.test(session_id)) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      if (isAmandaKitSession(session) && session.payment_status==='paid' && session.currency==='cad' && session.amount_total===AMANDA_PRACTITIONER_KIT.priceCad * 100) {
        paid=true;const result = await recordAmandaKitOrder(session);recorded=result.ok;
      }
    } catch { /* Never infer a paid order from a query parameter. */ }
  }
  return <main className="ac-kit-page"><div className="ac-kit-wrap"><p className="ac-kit-eyebrow">AesthetiKine · Practitioner Kit</p><h1>{paid?'Your payment is confirmed.':'Payment has not been confirmed.'}</h1><p>{paid?'Keep your Stripe receipt and contact Amanda to arrange collection or delivery.':'If you completed checkout, retain your Stripe receipt and contact Amanda for help. Otherwise, return to the private purchase page.'}</p>{paid&&!recorded&&<p>Order recording needs attention. Please include your Stripe receipt when contacting Amanda.</p>}<p><a href="mailto:Amanda@aesthetikine.com?subject=Practitioner%20Kit%20order">Contact Amanda about your order</a></p><a href="/amanda-catherine/private/practitioner-kit">Return to the private purchase page</a></div></main>;
}

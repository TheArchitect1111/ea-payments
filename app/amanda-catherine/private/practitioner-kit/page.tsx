import KitCheckout from './KitCheckout';
import { AMANDA_PRACTITIONER_KIT } from '@/lib/amanda-catherine/practitioner-kit-catalog';
import './kit.css';

export const metadata = {title:'Practitioner Kit Private Purchase | Amanda Catherine',robots:{index:false,follow:false}};

export default async function PractitionerKitPage({searchParams}:{searchParams:Promise<{payment?:string}>}) {
  const {payment} = await searchParams;
  return <main className="ac-kit-page"><div className="ac-kit-wrap"><a href="/amanda-catherine#practitioner-essentials">← Back to Amanda Catherine</a><p className="ac-kit-eyebrow">AesthetiKine · Private purchase</p><h1>{AMANDA_PRACTITIONER_KIT.name}</h1><p>{AMANDA_PRACTITIONER_KIT.description} · <strong>${AMANDA_PRACTITIONER_KIT.priceCad} CAD</strong></p><div className="ac-kit-grid"><img src={AMANDA_PRACTITIONER_KIT.artwork} alt="Supplied BODY SCULPT Practitioner Starter Kit artwork, $499 CAD"/><div><h2>Continue to secure checkout.</h2><p>Your payment details are entered directly in Stripe’s hosted checkout.</p><p>Free Pickup (Class / Shop) has no shipping charge. Ship to me adds the approved shipping charge at checkout. For course enrollment, the practitioner kit is included in tuition.</p>{payment==='cancelled'&&<p role="status">Checkout was cancelled. No completed order has been confirmed.</p>}<KitCheckout/><p>Order questions? <a href="mailto:Amanda@aesthetikine.com?subject=Practitioner%20Kit%20order">Amanda@aesthetikine.com</a></p></div></div></div></main>;
}

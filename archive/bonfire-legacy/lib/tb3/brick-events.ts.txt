import clientRegistry from '@/lib/clients/registry.json';
/**
 * TB3 chassis adapter: every TB3 business intake or calendar event goes through
 * registerBrickEvent. This is the only TB3-to-tracking entry point.
 * The business transaction is persisted by the existing TB3 Supabase RPC first.
 * Payment completion must come from a trusted server-side provider verifier.
 * Never send a receipt or paid confirmation from an unverified booking form.
 */
import {registerBrickEvent, type BrickEvent} from '@/lib/services/brickRegistrar';
import {TB3_PORTAL_SLUG} from '@/lib/tb3/contracts';
type Tb3Kind='booking'|'forms'|'calendar'|'classes'|'checkout'|'payments'|'activity';
export async function registerTb3Event(value:{
 brick_type:Tb3Kind;brick_id:string;registration_id:string;name:string;email:string;
 phone?:string;status:string;source:string;timestamp?:string;is_test?:boolean;
 payment_status?:'unpaid'|'paid';payment_reference?:string|null;
},proof?:Parameters<typeof registerBrickEvent>[1]){
 const event:BrickEvent={...value,client_id:TB3_PORTAL_SLUG,phone:value.phone||'',
   timestamp:value.timestamp||new Date().toISOString(),is_test:value.is_test===true,
   payment_status:value.payment_status||'unpaid',payment_reference:value.payment_reference||null};
 return registerBrickEvent(event,proof);
}

/** Bonfire CSV is staff-attested, not provider-verified: never create a paid
 * tracking confirmation from CSV alone. A signed provider webhook can do so. */
export async function trackTb3MerchSale(sale:{order_id:string;offerId:string;customer:string;customer_email:string;payment_reference:string},verifiedProvider=false){
 const {createHash}=await import('node:crypto');
 const registration_id='tb3-merch-'+createHash('sha256').update(sale.order_id).digest('hex').slice(0,40);
 const fields={brick_id:sale.offerId,registration_id,name:sale.customer,email:sale.customer_email,
  phone:'',source:verifiedProvider?'tb3-bonfire-webhook':'tb3-bonfire-csv',is_test:false};
 const signup=await registerTb3Event({...fields,brick_type:'checkout',status:verifiedProvider?'order_received':'seller_attested_paid'});
 if(!signup.ok)throw new Error('TB3 merchandise tracking signup failed');
 if(!verifiedProvider)return {signup};
 const timestamp=new Date().toISOString();
 const payment=await registerTb3Event({...fields,brick_type:'payments',status:'payment_confirmed',
  payment_status:'paid',payment_reference:sale.payment_reference,timestamp},
  {event_type:'payment_confirmed',client_id:TB3_PORTAL_SLUG,registration_id,
  email:sale.customer_email,class_id:sale.offerId,payment_status:'paid',
  payment_reference:sale.payment_reference,payment_provider:'bonfire',timestamp,is_test:false});
 if(!payment.ok)throw new Error('TB3 verified merchandise payment tracking failed');
 return {signup,payment};
}

/** Factory clients use the same payment verification and test isolation as TB3. */
export const clientEventRegistry:Record<string,{name:string;slug:string;portalPath:string;eventAdapter:string}>=clientRegistry;
export async function registerClientEvent(clientId:string,value:Omit<BrickEvent,'client_id'>,proof?:Parameters<typeof registerBrickEvent>[1]) {
 if(!Object.prototype.hasOwnProperty.call(clientEventRegistry,clientId)) return {ok:false,error:'Client is not registered'};
 return registerBrickEvent({...value,client_id:clientId},proof);
}

import {listStudioRecords} from '@/lib/creative-studio/persistence';
import {syntheticOrgId} from '@/lib/platform-store';
import type {AmandaPaymentRecord} from '@/lib/amanda-catherine/payment-fulfillment';
import {listAmandaKitOrders} from '@/lib/amanda-catherine/practitioner-kit-orders';
export const dynamic='force-dynamic';
export default async function AmandaSales(){
 const records=await listStudioRecords<AmandaPaymentRecord>('experience',syntheticOrgId('amanda-catherine'));
 const payments=records.filter(row=>row?.portalSlug==='amanda-catherine'&&row.paymentStatus==='paid'&&!row.isTestAccess);
 const kits=await listAmandaKitOrders();
 return <section><h1>Sales</h1><p>Verified Stripe course, service and membership payments, plus practitioner-kit orders.</p><h2>Payments</h2>{payments.length?<table><thead><tr><th>Customer</th><th>Purchase</th><th>CAD</th><th>Registration</th></tr></thead><tbody>{payments.map(row=><tr key={row.id}><td>{row.email}</td><td>{row.offerId||row.membershipId}</td><td>{row.amountPaidCad.toFixed(2)}</td><td>{row.trackingRegistrationId||'Legacy record'}</td></tr>)}</tbody></table>:<p>No verified sales recorded yet.</p>}<h2>Practitioner kits</h2><ul>{kits.map(row=><li key={row.id}>{row.email} · {row.courseId?'Included with tuition':'Standalone kit'} · {row.fulfillmentStatus}</li>)}</ul></section>;
}

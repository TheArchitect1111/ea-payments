import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminActionFromRequest, adminAuthJsonError } from '@/lib/admin-session-guard';
import { provisionTestsAllowed } from '@/lib/bricks/provision-test';
import { ensureTenantFoundation } from '@/lib/tenant-foundation';
import { installCommerce, registerCommerce, payCommerce, readCommerceOrder, changeMemberGrant } from '@/lib/bricks/commerce-family';

// A synthetic, preview-only provision test. No card is charged and no email is sent.
export async function GET() { return Response.json({error:'Not found'},{status:404}); }
export async function POST(request: NextRequest) {
  if (!provisionTestsAllowed() || !process.env.STRIPE_TEST_SECRET_KEY?.startsWith('sk_test_'))
    return Response.json({error:'Not found'},{status:404});
  const auth=await requireAdminActionFromRequest(request,'admin:manage');
  if(!auth.ok) return adminAuthJsonError(auth);
  try {
    const {runId,kind}=z.object({runId:z.string().regex(/^[a-z0-9-]{8,40}$/),
      kind:z.enum(['billing','events','member'])}).strict().parse(await request.json());
    const portalSlug='cert-'+kind+'-'+runId;
    const {orgId}=await ensureTenantFoundation({portalSlug,clientName:'Commerce certification',
      packagePurchased:'Launch Verification',requestedModuleIds:[kind],assemblyMode:'certified'});
    const tenant={organizationId:orgId,portalSlug};
    const confirmations:unknown[]=[];
    if(kind==='member'){
      const input={email:'test@certification.invalid',memberId:'fixture-1',enabled:true,requestId:runId};
      const first=await changeMemberGrant(tenant,input,async message=>{confirmations.push(message);});
      const second=await changeMemberGrant(tenant,input,async message=>{confirmations.push(message);});
      if(JSON.stringify(first)!==JSON.stringify(second)||confirmations.length!==1)throw Error('Member replay failed');
      return Response.json({ok:true,testOnly:true,kind,member:first,confirmations:1,productionStatus:404});
    }
    const config={offers:[{id:'fixture',title:'Test registration',amount:100,currency:'usd'}],
      confirmationSubject:'Enrollment confirmed',confirmationHtml:'Welcome {{name}} to {{offer}}'};
    await installCommerce(tenant,kind,config);
    const input={email:'test@certification.invalid',name:'Preview Test',offerId:'fixture'};
    const first=await registerCommerce(tenant,kind,input);
    const second=await registerCommerce(tenant,kind,input);
    if(first.id!==second.id)throw Error('Registration replay failed');
    const payment={reference:'pi_test_fixture_'+runId,organizationId:orgId,enrollmentId:first.id,
      offerId:'fixture',amount:100,currency:'usd',paid:true};
    // A controlled provider response fixture, not a real Stripe charge or receipt.
    const ports={verify:async()=>payment,confirm:async(message:unknown)=>{confirmations.push(message);}};
    await payCommerce(tenant,kind,first.id,payment.reference,ports);
    await payCommerce(tenant,kind,first.id,payment.reference,ports);
    const final=await readCommerceOrder(tenant,first.id);
    if(final.payment_status!=='paid'||final.payment_reference!==payment.reference||confirmations.length!==1)
      throw Error('Commerce replay failed');
    return Response.json({ok:true,testOnly:true,simulatedPayment:true,kind,id:first.id,
      payment_status:final.payment_status,confirmations:1,productionStatus:404});
  } catch(error){
    return Response.json({ok:false,error:error instanceof Error?error.message:'Provision failed'},{status:503});
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { getTestTrackingRegistration } from '@/lib/services/trackingPortal';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  const auth=await guardPortalApi(req);
  if(!auth.ok)return portalApiUnauthorized(auth);
  const tenant=portalTenant(auth.session);
  if(!tenant.portalSlug.startsWith('amanda-catherine')||!auth.session.email)
    return NextResponse.json({ok:false,error:'Amanda portal access required'},{status:403});
  const id=req.nextUrl.searchParams.get('registration_id')||'';
  const row=await getTestTrackingRegistration(id);
  if(!row?.is_test)return NextResponse.json({ok:false,error:'Test registration not found'},{status:404});
  if(row.email!==auth.session.email.toLowerCase() &&
    !roleAtLeast(normalizeRole(auth.session.role),'admin'))
    return NextResponse.json({ok:false,error:'Not your test registration'},{status:403});
  return NextResponse.json({
    ok:true,is_test:true,registration_id:row.registration_id,
    class_id:row.class_id,registration_type:row.registration_type,
    payment_status:row.payment_status,payment_reference:row.payment_reference||null,
    timestamp:row.timestamp,confirmation:'Sent after verified checkout when delivery succeeds',
  },{headers:{'Cache-Control':'no-store'}});
}

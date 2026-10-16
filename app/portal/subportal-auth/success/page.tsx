import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {auth} from '@clerk/nextjs/server';
import {subportalDb,type DeliveryRow} from '@/lib/subportal/db';
import {loadSubportalManifest} from '@/lib/subportal/manifest';
import {subportalViewer} from '@/lib/subportal/identity';
export const dynamic='force-dynamic';
export default async function SubportalSuccess({searchParams}:{
  searchParams:Promise<{sessionId?:string}>;
}){
  const {sessionId=''}=await searchParams;
  if(!/^[a-zA-Z0-9_-]{5,180}$/.test(sessionId))notFound();
  const session=await auth();
  if(!session.userId)redirect('/portal/subportal-auth?next='+encodeURIComponent('/portal/subportal-auth/success?sessionId='+sessionId));
  // No browser-trusted payment state. The receipt row only exists after signed webhook fulfillment.
  const rows=await subportalDb<DeliveryRow&{organization_id:string}>('subportal_deliveries',{
    query:{session_id:'eq.'+sessionId,select:'*',limit:'1'},
  });
  const proof=rows[0];
  if(!proof)return <main style={{padding:45,maxWidth:690,margin:'auto'}}>
    <h1>Payment confirmation in progress</h1>
    <p>Your payment provider is being verified. We will email your portal link and receipt when confirmation is complete.</p>
    <a href={'/portal/subportal-auth/success?sessionId='+encodeURIComponent(sessionId)}>Check again</a>
  </main>;
  const manifest=await loadSubportalManifest(proof.organization_id);
  const viewer=await subportalViewer(manifest);
  if(!viewer || viewer.studentId!==proof.student_id)return <main style={{padding:45,maxWidth:690,margin:'auto'}}>
    <h1>Your account needs verification</h1><p>Sign in with the verified email from your purchase confirmation.</p>
  </main>;
  const link=proof.access_link;
  if(!link || !link.startsWith('/portal/'+manifest.orgSlug+'/students/'))notFound();
  return <main style={{padding:45,maxWidth:690,margin:'auto'}}>
    <p>{manifest.brand.name}</p><h1>Your private portal is ready</h1>
    <p>Enrollment verified. Your receipt and next steps have been emailed.</p>
    <Link href={link}>Open your learning portal →</Link>
    <p><Link href={'/api/subportal/receipt?sessionId='+encodeURIComponent(sessionId)}>View your PDF receipt</Link></p>
  </main>;
}

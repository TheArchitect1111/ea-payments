import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE,verifySession } from '@/lib/ea-portal-auth';
import { mockEnabled,mockAllowed,mintMock,verifyMock } from '@/lib/amanda-catherine/frappe-bridge-mock';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
export const dynamic='force-dynamic';
export default async function ClassroomTest(){
 if(!mockEnabled())return <main><h1>Not found</h1></main>;
 const cookie=(await cookies()).get(EA_PORTAL_COOKIE)?.value;
 const session=cookie?await verifySession(cookie):null;
 const permitted=!!session&&session.slug==='amanda-catherine'&&!!session.email&&mockAllowed(session.email);
 const access=permitted?verifyMock(mintMock(session.email!,'wood-therapy-certification')).courseAccess:false;
 return <PortalSubpage slug="amanda-catherine" active="learning" kicker="AesthetiKine Academy" title={access?'Wood Therapy Test':'Classroom access restricted'} lede={access?'Private learning experience preview':'403 · This classroom is not available for your account.'}>{access?<section aria-label="Wood Therapy test classroom"><h2>Welcome to your classroom</h2><div role="img" aria-label="Training video placeholder" style={{background:'#17211c',color:'#fff',padding:64,borderRadius:12}}>Video placeholder · no real student material</div><p>Training Manual.pdf · placeholder</p><p>Progress: 0% · mock, not persisted</p></section>:<section role="alert"><h2>403 · Access denied</h2><p>Contact Amanda if you believe this is an error.</p></section>}</PortalSubpage>
}

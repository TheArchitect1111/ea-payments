import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getClientByPortalSlug } from '@/lib/airtable';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';

export const dynamic = 'force-dynamic';
type PaidRecord = {id:string; fields:Record<string,string|number>};

async function paidActivity():Promise<PaidRecord[]> {
  const base=process.env.AIRTABLE_PAYMENTS_BASE_ID || process.env.AIRTABLE_BASE_ID;
  const token=process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if(!base || !token) return [];
  const records:PaidRecord[]=[];
  let offset='';
  do {
    // The verified Client Records schema has Portal Slug, not instructor.
    const params=new URLSearchParams({filterByFormula:"AND({Portal Slug}='amanda-catherine',{Amount Paid}>0)",pageSize:'100'});
    if(offset)params.set('offset',offset);
    const res=await fetch(`https://api.airtable.com/v0/${base}/Client%20Records?${params}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!res.ok)throw new Error('Unable to load Amanda paid activity');
    const data=await res.json();records.push(...data.records);offset=data.offset || '';
  }while(offset);
  return records;
}

export default async function AmandaActivity(){
  const cookieStore=await cookies();
  const session=verifySession(cookieStore.get(EA_PORTAL_COOKIE)?.value || '');
  if(!session || session.slug!=='amanda-catherine')redirect('/portal/login');
  const owner=await getClientByPortalSlug('amanda-catherine');
  if(!owner)return <section className="amanda-card"><h1>Paid activity</h1><p>Your Amanda portal account could not be loaded.</p></section>;
  let records:PaidRecord[]=[],failed=false;
  try{records=await paidActivity();}catch(e){failed=true;console.error('[Amanda paid activity]',e);}
  return <section className="amanda-card"><p className="amanda-status">AMANDA CATHERINE</p><h1>Paid activity</h1><p>Confirmed payments for Amanda’s courses and packages.</p>
    {records.length ? <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left',borderCollapse:'collapse'}}><thead><tr>{['Name','Email','Package','Amount','Date','Record'].map(h=><th key={h} style={{padding:12,borderBottom:'1px solid #ddd7cb'}}>{h}</th>)}</tr></thead><tbody>{records.map(r=><tr key={r.id}>{[r.fields['Client Name'],r.fields.Email,r.fields['Package Purchased'],String(r.fields['Amount Paid'] ?? ''),r.fields['Payment Date'],r.id].map((value,i)=><td key={i} style={{padding:12,borderBottom:'1px solid #ddd7cb'}}>{String(value || '—')}</td>)}</tr>)}</tbody></table></div>:<p role="status">{failed?'Paid activity is temporarily unavailable. Please refresh shortly.':'No confirmed paid enrollments yet.'}</p>}
    <a className="amanda-button" href="/portal/amanda-catherine/classes">View Classes</a>
  </section>;
}

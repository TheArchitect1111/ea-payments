import {headers} from 'next/headers';
import {notFound,redirect} from 'next/navigation';
import {NextRequest} from 'next/server';
import {guardAdminApi} from '@/lib/api/admin-route';
import {POST as providerTest} from '@/app/api/admin/cigar-ctp/provider-test/route';
import {CIGAR_QUESTIONS,type CigarAnswers} from '@/lib/cigar-ctp/engine';
import {CIGAR_PROVIDER_TEST_PATH} from '@/lib/cigar-ctp/provider-test';
export const dynamic='force-dynamic';
const pagePath='/admin/cigar-ctp/provider-test';
async function adminRequest(path:string,body?:unknown){
 const incoming=new Headers(await headers());
 const host=incoming.get('host');
 if(!host)notFound();
 const origin='https://'+host;
 incoming.set('origin',origin);incoming.set('content-type','application/json');incoming.delete('content-length');
 return new NextRequest(origin+path,{method:body===undefined?'GET':'POST',headers:incoming,...(body===undefined?{}:{body:JSON.stringify(body)})});
}
async function sendTest(form:FormData){
 'use server';
 if(process.env.VERCEL_ENV!=='preview')notFound();
 const role=String(form.get('role'));
 if(!['brand','lounge','distributor'].includes(role))notFound();
 const answers:CigarAnswers={};
 for(const question of CIGAR_QUESTIONS.filter(q=>q.path==='all'||q.path===role))
  answers[question.id]={selected:[question.id==='C01'?role:question.options[0].id],detail:'TEST synthetic assessment. No real client data.'};
 const response=await providerTest(await adminRequest(CIGAR_PROVIDER_TEST_PATH,{
  testOnly:true,consent:form.get('consent')==='on',businessName:'TEST '+role+' Cigar Business',
  contactName:'TEST Owner',email:String(form.get('email')??''),answers,
 }));
 const result=await response.json() as Record<string,unknown>;
 const proof={ok:result.ok,error:result.error,recordId:result.recordId,submissionId:result.submissionId,
  emailStatus:result.emailStatus,emailMessageId:result.emailMessageId,emailSentAt:result.emailSentAt,bookingUrl:result.bookingUrl};
 redirect(pagePath+'?result='+encodeURIComponent(JSON.stringify(proof)));
}
export default async function CigarProviderTestPage({searchParams}:{searchParams:Promise<{result?:string}>}){
 if(process.env.VERCEL_ENV!=='preview')notFound();
 const auth=await guardAdminApi(await adminRequest(pagePath));
 if(!auth.ok)return <main className="p-8"><h1>Cigar provider testing</h1><p>Sign in with an authorized EA administrator account to run TEST submissions.</p></main>;
 let proof:Record<string,unknown>|null=null;
 try{const raw=(await searchParams).result;if(raw)proof=JSON.parse(raw) as Record<string,unknown>;}catch{proof=null;}
 const booking=typeof proof?.bookingUrl==='string'&&/^https:\/\/calendly\.com\//.test(proof.bookingUrl)?proof.bookingUrl:null;
 return <main className="mx-auto max-w-2xl p-8">
  <h1 className="text-3xl font-semibold">Cigar provider testing</h1>
  <p className="my-4">Preview only. This sends one real evaluation email and saves a clearly labeled TEST record. Choose an inbox you control. Customer submissions remain disabled.</p>
  <form action={sendTest} className="space-y-5">
   <label className="block">Test email address<input className="block w-full rounded border p-3" name="email" type="email" required autoComplete="off" /></label>
   <label className="block">Assessment path<select className="block w-full rounded border p-3" name="role" defaultValue="brand"><option value="brand">Cigar brand owner</option><option value="lounge">Cigar lounge owner</option><option value="distributor">Cigar distributor</option></select></label>
   <label className="block"><input name="consent" type="checkbox" required /> I control this test inbox and authorize this TEST email.</label>
   <button className="rounded bg-[#17211c] px-6 py-3 text-white" type="submit">Send TEST evaluation</button>
  </form>
  {proof&&<section aria-live="polite" className="mt-8"><h2 className="text-xl font-semibold">Provider response</h2><pre className="overflow-auto whitespace-pre-wrap rounded bg-stone-100 p-4">{JSON.stringify(proof,null,2)}</pre>{booking&&<a className="mt-4 block underline" href={booking}>Book this TEST Strategy Meeting</a>}</section>}
 </main>;
}

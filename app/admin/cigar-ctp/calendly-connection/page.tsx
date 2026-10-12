import {headers} from 'next/headers';
import {NextRequest} from 'next/server';
import {redirect} from 'next/navigation';
import {GET,POST} from '@/app/api/admin/cigar-ctp/calendly-connection/route';
export const dynamic='force-dynamic';
const pagePath='/admin/cigar-ctp/calendly-connection';
const apiPath='/api/admin/cigar-ctp/calendly-connection';
async function request(body?:unknown){
 const h=new Headers(await headers()),origin='https://'+h.get('host');
 h.set('origin',origin);h.set('content-type','application/json');h.delete('content-length');
 return new NextRequest(origin+apiPath,{method:body===undefined?'GET':'POST',headers:h,...(body===undefined?{}:{body:JSON.stringify(body)})});
}
async function run(form:FormData){
 'use server';
 const action=String(form.get('action'));
 const recordIds=String(form.get('recordIds')??'').split(/[\s,]+/).filter(Boolean);
 const response=await POST(await request({action,recordIds}));
 const result=await response.json();
 redirect(pagePath+'?result='+encodeURIComponent(JSON.stringify(result)));
}
export default async function CalendlyConnectionPage({searchParams}:{searchParams:Promise<{result?:string}>}){
 const response=await GET(await request());
 const config=await response.json() as {ok:boolean;error?:string;tokenConfigured?:boolean;signingConfigured?:boolean;callbackUrl?:string;liveEnabled?:boolean};
 if(!response.ok)return <main className="p-8"><h1>Cigar booking connection</h1><p>{config.error}</p></main>;
 let result:unknown=null;
 try{const raw=(await searchParams).result;if(raw&&raw.length<12000)result=JSON.parse(raw);}catch{result=null;}
 return <main className="mx-auto max-w-3xl space-y-6 p-8">
  <h1 className="text-3xl font-semibold">Cigar booking connection</h1>
  <p>This connects Calendly booking updates to Cigar CTP Lead Intake. Preview accepts TEST records only.</p>
  <dl><dt>Calendly token saved</dt><dd>{config.tokenConfigured?'Yes':'No'}</dd><dt>Booking signature ready</dt><dd>{config.signingConfigured?'Yes':'No'}</dd><dt>Callback</dt><dd className="break-all">{config.callbackUrl}</dd></dl>
  {!config.tokenConfigured&&<p>Save CIGAR_CALENDLY_API_TOKEN as a Secret in this deployment’s Vercel environment, then redeploy. Never enter the token in chat.</p>}
  <form action={run}><input name="action" type="hidden" value="connect"/><button disabled={!config.tokenConfigured} className="rounded bg-[#17211c] px-6 py-3 text-white disabled:opacity-50">Connect booking updates</button></form>
  <form action={run} className="space-y-3"><input name="action" type="hidden" value="sync"/><label className="block">Cigar intake record IDs<input name="recordIds" className="block w-full rounded border p-3" placeholder="Record IDs separated by commas" required/></label><button disabled={!config.tokenConfigured||!config.liveEnabled} className="rounded bg-[#17211c] px-6 py-3 text-white disabled:opacity-50">Verify and sync bookings</button></form>
  <form action={run}><input name="action" type="hidden" value="poll"/><button disabled={!config.tokenConfigured||!config.liveEnabled} className="rounded bg-[#17211c] px-6 py-3 text-white disabled:opacity-50">Run polling check</button><p>Checks the ten least recently checked Cigar records. Production runs this check every five minutes.</p></form>
  {result!==null&&<section aria-live="polite"><h2 className="text-xl font-semibold">Connection response</h2><pre className="overflow-auto whitespace-pre-wrap bg-stone-100 p-4">{JSON.stringify(result,null,2)}</pre></section>}
 </main>;
}

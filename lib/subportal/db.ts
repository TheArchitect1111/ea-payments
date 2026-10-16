/** Server-only REST transport. Privileged keys must NEVER leave server routes. */
import 'server-only';

export type StudentRow = { id:string; email:string; name:string; auth_subject:string|null };
export type EnrollmentRow = { id:string; organization_id:string; student_id:string; offer_id:string;
  payment_reference:string; idempotency_key:string; program_title:string; status:string;
  created_at:string; first_seen_at:string|null };
export type DeliveryRow = { session_id:string; provider:string; student_id:string; enrollment_id:string;
  email_id:string|null; receipt_pdf_base64:string|null; success_page:string|null;
  access_link:string|null; next_steps:string|null;
  delivery_status?:'accepted'|'sent'|'delivered'|'bounced'|'complained'|'failed';
  delivered_at?:string|null; delivery_event_id?:string|null };

function supabaseUrl(){return (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/,'');}
function key(){return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';}
function publicKey(){return process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';}
export function subportalDatabaseConfigured(){return Boolean(supabaseUrl() && key() && publicKey());}
export function subportalPublicConfigured(){return Boolean(supabaseUrl() && publicKey());}
export async function subportalDb<T=Record<string,unknown>>(
  table:string, opts:{method?:'GET'|'POST'|'PATCH';query?:Record<string,string>;payload?:unknown;
  jwt?:string;prefer?:string}={}
):Promise<T[]>{
  if(!/^subportal_[a-z_]+$/.test(table)) throw new Error('Unapproved subportal table');
  const isUser=Boolean(opts.jwt);
  const credential=isUser?publicKey():key();
  if(!supabaseUrl() || !credential) throw new Error('Subportal database connection unavailable');
  const url=new URL(supabaseUrl()+'/rest/v1/'+table);
  for(const [name,value] of Object.entries(opts.query||{}))url.searchParams.set(name,value);
  const res=await fetch(url,{
    method:opts.method||'GET',cache:'no-store',
    headers:{
      apikey:credential,
      Authorization:'Bearer '+(opts.jwt||credential),
      'Content-Type':'application/json',
      Prefer:opts.prefer||'return=representation',
    },
    ...(opts.payload!==undefined?{body:JSON.stringify(opts.payload)}:{}),
    signal:AbortSignal.timeout(12000),
  });
  if(!res.ok) throw new Error('Subportal storage '+res.status+': '+(await res.text()).slice(0,250));
  if(res.status===204)return [];
  return await res.json() as T[];
}
export async function subportalStoreHealth(){
  if(!subportalDatabaseConfigured()) return {ok:false,evidence:'Supabase connection or auth key missing'};
  try{
    // Real database round trips, not file existence or synthetic returns.
    for(const table of ['subportal_students','subportal_enrollments','subportal_progress','subportal_deliveries','subportal_checkout_orders']){
      await subportalDb(table,{query:{select:'*',limit:'0'}});
    }
    return {ok:true,evidence:'Live Supabase Subportal schema responds'};
  }catch(e){return {ok:false,evidence:e instanceof Error?e.message:'Subportal database unavailable'};}
}

import { cache } from 'react';
export type Row = { id: string; fields: Record<string, any> };
export type Field = {name:string; label:string; type:string; required?:boolean; options?:string[]};
export type Course = {key:string; title:string; status:string; description:string; isTest:boolean; square_checkout_url:string|null};
const slug = 'amanda-catherine';
export async function airtable(path:string, init:RequestInit = {}) {
  const base=process.env.AIRTABLE_BASE_ID, token=process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if(!base || !token) throw new Error('Amanda registry is unavailable');
  for(let attempt=0; attempt<4; attempt++) {
    const res=await fetch(`https://api.airtable.com/v0/${path.replace('$base',base)}`, {...init, headers:{Authorization:`Bearer ${token}`, 'Content-Type':'application/json', ...init.headers}, cache:'no-store', signal:AbortSignal.timeout(15000)});
    const data=await res.json();
    if(res.ok) return data;
    if(res.status===429 && attempt<3){await new Promise(r=>setTimeout(r,Math.max(1000*2**attempt,Number(res.headers.get('retry-after') || 0)*1000)));continue;}
    throw new Error(data.error?.message || 'Registry request failed');
  }
  throw new Error('Registry rate limit exceeded');
}
export const schema = cache(async()=> (await airtable('meta/bases/$base/tables')).tables as {id:string;name:string;fields:{id:string;name:string;type:string}[]}[]);
export const table = cache(async(name:string)=>{
 const t=(await schema()).find(t=>t.name===name);if(!t) throw new Error(`Missing registry table: ${name}`);return t;
});
export async function rows(name:string, formula:string):Promise<Row[]> {
 const t=await table(name); const records:Row[]=[];let offset='';
 do {const q=new URLSearchParams({filterByFormula:formula,pageSize:'100'}); if(offset)q.set('offset',offset);const data=await airtable(`$base/${t.id}?${q}`);records.push(...data.records);offset=data.offset || '';}while(offset);
 return records;
}
export const organization=cache(async()=>{
 const result=await rows('Organizations',`OR({Portal Slug}='${slug}',{Slug}='${slug}')`);
 if(result.length!==1 || !result[0].fields['Organization Id'])throw new Error('Amanda organization must resolve uniquely');return result[0];
});
export const registry=cache(async()=>{
 const org=await organization();const orgId=org.fields['Organization Id'];
 const [themes,forms,items]=await Promise.all([
 rows('Chassis Themes',`OR(RECORD_ID()='${org.fields['Theme Id']}',{Organization Id}='${orgId}')`),
 rows('Chassis Forms',`{Organization Id}='${orgId}'`),
 rows('Creative Studio',`AND({Organization ID}='${orgId}',OR(LOWER({Record Type})='course',LOWER({Record Type})='service'))`)]);
 const theme=themes.find(t=>t.id===org.fields['Theme Id']) || themes[0];
 if(!theme)throw new Error('Amanda theme is missing');
 const courses:Course[]=items.map(item=>{const p=JSON.parse(item.fields['Payload JSON'] || '{}');let square_checkout_url:string|null=null;try{const candidate=new URL(String(p.square_checkout_url || ''));if(candidate.protocol==='https:' && candidate.hostname==='checkout.square.site')square_checkout_url=candidate.toString();}catch{}return {key:p.slug || item.fields['Record Key'],title:item.fields.Title,status:String(p.status || 'NOT READY').toUpperCase(),description:p.description || '',isTest:p.isTest===true,square_checkout_url};});
 return {orgId,theme:theme.fields,forms,courses,bookingUrl:org.fields['Booking Url'] as string};
});
export function formDefinition(forms:Row[],id:string) {
 const f=forms.find(f=>f.fields['Form Id']===id);if(!f)throw new Error(`Missing form ${id}`);
 const parsed=JSON.parse(f.fields['Fields JSON'] || '[]');const fields:Field[]=Array.isArray(parsed)?parsed:parsed.fields;
 if(!Array.isArray(fields) || !fields.length || fields.some(f=>!f.name || !f.label || !['text','email','tel','textarea','select','checkbox','number','date','url'].includes(f.type)))throw new Error('Invalid form fields');
 if(fields.some(f=>['type','formId','organizationId','portalSlug','submissionId'].includes(f.name)))throw new Error('Reserved form field');
 return {fields,label:f.fields['Submit Label'] || 'Submit',title:f.fields.Name};
}
export async function create(name:string, values:Record<string,unknown>){
 const t=await table(name);const fields:Record<string,unknown>={};
 for(const [key,value]of Object.entries(values)){if(value===undefined)continue;const field=t.fields.find(f=>f.name===key);if(!field)throw new Error(`Schema drift: ${name}.${key}`);fields[field.id]=value;}
 return airtable(`$base/${t.id}`,{method:'POST',body:JSON.stringify({fields,typecast:true})});
}

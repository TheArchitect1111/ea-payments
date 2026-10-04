import { NextResponse } from 'next/server';
import { listTablesSchema } from '@/lib/amanda-catherine/airtable';

export async function GET(){
  try{
    const schema = await listTablesSchema();
    const tables = (schema.tables||[]).map((t:any)=>({name:t.name, id:t.id, fields: t.fields?.map((f:any)=>f.name).slice(0,30)}));
    const required = ['Portal Form Submissions','amanda_waitlist','Creative Studio','Client Records'];
    const found = required.map(name=>({name, exists: tables.some((t:any)=>t.name===name)}));
    return NextResponse.json({ok:true, baseId: process.env.AIRTABLE_BASE_ID, required, found, tables});
  }catch(e:any){
    return NextResponse.json({ok:false, error:e.message, hint:'Check AIRTABLE_BASE_ID and AIRTABLE_API_KEY env vars in Vercel'}, {status:500});
  }
}

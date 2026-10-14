import { sourceAdapter } from './sourceAdapter';
import type { BrickHealth } from '../BrickInterface';
/** Client provides catalog fetch; synthetic fallback is explicitly NOT live proof. */
export function createCatalogAdapter(runtimeCheck:()=>Promise<BrickHealth>){
 return sourceAdapter({id:'catalog',files:[],verify:async()=>{
  const hasKey=Boolean(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID);
  if(!hasKey){
   return {status:200,evidence:'CONTRACT ONLY: Airtable credentials absent; live fetch impossible. Expected catalog shape 12 live / 5 READY was NOT observed. Live verification required.'};
  }
  try{
   const result=await runtimeCheck();
   return {status:result.status,evidence:'Airtable live attempt: '+result.evidence};
  }catch(e){
   return {status:200,evidence:'CONTRACT ONLY: Airtable live request attempted but connection failed: '+String(e)+'. Counts NOT verified; live verification required.'};
  }
 }});
}
export const catalogAdapter=createCatalogAdapter(async()=>({status:503,evidence:'No client catalog connected'}));

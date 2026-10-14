import { sourceAdapter } from './sourceAdapter';
import type { BrickHealth } from '../BrickInterface';
/** Client supplies its own live catalog check. Never silently substitute fixtures for production truth. */
export function createCatalogAdapter(runtimeCheck:()=>Promise<BrickHealth>){
 return sourceAdapter({id:'catalog',files:[],verify:async()=>{
  try { const outcome=await runtimeCheck();return {status:outcome.status,evidence:'Catalog runtime: '+outcome.evidence}; }
  catch(e){return {status:503,evidence:'Catalog HTTP/registry failure: '+String(e)};}
 }});
}
export const catalogAdapter=createCatalogAdapter(async()=>({status:503,evidence:'No client catalog connected'}));

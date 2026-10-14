import { sourceAdapter } from './sourceAdapter';
import type { BrickHealth } from '../BrickInterface';
/** Generic Jane socket. URL provided by client bootstrap, never by the chassis. */
export function createJaneAdapter(url:string){
 return sourceAdapter({id:'jane',files:[],verify:async():Promise<BrickHealth>=>{
  try {
   const u=new URL(url);
   if(u.protocol!=='https:' || !u.hostname.endsWith('.janeapp.com') || u.hostname==='.janeapp.com' || u.username || u.password)
    return {status:503,evidence:'Client Jane URL rejected by HTTPS host validation'};
   const response=await fetch(u.toString(),{method:'GET',redirect:'follow',signal:AbortSignal.timeout(12000)});
   const final=new URL(response.url);
   const valid=final.protocol==='https:'&&final.hostname.endsWith('.janeapp.com');
   return {status:response.status===200&&valid?200:503,evidence:`Jane HTTP ${response.status}; HTTPS host valid=${valid}`};
  } catch(e){return {status:503,evidence:'Jane check failed: '+String(e)};}
 }});
}

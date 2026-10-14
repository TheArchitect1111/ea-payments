import { sourceAdapter } from './sourceAdapter';
import type { BrickHealth } from '../BrickInterface';
/** URL injected by client configuration. Live connectivity failure never becomes certified 200. */
export function createJaneAdapter(url:string){
 return sourceAdapter({id:'jane',files:[],verify:async():Promise<BrickHealth>=>{
  let u:URL;
  try {u=new URL(url);}catch{return {status:503,evidence:'Invalid client URL'};}
  if(u.protocol!=='https:'||!u.hostname.endsWith('.janeapp.com')||u.hostname==='.janeapp.com'||u.username||u.password)
   return {status:503,evidence:'Jane destination fails HTTPS/hostname validation'};
  try {
   const response=await fetch(u.toString(),{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(12000)});
   const final=new URL(response.url);
   const destinationValid=final.protocol==='https:'&&final.hostname.endsWith('.janeapp.com');
   const ok=response.status>=200&&response.status<400&&destinationValid;
   return {status:ok?200:503,evidence:`Jane LIVE HTTP ${response.status}; finalHost=${final.hostname}; approvedDestination=${destinationValid}`};
  } catch(e){return {status:503,evidence:'Jane HTTP attempted; connection failed: '+String(e)};}
 }});
}

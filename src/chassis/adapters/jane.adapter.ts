import { sourceAdapter } from './sourceAdapter';
const url='https://aesthetikine.janeapp.com/';
export const janeAdapter=sourceAdapter({id:'jane',files:[{path:'lib/amanda-catherine/support-config.ts',contains:url}],verify:async()=>{
try{
const response=await fetch(url,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(12000)});
const valid=new URL(response.url).hostname.endsWith('.janeapp.com');
return {status:response.status===200&&valid?200:503,evidence:`Jane HTTP ${response.status}, final host ${new URL(response.url).hostname}`};
}catch(e){return {status:503,evidence:`Jane connection failed: ${String(e)}`}}
}});

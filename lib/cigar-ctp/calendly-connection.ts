import {ctpCalendlyUrl} from '@/lib/ctp-calendly';
import {cigarCalendlySigningKey} from './calendly-signature';
import {cigarSubmissionIdFromTracking} from './booking-link';
export const CIGAR_PREVIEW_ORIGIN='https://ea-payments-git-feature-fc911c-the-architects-projects-cc813778.vercel.app';
export const CIGAR_PRODUCTION_ORIGIN='https://app.efficiencyarchitects.online';
export class CigarCalendlyConnectionError extends Error {}
type User={uri:string;current_organization:string;scheduling_url:string};
export type ScheduledEvent={uri:string;event_type:string;start_time:string;end_time:string;status:string};
type Invitee={uri:string;email:string;tracking:unknown;status:string};
type Collection<T>={collection:T[];pagination?:{next_page_token?:string|null}};
type Subscription={uri:string;callback_url:string;state:string;events:string[]};
export type MatchedBooking={event:ScheduledEvent;invitee:Invitee};
export function cigarCallbackUrl():string {
 if(process.env.VERCEL_ENV==='preview')return CIGAR_PREVIEW_ORIGIN+'/api/cigar-ctp/calendly/webhook';
 if(process.env.VERCEL_ENV==='production')return CIGAR_PRODUCTION_ORIGIN+'/api/cigar-ctp/calendly/webhook';
 throw new CigarCalendlyConnectionError('Calendly setup is available only on EA Preview or Production.');
}
/** Only fixed Calendly API paths, no redirects or arbitrary provider-returned URLs. */
async function request<T>(path:string,init:RequestInit={},fetcher:typeof fetch=fetch):Promise<T>{
 const token=process.env.CIGAR_CALENDLY_API_TOKEN?.trim();
 if(!token)throw new CigarCalendlyConnectionError('Save CIGAR_CALENDLY_API_TOKEN in Vercel for this environment, then redeploy.');
 if(!path.startsWith('/')||path.startsWith('//'))throw new CigarCalendlyConnectionError('Invalid Calendly API path.');
 const url=new URL(path,'https://api.calendly.com');
 if(url.origin!=='https://api.calendly.com')throw new CigarCalendlyConnectionError('Invalid Calendly API origin.');
 if(/[\r\n]/.test(token))throw new CigarCalendlyConnectionError('The Calendly token must be copied without line breaks.');
 let response:Response;
 try{response=await fetcher(url,{...init,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),
  headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}});}
 catch{throw new CigarCalendlyConnectionError('The Calendly API could not be reached. No booking was inferred.');}
 if(!response.ok)throw new CigarCalendlyConnectionError('Calendly API returned '+response.status+'. Check the token permissions and Calendly plan.');
 return await response.json() as T;
}
async function currentUser(fetcher:typeof fetch):Promise<User>{
 const {resource:user}=await request<{resource:User}>('/users/me',{},fetcher);
 if(!/^https:\/\/api\.calendly\.com\/users\/[^/?#]+$/.test(user.uri)||!/^https:\/\/api\.calendly\.com\/organizations\/[^/?#]+$/.test(user.current_organization))throw new CigarCalendlyConnectionError('Invalid Calendly account response.');
 const expected=new URL(ctpCalendlyUrl()),actual=new URL(user.scheduling_url);
 if(expected.hostname!=='calendly.com'||actual.hostname!=='calendly.com'||actual.pathname.split('/')[1]!==expected.pathname.split('/')[1])
  throw new CigarCalendlyConnectionError('The token belongs to a different Calendly scheduling account. Use the account that owns the EA Strategy Meeting.');
 return user;
}
export async function connectCigarCalendly(fetcher:typeof fetch=fetch){
 const callback=cigarCallbackUrl(),key=cigarCalendlySigningKey();
 if(!key)throw new CigarCalendlyConnectionError('Calendly signing configuration is unavailable.');
 const user=await currentUser(fetcher);
 const query=new URLSearchParams({organization:user.current_organization,user:user.uri,scope:'user',count:'100'});
 const existing=await request<Collection<Subscription>>('/webhook_subscriptions?'+query,{},fetcher);
 if(existing.pagination?.next_page_token)throw new CigarCalendlyConnectionError('Calendly subscription pagination needs review before adding a connection.');
 const matches=existing.collection.filter(x=>x.callback_url===callback&&x.state==='active');
 if(matches.length>1)throw new CigarCalendlyConnectionError('Multiple active Cigar subscriptions exist. Review the duplicate connection before proceeding.');
 if(matches[0]){
  if(!['invitee.created','invitee.canceled'].every(x=>matches[0].events.includes(x)))throw new CigarCalendlyConnectionError('Existing Cigar subscription is missing required booking events.');
  if(!/^https:\/\/api\.calendly\.com\/webhook_subscriptions\/[^/?#]+$/.test(matches[0].uri))throw new CigarCalendlyConnectionError('Invalid existing Calendly subscription response.');
  return {subscriptionId:matches[0].uri,callbackUrl:callback,state:'active',created:false};
 }
 const result=await request<{resource:Subscription}>('/webhook_subscriptions',{method:'POST',body:JSON.stringify({
  url:callback,events:['invitee.created','invitee.canceled'],organization:user.current_organization,user:user.uri,scope:'user',signing_key:key,
 })},fetcher);
 if(result.resource.state!=='active'||result.resource.callback_url!==callback||!/^https:\/\/api\.calendly\.com\/webhook_subscriptions\/[^/?#]+$/.test(result.resource.uri))throw new CigarCalendlyConnectionError('Calendly did not confirm an active Cigar connection.');
 return {subscriptionId:result.resource.uri,callbackUrl:callback,state:result.resource.state,created:true};
}
/** Reads real provider events. Browser-provided IDs/times are never accepted as proof. */
export async function findCigarBooking(email:string,submissionId:string,fetcher:typeof fetch=fetch):Promise<MatchedBooking|null>{
 const user=await currentUser(fetcher),matches:MatchedBooking[]=[];
 const params=new URLSearchParams({user:user.uri,invitee_email:email,status:'active',count:'100',sort:'start_time:asc'});
 let eventPage:string|null=null;
 for(let page=0;page<5;page++){
  if(eventPage)params.set('page_token',eventPage);
  const data=await request<Collection<ScheduledEvent>>('/scheduled_events?'+params,{},fetcher);
  for(const event of data.collection){
   const match=/^https:\/\/api\.calendly\.com\/scheduled_events\/([^/?#]+)$/.exec(event.uri);
   if(!match||event.status!=='active')continue;
   const inviteeParams=new URLSearchParams({email,status:'active',count:'100'});
   let inviteePage:string|null=null;
   for(let i=0;i<5;i++){
    if(inviteePage)inviteeParams.set('page_token',inviteePage);
    const invitees=await request<Collection<Invitee>>('/scheduled_events/'+encodeURIComponent(match[1])+'/invitees?'+inviteeParams,{},fetcher);
    for(const invitee of invitees.collection){
     if(invitee.status==='active'&&invitee.email.toLowerCase()===email.toLowerCase()&&cigarSubmissionIdFromTracking(invitee.tracking)===submissionId&&invitee.uri.startsWith(event.uri+'/invitees/'))matches.push({event,invitee});
    }
    inviteePage=invitees.pagination?.next_page_token??null;
    if(!inviteePage)break;
    if(i===4)throw new CigarCalendlyConnectionError('Calendly invitee pagination limit reached. No booking was inferred.');
   }
  }
  eventPage=data.pagination?.next_page_token??null;
  if(!eventPage)break;
  if(page===4)throw new CigarCalendlyConnectionError('Calendly event pagination limit reached. No booking was inferred.');
 }
 if(matches.length>1)throw new CigarCalendlyConnectionError('More than one active Calendly booking matches this assessment. Review before updating.');
 return matches[0]??null;
}

/** Booking attribution for the Cigar-only CTP journey. No person/PII in tracking parameters. */
import {ctpCalendlyUrl} from '@/lib/ctp-calendly';

export const CIGAR_CALENDLY_CAMPAIGN='ea-cigar-ctp';

export function cigarBookingUrl(submissionId?:string):string {
 const raw=ctpCalendlyUrl();
 if(!submissionId || !/^CIGAR-[a-f0-9-]{36}$/i.test(submissionId))return raw;
 try{
  const url=new URL(raw);
  if(url.protocol!=='https:' || url.hostname!=='calendly.com' && !url.hostname.endsWith('.calendly.com'))return raw;
  url.searchParams.set('utm_source',CIGAR_CALENDLY_CAMPAIGN);
  url.searchParams.set('utm_content',submissionId);
  return url.toString();
 }catch{return raw;}
}
export function cigarSubmissionIdFromTracking(tracking:unknown):string|null {
 if(!tracking || typeof tracking!=='object')return null;
 const fields=tracking as Record<string,unknown>;
 if(fields.utm_source!==CIGAR_CALENDLY_CAMPAIGN)return null;
 const id=fields.utm_content;
 return typeof id==='string'&&/^CIGAR-[a-f0-9-]{36}$/i.test(id)?id:null;
}

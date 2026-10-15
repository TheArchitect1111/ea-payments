/** Single CTA policy consumes the effective status supplied by Amanda's registry. */
import type { Course } from './registry';

export function getCTA(course: Pick<Course,'key'|'status'|'square_checkout_url'>) {
  const status=course.status.trim().toLowerCase();
  if(status==='available') {
    if(!course.square_checkout_url) throw new Error('Available Amanda class missing Square checkout: '+course.key);
    return {label:'Buy Now' as const, action:course.square_checkout_url, kind:'checkout' as const};
  }
  return {label:status==='inquiry'?'Request Info' as const:'Join Waitlist' as const,
    action:'/courses/'+encodeURIComponent(course.key)+'#waitlist',kind:'waitlist' as const};
}
export function amandaClassCopy(description:string, available:boolean):string {
  const text=description.trim();
  if(available)return text&&!/waitlist|availability updates/i.test(text)?text:'Explore this program with Amanda.';
  return 'Join the waitlist for availability updates.';
}

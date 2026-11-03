import type { Course } from './registry';
export function getCTA(course: any) {
  const status = (course.status || '').trim().toLowerCase();
  const title = (course.title || '').toLowerCase();
  const key = (course.key || '').toLowerCase();
  // FINAL OVERRIDE - Wood Therapy always $1 test
  if (title.includes('wood therapy')) {
    const isBrick = key.includes('brick');
    return {
      label: isBrick ? 'TEST - Brick - No Pay Full Workflow' : 'TEST - Amanda - $1 Pay Full Workflow',
      action: `/api/ea-payments/test-checkout?product=wood-therapy-training&amount=100&currency=CAD&test=true&email=brickmail1@gmail.com&key=${encodeURIComponent(course.key || '')}`,
      kind: 'checkout'
    };
  }
  if(status==='available') {
    if(!course.square_checkout_url) throw new Error('Missing checkout: '+course.key);
    return {label:'Register', action:course.square_checkout_url, kind:'checkout'};
  }
  if(status==='inquiry') return {label:'Request Info', action:'/amanda-catherine#contact',kind:'inquiry'};
  return {label:'Join Waitlist', action:'/courses/'+encodeURIComponent(course.key)+'#waitlist',kind:'waitlist'};
}
export function amandaClassCopy(d:string,a:boolean){return d.trim();}

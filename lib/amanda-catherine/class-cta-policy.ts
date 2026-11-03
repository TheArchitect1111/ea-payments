import type { Course } from './registry';

export function getCTA(course: any) {
  const status = course.status.trim().toLowerCase();
  const isTest = course.isTest === true;
  const title = course.title?.toLowerCase() || '';
  const isWood = title.includes('wood therapy');
  
  // BP4: Force both Wood Therapy test links to $1 fake cc - NOT $997
  if (isTest && isWood && status === 'available') {
    const testUrl = `/api/ea-payments/test-checkout?product=wood-therapy-training&amount=100&currency=CAD&test=true&fake_cc=true&email=brickmail1@gmail.com`;
    return {
      label: course.key?.includes('brick') ? 'TEST - Brick - No Pay Full Workflow' : 'TEST - Amanda - $1 Pay Full Workflow',
      action: testUrl,
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

export function amandaClassCopy(description:string, available:boolean):string {
  const text=description.trim();
  if(available)return text&&!/waitlist|availability updates/i.test(text)?text:'Explore this program with Amanda.';
  return 'Join the waitlist for availability updates.';
}

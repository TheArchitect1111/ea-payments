import type { Course } from './registry';

export function getCTA(course: any) {
  const status = (course.status || '').trim().toLowerCase();
  const title = (course.title || '').toLowerCase();
  const key = (course.key || '').toLowerCase();
  const label = (course.label || '').toLowerCase();
  
  const isWood = title.includes('wood therapy') || key.includes('wood') || label.includes('wood');
  const isTestLink = course.isTest === true || key.includes('test') || title.includes('test') || label.includes('test') || key.includes('brick');

  // BP4 FIX: Force BOTH test links to $1 - ignore Airtable $997 URL
  if (isWood && isTestLink && status === 'available') {
    const testUrl = `/api/ea-payments/test-checkout?product=wood-therapy-training&amount=100&currency=CAD&test=true&fake_cc=true&email=brickmail1@gmail.com`;
    return {
      label: key.includes('brick') ? 'TEST - Brick - No Pay Full Workflow' : 'TEST - Amanda - $1 Pay Full Workflow',
      action: testUrl,
      kind: 'checkout',
      amount: 100
    };
  }

  // Also catch if it's wood therapy but somehow status available - force $1 if test in URL params
  if(status==='available') {
    if(!course.square_checkout_url) throw new Error('Missing checkout: '+course.key);
    // If URL is the $997 one but this is a test, override
    if (course.square_checkout_url.includes('checkout.square.site') && (isWood && (key.includes('test') || title.includes('test')))) {
      return {
        label: 'TEST - $1 Pay Full Workflow',
        action: `/api/ea-payments/test-checkout?product=wood-therapy-training&amount=100&currency=CAD&test=true&fake_cc=true&email=brickmail1@gmail.com`,
        kind: 'checkout'
      };
    }
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

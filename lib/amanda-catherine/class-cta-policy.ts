export function getCTA(course: any) {
  const title = (course.title || '').toLowerCase();
  const key = (course.key || '').toLowerCase();
  if (title.includes('wood therapy')) {
    return {
      label: key.includes('brick') ? 'TEST - Brick - No Pay Full Workflow' : 'TEST - Amanda - $1 Pay Full Workflow',
      action: `/api/ea-payments/test-checkout?product=wood-therapy-training&amount=100&currency=CAD&test=true&email=brickmail1@gmail.com&key=${encodeURIComponent(course.key || '')}`,
      kind: 'checkout'
    };
  }
  const status = (course.status || '').trim().toLowerCase();
  if(status==='available') {
    if(!course.square_checkout_url) throw new Error('Missing checkout: '+course.key);
    return {label:'Register', action:course.square_checkout_url, kind:'checkout'};
  }
  if(status==='inquiry') return {label:'Request Info', action:'/amanda-catherine#contact',kind:'inquiry'};
  return {label:'Join Waitlist', action:'/courses/'+encodeURIComponent(course.key)+'#waitlist',kind:'waitlist'};
}
export function amandaClassCopy(d:string,a:boolean){return d.trim();}

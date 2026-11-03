export function getCTA(course: any) {
  const title = (course.title || '').toLowerCase();
  const key = (course.key || '').toLowerCase();
  if (title.includes('wood therapy')) {
    const product = 'wood-therapy-training';
    const email = 'brickmail1@gmail.com';
    const enrollUrl = `/amanda-catherine/enroll/${product}?test=1&success=true&paid=1&email=${encodeURIComponent(email)}&amount=100&currency=CAD&workflow=premium&key=${encodeURIComponent(course.key || '')}`;
    return {
      label: key.includes('brick') ? 'TEST - Brick - No Pay Full Workflow' : 'TEST - Amanda - $1 Pay Full Workflow',
      action: enrollUrl,
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

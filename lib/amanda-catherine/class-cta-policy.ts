export function getCTA(course: any) {
  const t = (course.title||'').toLowerCase()
  if (t.includes('wood therapy')) {
    return [
      { label: 'TEST - Amanda - $1 Pay Full Workflow', action: '/amanda-catherine/enroll/wood-therapy-training?test=1&success=true&paid=1&email=brickmail1@gmail.com&amount=100&currency=CAD&workflow=premium&key=wood-therapy', kind: 'checkout' },
      { label: 'TEST - Brick - No Pay Full Workflow', action: '/amanda-catherine/enroll/wood-therapy-training?test=1&success=true&paid=0&email=brickmail1@gmail.com&amount=0&currency=CAD&workflow=premium&key=brick-test', kind: 'checkout' }
    ]
  }
  const s = (course.status||'').toLowerCase()
  if (s==='available') return {label:'Register',action:course.square_checkout_url,kind:'checkout'}
  return {label:'Join Waitlist',action:'/courses/'+course.key+'#waitlist',kind:'waitlist'}
}
export function amandaClassCopy(d:string,a:boolean){return d.trim()}

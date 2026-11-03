export function getCTA(course: any) {
  const t = (course.title||'').toLowerCase()
  if (t.includes('wood therapy')) {
    return { label: 'TEST - $1 Full Workflow (Amanda + Brick)', action: '/amanda-catherine/test-wood-therapy', kind: 'checkout' as const }
  }
  const s = (course.status||'').toLowerCase()
  if (s==='available') return {label:'Register',action:course.square_checkout_url,kind:'checkout' as const}
  return {label:'Join the waitlist',action:'/courses/'+encodeURIComponent(course.key)+'#waitlist',kind:'waitlist' as const}
}
export function amandaClassCopy(d:string,a:boolean){return d.trim()}

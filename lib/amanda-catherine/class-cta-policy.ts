export function getCTA(course: any) {
  const s = (course.status||'').toLowerCase()
  if (s==='available') return {label:'Register',action:course.square_checkout_url,kind:'checkout' as const}
  return {label:'Join Waitlist',action:'/courses/'+course.key+'#waitlist',kind:'waitlist' as const}
}
export function amandaClassCopy(d:string,a:boolean){return d.trim()}

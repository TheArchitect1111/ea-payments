import { writeToTable } from './airtable'
export async function handleAmandaSubmit(p:any){
  const safe = (fn:Promise<any>) => fn.catch((e:any)=>console.error(e.message))
  await Promise.all([
    safe(writeToTable('Portal Form Submissions',{Email:p.email,Name:p.name,Phone:p.phone,Type:p.type,Course:p.courseId,FormId:p.formId,Created:new Date().toISOString()})),
    (p.type==='enroll'||p.type==='kit') ? safe(writeToTable('Client Records',{Email:p.email,Name:p.name,Status:'Active Enrolled',Course:p.courseId})) : Promise.resolve(),
    (p.type==='enroll'||p.type==='kit') ? safe(writeToTable('Creative Studio',{Email:p.email,Offer:p.courseId,Type:p.type})) : Promise.resolve(),
    p.type==='waitlist' ? safe(writeToTable('amanda_waitlist',{Email:p.email,Name:p.name,Course:p.courseId})) : Promise.resolve(),
  ])
}

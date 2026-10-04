import { NextRequest, NextResponse } from 'next/server'
import { handleAmandaSubmit } from '@/lib/amanda-catherine/storage'
export async function POST(req: NextRequest) {
  const fd = await req.formData().catch(()=>null)
  const type = (fd?.get('type') as string) || 'enroll'
  const payload = {
    type: type as any,
    email: fd?.get('email') as string,
    name: fd?.get('name') as string,
    phone: fd?.get('phone') as string,
    courseId: (fd?.get('courseId') || fd?.get('course_id')) as string,
    formId: fd?.get('formId') as string,
  }
  try { await handleAmandaSubmit(payload) } catch(e:any){ console.error('Airtable fail, continuing', e.message) }
  const url = new URL('/portal/amanda-catherine/thank-you', req.url)
  url.searchParams.set('type', type)
  return NextResponse.redirect(url, 303)
}

import { NextRequest, NextResponse } from 'next/server';
import { handleAmandaSubmit } from '@/lib/amanda-catherine/storage';

export async function POST(req: NextRequest){
  try{
    const contentType = req.headers.get('content-type') || '';
    let data: any = {};
    if(contentType.includes('application/json')){
      data = await req.json();
    } else {
      const form = await req.formData();
      form.forEach((v,k)=> data[k]=String(v));
    }

    console.log('[amanda submit in]', data);

    // Normalize
    if(!data.type){
      if(data.courseId || data.course) data.type = data.formId ? 'enroll' : 'waitlist';
      if(data.formId && !data.courseId) data.type = 'application';
    }
    if(data.course && !data.courseId) data.courseId = data.course;
    if(data.form && !data.formId) data.formId = data.form;

    // If it's from /amanda-catherine/courses/[slug] page (waitlist form)
    if(data['Course interested in'] || data.course_interested_in){
      data.type = 'waitlist';
      data.courseId = data['Course interested in'] || data.course_interested_in;
    }

    const result = await handleAmandaSubmit(data);

    // If request came from fetch (JSON), return JSON
    if(contentType.includes('application/json')){
      return NextResponse.json({ok:true, result});
    }

    // Form POST from portal pages -> redirect to thank-you with record info
    const url = new URL('/portal/amanda-catherine/thank-you', req.url);
    url.searchParams.set('type', data.type || 'submission');
    if(data.courseId) url.searchParams.set('course', data.courseId);
    return NextResponse.redirect(url);

  }catch(e:any){
    console.error('[amanda submit error]', e);
    return NextResponse.json({ok:false, error:e.message, stack: e.stack}, {status:500});
  }
}

export async function GET(){
  return NextResponse.json({
    ok:true,
    endpoint: 'POST /api/amanda-catherine/submit',
    expects: { type: 'enroll|waitlist|application|kit', name:'', email:'', courseId:'', formId:'' },
    writesTo: ['Creative Studio','Client Records','Portal Form Submissions','amanda_waitlist'],
    portalLinked: true
  });
}

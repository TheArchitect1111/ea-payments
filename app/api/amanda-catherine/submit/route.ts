import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest){
  try{
    const form = await req.formData();
    const type = String(form.get('type') || '');
    const data: any = {};
    form.forEach((v,k)=>{ data[k]=String(v); });

    // TODO: wire to Airtable tables
    // enroll -> Creative Studio + Portal Form Submissions + Client Records
    // waitlist -> amanda_waitlist
    // application -> Portal Form Submissions

    console.log('[amanda-catherine submit]', type, data);

    return NextResponse.redirect(new URL('/portal/amanda-catherine/thank-you?type='+encodeURIComponent(type), req.url));
  }catch(e:any){
    return NextResponse.json({ok:false, error:e?.message||'error'}, {status:500});
  }
}

export async function GET(){
  return NextResponse.json({ok:true, endpoint:'POST /api/amanda-catherine/submit', tables:['Creative Studio','Portal Form Submissions','Client Records','amanda_waitlist']});
}

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let courseId = '';
    let amandaCourseId = '';
    let paymentOption = '';
    let portalSlug = 'amanda-catherine';

    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      courseId = String(formData.get('courseId') || '');
      amandaCourseId = String(formData.get('amandaCourseId') || '');
      paymentOption = String(formData.get('paymentOption') || '');
      portalSlug = String(formData.get('portalSlug') || 'amanda-catherine');
    } else {
      try {
        const body = await req.json();
        courseId = body.courseId || '';
        amandaCourseId = body.amandaCourseId || '';
        paymentOption = body.paymentOption || '';
        portalSlug = body.portalSlug || 'amanda-catherine';
      } catch {
        const text = await req.text();
        if (text.includes('courseId=')) {
          const params = new URLSearchParams(text);
          courseId = params.get('courseId') || '';
          amandaCourseId = params.get('amandaCourseId') || '';
          paymentOption = params.get('paymentOption') || '';
          portalSlug = params.get('portalSlug') || 'amanda-catherine';
        }
      }
    }

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    if (!stripeKey.startsWith('sk_test_')) {
      return NextResponse.json({ error: 'Test checkout blocked - live key active. Set sk_test_ for $1 test.' }, { status: 400 });
    }

    const isTest = courseId.startsWith('test-') || paymentOption === 'test';
    const realCourseId = courseId.replace('test-', '');
    
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any });
    
    const amount = isTest ? 100 : 10000; // $1 for test, $100 for real placeholder - adjust as needed
    const origin = req.headers.get('origin') || `https://${req.headers.get('host')}` || 'https://ea-payments-dsa7r64yf-the-architects-projects-cc813778.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: isTest ? `[TEST $1] ${realCourseId}` : realCourseId,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/portal/amanda-catherine/learning/${courseId}?success=true`,
      cancel_url: `${origin}/portal/amanda-catherine/learning/${courseId}?canceled=true`,
      metadata: {
        courseId,
        amandaCourseId: amandaCourseId || realCourseId,
        portalSlug,
        paymentOption: paymentOption || (isTest ? 'test' : 'full'),
      },
    });

    // If form POST - redirect to Stripe, if JSON - return url
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      return NextResponse.redirect(session.url!, 303);
    }
    
    return NextResponse.json({ url: session.url });

  } catch (e: any) {
    console.error('Checkout error:', e);
    return NextResponse.json({ error: e.message || 'Checkout failed' }, { status: 500 });
  }
}

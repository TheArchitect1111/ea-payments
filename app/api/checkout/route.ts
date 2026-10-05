import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getCatalogItem } from '@/lib/catalog';
import { AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
import { registry, rows } from '@/lib/amanda-catherine/registry';

export const dynamic = 'force-dynamic';

interface CheckoutBody {
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  packageId?: string;
  referralSource?: string;
  course?: string;
  instructor?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;
    if (body.instructor === 'amanda-catherine' && body.course) body.packageId = body.course;
    const { name, organization, email, phone, packageId, referralSource } = body;

    if (!name?.trim() || !email?.trim() || !packageId?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and package selection are required.' },
        { status: 400 }
      );
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment processing is not yet configured. Please contact us directly.' },
        { status: 503 }
      );
    }

    // Amanda course checkout is isolated from the existing EA package path.
    if (body.instructor === 'amanda-catherine') {
      const courseId = (body.course || packageId).trim();
      const { courses, orgId } = await registry();
      const course = courses.find(c => c.key === courseId && !c.isTest);
      if (!course) return NextResponse.json({ error: 'Invalid Amanda course selected.' }, { status: 400 });
      const records = await rows('Creative Studio', `AND({Organization ID}='${orgId}',OR(LOWER({Record Type})='course',LOWER({Record Type})='service'))`);
      const record = records.find(r => { const p = JSON.parse(r.fields['Payload JSON'] || '{}'); return (p.slug || r.fields['Record Key']) === courseId; });
      const payload = JSON.parse(record?.fields['Payload JSON'] || '{}');
      const offer = AMANDA_OFFERS.find(o => o.courseId === courseId);
      const configuredPrice = typeof payload.stripePriceId === 'string' && /^price_[A-Za-z0-9]+$/.test(payload.stripePriceId) ? payload.stripePriceId : null;
      const priceCad = offer?.priceCad ?? payload.priceCad;
      const amount = typeof priceCad === 'number' ? Math.round(priceCad * 100) : 0;
      if (!configuredPrice && (!Number.isSafeInteger(amount) || amount <= 0)) {
        return NextResponse.json({ error: 'This Amanda course has no configured price. Please contact Amanda.' }, { status: 503 });
      }
      const baseUrl = new URL(req.url).origin;
      const session = await getStripe().checkout.sessions.create({
        mode: 'payment', payment_method_types: ['card'], customer_email: body.email!.trim(),
        line_items: [configuredPrice ? { price: configuredPrice, quantity: 1 } : {
          price_data: { currency: 'cad', unit_amount: amount, product_data: { name: course.title } }, quantity: 1,
        }],
        metadata: { portalSlug: 'amanda-catherine', instructor: 'amanda-catherine', courseId, packageId: courseId, packageName: course.title, clientName: body.name!.trim(), organization: orgId },
        payment_intent_data: { receipt_email: body.email!.trim() },
        success_url: `${baseUrl}/portal/amanda-catherine/thank-you?course=${encodeURIComponent(courseId)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/portal/amanda-catherine/classes?course=${encodeURIComponent(courseId)}&checkout=true`,
      });
      if (!session.url) return NextResponse.json({ error: 'Failed to create Amanda checkout session.' }, { status: 502 });
      return NextResponse.json({ url: session.url });
    }

    const item = getCatalogItem(packageId.trim());
    if (!item) {
      return NextResponse.json({ error: 'Invalid package selected.' }, { status: 400 });
    }

    const stripePriceId = process.env[item.stripePriceEnvKey];
    if (!stripePriceId) {
      return NextResponse.json(
        {
          error:
            'This package is not yet available for online purchase. Please contact us to arrange payment.',
        },
        { status: 503 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const stripe = getStripe();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card', 'us_bank_account'],
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: email.trim(),
      metadata: {
        clientName: name.trim(),
        organization: organization?.trim() ?? '',
        phone: phone?.trim() ?? '',
        packageId: item.id,
        packageName: item.airtablePackageName,
        referralSource: referralSource?.trim() ?? '',
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    };

    if (item.priceCents > 50000) {
      sessionParams.custom_text = {
        after_submit: {
          message:
            'ACH bank transfer is recommended for this amount. It carries lower processing fees. Select "US Bank Account" if available at checkout.',
        },
      };
    }

    if (item.priceCents > 250000) {
      sessionParams.invoice_creation = { enabled: true };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Checkout failed: ${msg}` }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { sendInternalNotification } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name?: string;
      email?: string;
      organization?: string;
      message?: string;
      intent?: string;
    };

    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const message = String(body.message ?? '').trim();
    const organization = String(body.organization ?? '').trim();
    const intent = String(body.intent ?? 'general').trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
    }

    const result = await sendInternalNotification({
      subject: `Website contact — ${name}`,
      title: 'New contact request',
      body: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Organization: ${organization || 'Not provided'}`,
        `Intent: ${intent}`,
        '',
        message,
      ].join('\n'),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Unable to send message.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}

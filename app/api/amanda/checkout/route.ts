import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = body.email || 'student@amanda.local'
  
  // TODO: Replace with real Stripe checkout session
  // For now, return fake checkout URL that goes to test-session
  // Real implementation: stripe.checkout.sessions.create + webhook sets ea_session
  
  const previewUrl = 'https://ea-payments-git-poc-ama-b13cfd-the-architects-projects-cc813778.vercel.app'
  
  return NextResponse.json({
    ok: true,
    stub: true,
    message: "V3.2c stub - replace with Stripe",
    checkout_url: `${previewUrl}/api/ea/bridge/test-session?redirect=/amanda&email=${email}`,
    next_step: "In real Stripe: webhook POST /api/ea/bridge/session with payment_intent -> sets ea_session cookie"
  })
}

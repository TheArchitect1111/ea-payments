import { NextRequest, NextResponse } from 'next/server'

function getLetterHtml(buyerName = 'Family') {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;"><div style="max-width:650px;margin:0 auto;background:white;"><div style="background:black;padding:20px;text-align:center;"><img src="https://tb3.online/tb3/logo.png" alt="TB3 Logo" style="max-width:100%;"/></div><div style="padding:40px 30px;"><div style="font-size:22px;font-weight:900;">FAMILY! 🙏 - ${buyerName}</div><p>Thank you for copping TB3 merch - you just became part of something bigger than basketball.</p><p><strong>SAME VISION. HIGHER PURPOSE.<br>DISCIPLINE. DETERMINATION. DEVELOPMENT. DESTINY.<br>THE NEXT CHAPTER.</strong></p><div style="background:#f9f9f9;border-left:4px solid #A51C30;padding:18px;margin:25px 0;"><div style="font-size:9px;letter-spacing:0.25em;color:#A51C30;font-weight:900;">JOIN THE TB3 CIRCLE</div><p style="font-size:13px;">✓ Tag <strong>@tarrisbouie</strong> wearing your merch - I'll repost every one</p><p style="font-size:13px;">✓ Exclusive first access to next drop - 24hrs before public</p><p style="font-size:13px;">✓ Private Discord: Game breakdowns, training tips, life talks</p><p style="font-size:13px;">✓ Your code <strong>TB3FAM10</strong> = 10% off next order for family</p></div><div style="background:black;color:white;padding:20px;margin:25px 0;"><div style="font-size:9px;letter-spacing:0.25em;font-weight:900;">ROLL TIDE - UPCOMING BAMA GAMES</div><div style="margin-top:12px;font-size:13px;"><div style="padding:8px 0;border-bottom:1px solid #222;">Nov 3 vs Sam Houston - 7:30 PM EST - Coleman Coliseum</div><div style="padding:8px 0;border-bottom:1px solid #222;">Nov 6 vs Arkansas State - 7:30 PM EST - Home</div><div style="padding:8px 0;border-bottom:1px solid #222;">Dec 12 vs St. John's - Legacy Arena, Birmingham (C.M. Newton Classic)</div><div style="padding:8px 0;">SEC Play Tips - January - rolltide.com</div></div><p style="font-size:11px;opacity:0.6;margin-top:12px;">Wear your TB3 merch to the game!</p></div><div style="text-align:center;margin:30px 0;"><a href="https://instagram.com/tarrisbouie" style="display:inline-block;background:black;color:white;padding:12px 24px;text-decoration:none;font-weight:900;font-size:11px;margin:5px;">FOLLOW ON IG</a><a href="https://tb3.online/tarris" style="display:inline-block;background:white;color:black;border:1px solid black;padding:12px 24px;text-decoration:none;font-weight:900;font-size:11px;margin:5px;">TB3.ONLINE</a><a href="https://tarris-bouie-shop.fourthwall.com" style="display:inline-block;background:#A51C30;color:white;padding:12px 24px;text-decoration:none;font-weight:900;font-size:11px;margin:5px;">SHOP AGAIN</a></div><p style="font-size:14px;">This is just the beginning. More than a game - it's a movement. Thank you for believing in the vision.</p><p>With love,</p></div><div style="padding:30px;border-top:1px solid #eee;"><img src="https://tb3.online/tb3/signature.png" alt="Tarris Signature" style="width:140px;"/><div style="margin-top:8px;font-weight:900;letter-spacing:0.2em;font-size:12px;">TARRIS BOUIE #4</div><div style="font-size:10px;opacity:0.6;">ALABAMA CRIMSON TIDE | MORE THAN A GAME</div><div style="margin-top:15px;"><a href="https://tb3.online/tarris" style="font-size:11px;color:black;font-weight:700;margin-right:12px;text-decoration:none;">tb3.online/tarris</a><a href="https://tarris-bouie-shop.fourthwall.com" style="font-size:11px;color:black;font-weight:700;margin-right:12px;text-decoration:none;">Shop TB3</a></div></div></div></body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}))
    const email = body.email || body.customer_email || body.data?.email || body.customer?.email
    const name = body.customer_name || body.name || body.customer?.name || 'Family'
    const orderId = body.id || body.order_id || body.data?.id

    if (!email) {
      return NextResponse.json({ ok: false, error: 'No email in payload' }, { status: 400 })
    }

    const html = getLetterHtml(name)
    
    // Try Resend if key exists
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Tarris Bouie <tarris@tb3.online>',
          to: email,
          subject: `Thank You Fam! 🏈🐘 - Welcome to TB3`,
          html: html,
        })
      })
      const data = await res.json()
      console.log('[TB3 Email] Resend response:', data)
      return NextResponse.json({ ok: true, sent: true, to: email, resend: data, orderId })
    }

    // Fallback - no key, just log preview
    console.log(`[TB3 Welcome] Would send to ${email} - ${name} - Order ${orderId}`)
    return NextResponse.json({ ok: true, sent: false, preview: `RESEND_API_KEY missing - would send to ${email}`, to: email })

  } catch (e:any) {
    console.error(e)
    return NextResponse.json({ ok:false, error:e.message }, { status:500 })
  }
}

export async function GET() {
  return new NextResponse(getLetterHtml('Family'), { headers: { 'Content-Type': 'text/html' } })
}

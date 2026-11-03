"use client";
import { amandaCourses } from "@/lib/amanda-catherine/registry"
import { amandaClassCopy, getCTA } from "@/lib/amanda-catherine/class-cta-policy"
import { useState } from "react"

export default function AmandaClassesGrid() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSingleTestCheckout(courseKey: string) {
    setLoading(courseKey);
    try {
      // SINGLE $1 REUSABLE LINK - Works for Amanda + Brick
      // Calls the route we fixed in #619: app/api/portal/amanda/checkout/route.ts
      const res = await fetch('/api/portal/amanda/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: 'wood-therapy-training', // or use courseKey
          paymentOption: 'test',
          testName: 'Single $1 Test',
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe $1 checkout
      } else {
        alert(data.error || 'Checkout failed - check console');
        console.error(data);
        setLoading(null);
      }
    } catch (e) {
      console.error(e);
      alert('Checkout error');
      setLoading(null);
    }
  }

  return (
    <div className="amanda-grid">
      {amandaCourses.map((c:any) => {
        const title = (c.title||'').toLowerCase()
        const isWood = title.includes('wood therapy')
        const available = (c.status||'').toLowerCase() === 'available'
        if (isWood) {
          return (
            <article className="amanda-card" key={c.key}>
              <h2>{c.title}</h2>
              <p>{amandaClassCopy(c.description, available)}</p>
              {c.price!==null&&<p>{'$'+c.price.toLocaleString('en-US')} CAD</p>}
              <div className="flex flex-wrap gap-3">
                <button 
                  className="amanda-button" 
                  onClick={() => handleSingleTestCheckout(c.key)}
                  disabled={loading === c.key}
                >
                  {loading === c.key ? 'Creating $1 Link...' : 'TEST - $1 Pay Full Workflow - Single Reusable Link (Amanda + Brick)'}
                </button>
              </div>
              <p className="text-xs mt-2 opacity-70">Use test card: 4242 4242 4242 4242 | 12/34 | 123 - Works for both Amanda + Brick - Email + Subportal</p>
            </article>
          )
        }
        const ctas = getCTA(c)
        const cta = Array.isArray(ctas) ? ctas[0] : ctas
        const href = cta?.action
        const label = cta?.label || (available ? 'Register' : 'Join Waitlist')
        return (
          <article className="amanda-card" key={c.key}>
            <h2>{c.title}</h2>
            <p>{amandaClassCopy(c.description,available)}</p>
            {c.price!==null&&<p>{'$'+c.price.toLocaleString('en-US')} CAD</p>}
            <div className="flex flex-wrap gap-3">
              {href?<a className={available ? "amanda-button" : "amanda-button amanda-button--outline"} href={href} data-cta-name={label} data-course-key={c.key} data-cta-key={`${available?'register':'join-waitlist'}-${c.key}`}>{label}</a>:<span role="status">Checkout temporarily unavailable</span>}
            </div>
          </article>
        )
      })}
    </div>
  )
}

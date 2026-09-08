import Link from 'next/link';
import { AMPLIFI_CUSTOMER_ZERO } from '@/lib/amplifi-customer-zero';

export const metadata = { title: 'Amplifi Customer Zero | One Brief. Everywhere.' };

export default function CustomerZeroPage() {
  return <main style={{maxWidth:1180,margin:'0 auto',padding:'42px 22px 80px'}}>
    <header style={{display:'flex',justifyContent:'space-between',gap:24,alignItems:'flex-start',marginBottom:34}}>
      <div><p style={{letterSpacing:'.16em',textTransform:'uppercase',opacity:.58}}>Amplifi · Customer Zero</p><h1 style={{fontSize:'clamp(3rem,7vw,6.5rem)',lineHeight:.9,margin:'10px 0 18px'}}>One Brief.<br/>Everywhere.</h1><p style={{maxWidth:720,fontSize:'1.15rem',lineHeight:1.6}}>{AMPLIFI_CUSTOMER_ZERO.objective}</p></div>
      <Link href="/amplifi/create?mode=campaign" style={{textDecoration:'none'}}>Create campaign →</Link>
    </header>

    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:16,marginBottom:34}}>
      {AMPLIFI_CUSTOMER_ZERO.briefs.map((brief,index)=><article key={brief.id} style={{border:'1px solid rgba(127,127,127,.22)',borderRadius:24,padding:24}}>
        <span style={{opacity:.48}}>0{index+1}</span><h2>{brief.creativeHook}</h2><p><strong>Goal:</strong> {brief.goal}</p><p><strong>Audience:</strong> {brief.audience}</p><p><strong>Offer:</strong> {brief.offer}</p><Link href={`/amplifi/create?mode=campaign&customerZero=${encodeURIComponent(brief.id)}`}>Build this campaign →</Link>
      </article>)}
    </section>

    <section style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:22,marginBottom:34}}>
      <article style={{border:'1px solid rgba(127,127,127,.22)',borderRadius:24,padding:26}}><p style={{opacity:.55}}>POSITIONING</p><h2>{AMPLIFI_CUSTOMER_ZERO.positioning}</h2><p>{AMPLIFI_CUSTOMER_ZERO.proofMechanism}</p></article>
      <article style={{border:'1px solid rgba(127,127,127,.22)',borderRadius:24,padding:26}}><p style={{opacity:.55}}>MEASURE</p><h2>Prove the funnel, not the slogan.</h2><ul>{AMPLIFI_CUSTOMER_ZERO.metrics.map(metric=><li key={metric}>{metric.replaceAll('_',' ')}</li>)}</ul></article>
    </section>

    <section style={{border:'1px solid rgba(127,127,127,.22)',borderRadius:24,padding:26}}><p style={{opacity:.55}}>GUARDRAILS</p><h2>What Amplifi may claim</h2><ul>{AMPLIFI_CUSTOMER_ZERO.guardrails.map(item=><li key={item}>{item}</li>)}</ul><p style={{marginTop:20}}><strong>Primary CTA:</strong> {AMPLIFI_CUSTOMER_ZERO.primaryCta}</p></section>
  </main>;
}

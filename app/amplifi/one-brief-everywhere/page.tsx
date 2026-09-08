import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'One Brief. Everywhere. | Amplifi',
  description: 'Give Amplifi the goal. Get the campaign.',
};

const examples = [
  {
    prompt: 'Fill Tuesday afternoons.',
    detail: 'A barber wants more midweek appointments.',
    href: '/amplifi/create?mode=campaign&customerZero=barber-fill-midweek',
    image: '/api/amplifi/post-image?title=Fill%20Tuesday%20afternoons.&subhead=One%20goal.%20A%20whole%20campaign.&brand=Amplifi&layout=editorial-split&format=portrait&v=5',
  },
  {
    prompt: 'Sell out Mother’s Day brunch.',
    detail: 'A restaurant wants every table spoken for.',
    href: '/amplifi/create?mode=campaign&customerZero=restaurant-mothers-day',
    image: '/api/amplifi/post-image?title=Sell%20out%20Mother%E2%80%99s%20Day%20brunch.&subhead=One%20goal.%20A%20whole%20campaign.&brand=Amplifi&layout=promotion-offer&format=portrait&v=5',
  },
  {
    prompt: 'Get 20 consultations this month.',
    detail: 'A consultant wants qualified conversations.',
    href: '/amplifi/create?mode=campaign&customerZero=consultant-consultations',
    image: '/api/amplifi/post-image?title=Get%2020%20consultations%20this%20month.&subhead=One%20goal.%20A%20whole%20campaign.&brand=Amplifi&layout=story-proof&format=portrait&v=5',
  },
];

export default function OneBriefEverywherePage() {
  return <main style={{maxWidth:1220,margin:'0 auto',padding:'48px 22px 90px'}}>
    <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:70}}>
      <Link href="/amplifi" style={{fontWeight:800,textDecoration:'none'}}>Amplifi</Link>
      <Link href="/amplifi/create?mode=campaign" style={{textDecoration:'none'}}>Create my campaign →</Link>
    </nav>

    <header style={{maxWidth:900,marginBottom:64}}>
      <p style={{letterSpacing:'.16em',textTransform:'uppercase',opacity:.5}}>AMPLIFI PRESENTS</p>
      <h1 style={{fontSize:'clamp(4rem,10vw,9rem)',lineHeight:.84,letterSpacing:'-.055em',margin:'12px 0 28px'}}>One Brief.<br/>Everywhere.</h1>
      <p style={{fontSize:'clamp(1.2rem,2.6vw,2rem)',lineHeight:1.4,maxWidth:780}}>You have a business to run. Marketing should not become another one. Give Amplifi the goal. Get the campaign.</p>
    </header>

    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:18,marginBottom:80}}>
      {examples.map(example => <article key={example.prompt} style={{border:'1px solid rgba(127,127,127,.18)',borderRadius:28,overflow:'hidden'}}>
        <Image src={example.image} alt={example.prompt} width={1080} height={1350} unoptimized style={{width:'100%',height:'auto',display:'block'}} />
        <div style={{padding:24}}><h2 style={{fontSize:'1.7rem',margin:'0 0 10px'}}>{example.prompt}</h2><p style={{opacity:.68,lineHeight:1.55}}>{example.detail}</p><Link href={example.href}>See Amplifi build it →</Link></div>
      </article>)}
    </section>

    <section style={{textAlign:'center',padding:'90px 20px',borderTop:'1px solid rgba(127,127,127,.18)'}}>
      <p style={{letterSpacing:'.14em',textTransform:'uppercase',opacity:.5}}>NO MARKETING BRIEF REQUIRED</p>
      <h2 style={{fontSize:'clamp(2.8rem,7vw,6rem)',lineHeight:.95,margin:'16px auto 24px',maxWidth:900}}>Tell Amplifi what you want to happen.</h2>
      <p style={{maxWidth:680,margin:'0 auto 30px',fontSize:'1.15rem',lineHeight:1.6}}>Amplifi turns the goal into strategy, copy, graphics, a coordinated post sequence and the next useful action.</p>
      <Link href="/amplifi/create?mode=campaign" style={{display:'inline-block',padding:'16px 24px',border:'1px solid currentColor',borderRadius:999,textDecoration:'none'}}>Create my sample campaign</Link>
    </section>
  </main>;
}

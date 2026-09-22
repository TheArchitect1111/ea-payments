import Link from 'next/link';
import '../../portal/tb3-run12b/tb3-run15.css';

const modules = [
  ['Athlete Development','Training plans, academics and progress in one place.'],
  ['NIL & Brand','Opportunities, partnerships and brand readiness.'],
  ['Media Library','Approved photography, video and campaign assets.'],
  ['Community','Impact, appearances and relationships that matter.'],
  ['Eva','Guided assistance throughout the Player One journey.'],
  ['TB3 Store','A direct path to the future TB3 collection.'],
];

export default function TarrisBouieExperience(){
 return <main className="tb3-public">
  <section className="tb3-public-hero"><div>
   <p className="tb3-public-eyebrow">PLAYER ONE · TARRIS BOUIE</p>
   <h1>TB3</h1>
   <h2>BUILT FOR MORE.</h2>
   <p className="tb3-public-copy">The official digital home for Tarris Bouie. Athlete. Story. Brand. Community. Future.</p>
   <div className="tb3-public-actions"><Link href="/portal/login?next=/portal/tarris-bouie">ENTER TB3 HQ</Link><Link href="/portal/tarris-bouie/store">TB3 STORE</Link></div>
  </div></section>
  <section className="tb3-public-modules"><p>PLAYER ONE SYSTEM</p><h3>ONE HOME.<br/>EVERY PART OF THE JOURNEY.</h3><div className="tb3-public-grid">{modules.map(([title,copy],index)=><Link key={title} href={index===5?'/portal/tarris-bouie/store':'/portal/login?next=/portal/tarris-bouie'}><b>{title}</b><span>{copy}</span><em>EXPLORE →</em></Link>)}</div></section>
  <section className="tb3-public-final"><h3>Different On Purpose.</h3><Link href="/portal/login?next=/portal/tarris-bouie">ENTER TB3 HQ</Link></section>
 </main>;
}

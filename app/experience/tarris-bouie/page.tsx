import Link from 'next/link';
import '../../portal/tb3-run12b/tb3-run15.css';

const asset = '/assets/tarris/authentic';
const tiles = [
  ['ATHLETE','Game. Skills. Growth. A higher level.','LEARN MORE','journey','03-spire-drive-horizontal.jpg'],
  ['STORY','The journey. The mindset. The why.','READ HIS STORY','journey','verified-tarris-hoodie-front.jpg'],
  ['BRAND','TB3 is bigger than basketball.','EXPLORE THE BRAND','nil-brand','07-spire-closeup-cutout.png'],
  ['NIL','Opportunities. Partnerships. Impact.','NIL INQUIRIES','opportunities','02-alabama-signed-graphic.jpg'],
  ['COMMUNITY','Investing in the next generation.','SEE THE IMPACT','community','04-basketball-camp-community.png'],
] as const;

export default function TarrisBouieExperience(){
 return <main className="tb3-site">
  <header className="tb3-site-nav">
   <a className="tb3-site-mark" href="#home"><b>TB<span>3</span></b><small>TARRIS BOUIE<br/>MORE THAN A GAME</small></a>
   <nav>{['HOME','ATHLETE','STORY','BRAND','NIL','COMMUNITY','MEDIA','MERCH','FUTURE'].map(x=><a key={x} href={'#'+x.toLowerCase()}>{x}</a>)}</nav>
   <Link className="tb3-site-redbtn" href="/portal/login?next=/portal/tarris-bouie">ENTER TB3 HQ →</Link>
  </header>
  <section id="home" className="tb3-site-hero">
   <div className="tb3-site-rail">STUDENT<br/>ATHLETE<br/>BRAND<br/>IMPACT<i></i><br/><br/>SAME<br/>VISION.<br/>HIGHER<br/>PURPOSE.</div>
   <div className="tb3-site-hero-copy"><div className="tb3-site-giant">TB<span>3</span></div><p className="tb3-site-more">MORE THAN A GAME</p><div className="tb3-site-actions"><a className="tb3-site-redbtn" href="#media">▶ WATCH THE STORY</a><Link className="tb3-site-outline" href="/portal/login?next=/portal/tarris-bouie">ENTER TB3 HQ →</Link></div></div>
   <img className="tb3-site-hero-person" src={asset+'/09-alabama-portrait-cutout.png'} alt="Tarris Bouie"/>
   <aside><strong>DISCIPLINE<br/>DETERMINATION<br/>DEVELOPMENT<br/>DESTINY</strong><i></i><blockquote>“A PLATFORM<br/>BIGGER THAN<br/>BASKETBALL.”</blockquote><small>— TARRIS BOUIE</small></aside>
  </section>
  <section className="tb3-site-tiles">{tiles.map(([h,p,c,module,img])=><article id={h.toLowerCase()} key={h}><img src={asset+'/'+img} alt={h+' — Tarris Bouie'}/><div><h2>{h}</h2><p>{p}</p><Link href={'/portal/tarris-bouie/'+module}>{c} →</Link></div></article>)}</section>
  <section id="media" className="tb3-site-media"><div><p className="tb3-site-eyebrow">MEDIA</p><h2>HIGHLIGHTS.<br/>INTERVIEWS.<br/>MORE TO COME.</h2><p>Get an inside look at Tarris on and off the court. Game highlights, interviews, training, community and exclusive content.</p><Link className="tb3-site-redbtn" href="/portal/tarris-bouie/media">WATCH NOW →</Link></div><Link className="tb3-site-feature" href="/portal/tarris-bouie/media"><img src={asset+'/09-alabama-next-chapter.png'} alt="The Journey Continues"/><span>▶</span></Link><div className="tb3-site-playlist">Game Highlights<br/>Interview: The Mindset<br/>Training Day<br/>Community Impact<br/><Link href="/portal/tarris-bouie/media">VIEW ALL VIDEOS →</Link></div></section>
  <section className="tb3-site-future"><article id="enterprise"><div><h2>ENTERPRISE</h2><p>Business. Education.<br/>Long-term opportunities.</p><Link href="/portal/tarris-bouie/opportunities">LEARN MORE →</Link></div><img src={asset+'/verified-tarris-hoodie-front.jpg'} alt="Tarris Bouie enterprise"/></article><article id="future"><div><h2>THE FUTURE</h2><p>More than a player.<br/>A platform for what’s next.</p><Link href="/portal/tarris-bouie/journey">SEE THE VISION →</Link></div><img src={asset+'/07-spire-closeup-cutout.png'} alt="Tarris Bouie future"/></article><article className="tb3-site-playerone"><h2>PLAYER ONE</h2><p>A student. An athlete. A brand.<br/>A platform. The next chapter starts now.</p><Link className="tb3-site-outline tb3-site-light" href="/portal/login?next=/portal/tarris-bouie">ENTER TB3 HQ →</Link></article></section>
  <section id="merch" className="tb3-site-store"><div><h2>TB<span>3</span> STORE</h2><b>WEAR THE VISION</b><p>Premium gear for a bigger purpose.<br/>Rep TB3 and be part of the journey.</p><Link className="tb3-site-redbtn" href="/portal/tarris-bouie/store">SHOP TB3 →</Link></div><img src={asset+'/03-spire-drive-horizontal.jpg'} alt="TB3 collection"/><aside>HOODIES<br/>TEES<br/>HATS<br/>AND MORE</aside></section>
  <footer><div className="tb3-site-mark"><b>TB<span>3</span></b><small>TARRIS BOUIE<br/>MORE THAN A GAME</small></div><nav><a href="#home">HOME</a><a href="#story">ABOUT</a><Link href="/portal/tarris-bouie/messages">CONTACT</Link><Link href="/legal/privacy">PRIVACY</Link><Link href="/legal/terms">TERMS</Link></nav><strong>Different<br/>On Purpose.</strong></footer>
 </main>;
}

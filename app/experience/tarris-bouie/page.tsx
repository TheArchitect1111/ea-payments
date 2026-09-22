import Link from 'next/link';
import '../../portal/tb3-run12b/tb3-run15.css';

export default function TarrisBouieExperience(){
 return <main style={{minHeight:'100vh',background:'#050505',color:'#fff',fontFamily:'Arial, sans-serif'}}>
  <section style={{maxWidth:1100,margin:'0 auto',padding:'64px 24px 24px',textAlign:'center'}}>
   <p style={{fontSize:12,letterSpacing:'.32em',fontWeight:800,color:'#aaa'}}>PLAYER ONE • TARRIS BOUIE</p>
   <h1 style={{fontSize:'clamp(64px,14vw,160px)',lineHeight:.82,margin:'24px 0 20px',fontWeight:950,fontStyle:'italic',letterSpacing:'-.09em'}}>TB3</h1>
   <p style={{fontSize:'clamp(28px,5vw,58px)',fontWeight:900,letterSpacing:'-.04em',margin:'0 0 18px'}}>BUILT FOR MORE.</p>
   <p style={{maxWidth:650,margin:'0 auto 34px',color:'#b8b8b8',fontSize:17,lineHeight:1.65}}>The official digital home for Tarris Bouie. Athlete. Story. Brand. Community. Future.</p>
   <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
    <Link href="/portal/login?next=/portal/tarris-bouie" style={{background:'#fff',color:'#050505',padding:'15px 26px',borderRadius:999,textDecoration:'none',fontWeight:900,fontSize:12,letterSpacing:'.12em'}}>ENTER TB3 HQ</Link>
    <Link href="/portal/tarris-bouie/store" style={{border:'1px solid #444',color:'#fff',padding:'15px 26px',borderRadius:999,textDecoration:'none',fontWeight:800,fontSize:12,letterSpacing:'.12em'}}>TB3 STORE</Link>
   </div>
  </section>
  <section style={{maxWidth:1000,margin:'28px auto 0',padding:'0 20px 70px'}}>
   <img src="/benchmarks/tb3-hq-approved-reference.jpg" alt="TB3 HQ" style={{display:'block',width:'100%',height:'auto',borderRadius:22,border:'1px solid #222',boxShadow:'0 28px 90px rgba(0,0,0,.65)'}}/>
  </section>
 </main>;
}

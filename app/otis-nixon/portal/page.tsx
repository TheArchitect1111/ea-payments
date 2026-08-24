export default function OtisNixonPortal(){
  const card={background:'#fff',border:'1px solid #e7e2d7',borderRadius:22,padding:24,boxShadow:'0 10px 30px rgba(20,20,20,.05)'};
  const nav=['Overview','Book Sales','Bookings','Calendar','Partners','Automation'];
  return <main style={{minHeight:'100vh',background:'#f7f5ef',color:'#171717',fontFamily:'Inter,Arial,sans-serif'}}>
    <div style={{display:'grid',gridTemplateColumns:'230px 1fr',minHeight:'100vh'}}>
      <aside style={{background:'#111',color:'#fff',padding:'34px 24px',display:'flex',flexDirection:'column',gap:30}}>
        <div><div style={{fontSize:25,fontWeight:800,letterSpacing:'-.04em'}}>Otis <span style={{color:'#d8b75b'}}>Nixon</span></div><div style={{fontSize:11,letterSpacing:'.16em',marginTop:6,color:'#bdbdbd'}}>BUSINESS PORTAL</div></div>
        <nav style={{display:'grid',gap:10}}>{nav.map((n,i)=><div key={n} style={{padding:'12px 14px',borderRadius:12,background:i===0?'#2a2a2a':'transparent',color:i===0?'#fff':'#bdbdbd',fontWeight:i===0?700:500}}>{n}</div>)}</nav>
        <div style={{marginTop:'auto',fontSize:12,color:'#9b9b9b',lineHeight:1.55}}>Eva is active<br/>Smartchitecture connected</div>
      </aside>
      <section style={{padding:'34px 4vw 50px'}}>
        <header style={{display:'flex',justifyContent:'space-between',gap:24,alignItems:'center',marginBottom:26}}>
          <div><div style={{fontSize:12,letterSpacing:'.16em',color:'#9b772a',fontWeight:800}}>PLAYER · SPEAKER · MINISTER · AUTHOR</div><h1 style={{fontSize:'clamp(34px,4vw,58px)',letterSpacing:'-.05em',margin:'8px 0 0'}}>The business behind the legacy.</h1></div>
          <div style={{background:'#111',color:'#fff',borderRadius:999,padding:'12px 18px',fontWeight:700,whiteSpace:'nowrap'}}>Eva · 4 actions completed</div>
        </header>
        <div style={{...card,padding:0,overflow:'hidden',marginBottom:22}}><img src="/otis-nixon/approved-hero-20260824.webp" alt="Otis Nixon player speaker minister" style={{width:'100%',height:'220px',objectFit:'cover',objectPosition:'center',display:'block'}}/></div>
        <section style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(150px,1fr))',gap:16,marginBottom:22}}>
          {[['142','Books sold','This month'],['$4,820','Book revenue','This month'],['6','Speaking bookings','Confirmed'],['18','Open opportunities','Eva tracking']].map(([n,l,s])=><div key={l} style={card}><div style={{fontSize:32,fontWeight:850,letterSpacing:'-.04em'}}>{n}</div><div style={{fontWeight:750,marginTop:5}}>{l}</div><div style={{fontSize:12,color:'#777',marginTop:4}}>{s}</div></div>)}
        </section>
        <section style={{display:'grid',gridTemplateColumns:'1.35fr .65fr',gap:20,marginBottom:22}}>
          <div style={card}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 style={{margin:0,fontSize:24}}>Revenue & activity</h2><span style={{fontSize:12,color:'#777'}}>Last 30 days</span></div>
            {[['Keeping It Real','67 orders','$2,010'],['Signed / bulk orders','75 books','$2,250'],['Speaking deposits','3 received','$560']].map(r=><div key={r[0]} style={{display:'grid',gridTemplateColumns:'1.4fr .8fr .6fr',gap:14,padding:'18px 0',borderBottom:'1px solid #eee9df'}}><b>{r[0]}</b><span style={{color:'#666'}}>{r[1]}</span><b style={{textAlign:'right'}}>{r[2]}</b></div>)}
          </div>
          <div style={{...card,background:'#111',color:'#fff'}}><div style={{fontSize:12,letterSpacing:'.15em',color:'#e7c66c',fontWeight:800}}>EVA · NEXT BEST ACTION</div><h2 style={{fontSize:28,letterSpacing:'-.04em',margin:'12px 0'}}>Follow up with New Hope Church.</h2><p style={{color:'#d1d1d1',lineHeight:1.55}}>Proposal opened twice. Eva prepared the follow-up and held the October 18 date.</p><div style={{marginTop:20,padding:'12px 14px',background:'#242424',borderRadius:14,fontWeight:700}}>Ready for Otis to approve</div></div>
        </section>
        <section style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={card}><h2 style={{marginTop:0,fontSize:24}}>Upcoming calendar</h2>{[['SEP 04','Youth baseball clinic','Atlanta, GA'],['SEP 18','Faith & recovery keynote','Macon, GA'],['OCT 18','Church appearance','Hold placed']].map(([d,e,l])=><div key={e} style={{display:'grid',gridTemplateColumns:'80px 1fr',gap:14,padding:'14px 0',borderBottom:'1px solid #eee9df'}}><b style={{color:'#9b772a'}}>{d}</b><div><b>{e}</b><div style={{fontSize:13,color:'#777',marginTop:3}}>{l}</div></div></div>)}</div>
          <div style={card}><h2 style={{marginTop:0,fontSize:24}}>Automation working</h2>{[['✓','Book order confirmation sent'],['✓','Receipt delivered automatically'],['✓','New booking added to calendar'],['✓','Speaker inquiry follow-up queued'],['✓','Weekly business summary prepared']].map(([x,t])=><div key={t} style={{display:'flex',gap:12,padding:'11px 0'}}><b style={{color:'#168653'}}>{x}</b><span>{t}</span></div>)}</div>
        </section>
      </section>
    </div>
  </main>
}
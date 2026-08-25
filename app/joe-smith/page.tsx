export default function JoeSmithPage(){
  const classes=['Ball Handling','Shooting Fundamentals and Drills','Passing Drills','Half Court Passing Drills','Full Court Drills','Team Shooting','Defense','Low Post Drills','Pick (Screen) Drills','One-on-One Training'];
  return <main style={{margin:0,background:'#080b10',color:'white',fontFamily:'Arial,sans-serif'}}>
    <section style={{minHeight:'100vh',padding:'48px 7%',background:'linear-gradient(135deg,#07090d,#111a2b)'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:20,flexWrap:'wrap'}}>
        <strong style={{fontSize:26}}>JOE SMITH <span style={{color:'#2c9fd6'}}>BASKETBALL ACADEMY</span></strong>
        <a href='/joe-smith/portal' style={{background:'#168dcc',color:'white',padding:'14px 22px',borderRadius:24,textDecoration:'none'}}>Business Portal</a>
      </header>
      <div style={{maxWidth:1100,margin:'100px auto'}}>
        <p style={{color:'#2c9fd6',fontWeight:800}}>HALL OF FAMER • ELITE SKILLS TRAINER • MENTOR • LEADER</p>
        <h1 style={{fontSize:'clamp(48px,7vw,88px)',lineHeight:.95,maxWidth:900}}>EVERY PLAYER NEEDS SOMEONE WHO SEES WHAT <span style={{color:'#2c9fd6'}}>THEY CAN BECOME.</span></h1>
        <p style={{fontSize:22}}>Player development. Coaching. Connection.</p>
      </div>
    </section>

    <section style={{background:'linear-gradient(135deg,#f6fbff,#e9f3fb)',color:'#0b1823',padding:'84px 8%'}}>
      <div style={{maxWidth:1180,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:48,alignItems:'start'}}>
        <div>
          <p style={{color:'#168dcc',fontWeight:900,letterSpacing:1.2}}>FEATURED EVENT</p>
          <h2 style={{fontSize:'clamp(44px,6vw,72px)',lineHeight:.95,margin:'10px 0 22px'}}>2nd Annual Fall Classic Golf Fundraiser</h2>
          <p style={{fontSize:20,lineHeight:1.6,maxWidth:640}}>Two days of fellowship, fundraising and golf supporting the Joe Smith Basketball Academy.</p>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:28}}>
            <a href='https://joesmithbasketballacademy.com' style={{background:'#0b1823',color:'white',padding:'15px 22px',borderRadius:28,textDecoration:'none',fontWeight:800}}>Event Information</a>
            <a href='mailto:Info@davidsonglobalste.com' style={{border:'1px solid #0b1823',color:'#0b1823',padding:'15px 22px',borderRadius:28,textDecoration:'none',fontWeight:800}}>Contact Event Team</a>
          </div>
        </div>
        <div style={{background:'white',borderRadius:28,padding:30,boxShadow:'0 24px 70px rgba(10,35,55,.12)'}}>
          <div style={{paddingBottom:22,borderBottom:'1px solid #dce5ec'}}><small style={{fontWeight:900,color:'#168dcc'}}>SUNDAY, OCTOBER 25</small><h3 style={{margin:'8px 0 4px',fontSize:26}}>Meet & Greet Happy Hour</h3><p style={{margin:0,color:'#51606c'}}>5:00 PM to 8:00 PM</p></div>
          <div style={{padding:'22px 0',borderBottom:'1px solid #dce5ec'}}><small style={{fontWeight:900,color:'#168dcc'}}>MONDAY, OCTOBER 26</small><h3 style={{margin:'8px 0 4px',fontSize:26}}>Golf Tournament</h3><p style={{margin:0,color:'#51606c'}}>Registration 8:00 AM • Shotgun start 9:00 AM</p></div>
          <div style={{padding:'22px 0',borderBottom:'1px solid #dce5ec'}}><small style={{fontWeight:900,color:'#168dcc'}}>GREENBRIER COUNTRY CLUB</small><p style={{margin:'8px 0 0',fontWeight:700}}>1301 Volvo Pkwy, Chesapeake, VA 23320</p></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,paddingTop:22}}><div><small style={{color:'#66727d'}}>Single Package</small><b style={{display:'block',fontSize:30}}>$195</b><span style={{fontSize:13,color:'#66727d'}}>Sunday + Monday</span></div><div><small style={{color:'#66727d'}}>Foursome Package</small><b style={{display:'block',fontSize:30}}>$695</b><span style={{fontSize:13,color:'#66727d'}}>Sunday + Monday</span></div></div>
        </div>
      </div>
    </section>

    <section style={{background:'white',color:'#111',padding:'70px 8%'}}>
      <p style={{color:'#168dcc',fontWeight:800}}>TRAIN YOUR GAME</p>
      <h2 style={{fontSize:52}}>ALL CLASSES</h2>
      {classes.map(x=><div key={x} style={{padding:'20px 0',borderBottom:'1px solid #ddd',display:'flex',justifyContent:'space-between',gap:20}}><b>{x}</b><span style={{color:'#168dcc',fontWeight:800}}>Get Started</span></div>)}
    </section>
  </main>
}

export default function ThankYou({ searchParams }: { searchParams: { type?: string, course?: string }}){
  const type = searchParams?.type || 'enroll';
  const isKit = type==='kit';
  const isWaitlist = type==='waitlist';
  
  return (
    <div style={{background:'#fcfaf7', minHeight:'100vh', fontFamily:'-apple-system, system-ui', padding:'24px 24px 80px'}}>
      <div style={{maxWidth:640, margin:'0 auto'}}>
        <a href="/amanda-catherine" style={{fontSize:12, letterSpacing:'0.1em', textDecoration:'none', color:'#111', opacity:0.6}}>← AMANDA CATHERINE</a>
        
        <div style={{marginTop:32, background:'#fff', border:'1px solid #e8e2d9', padding:'48px 40px'}}>
          <div style={{width:56, height:56, borderRadius:'50%', background:'#111', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:22}}>✓</div>
          
          <div style={{fontSize:10, letterSpacing:'0.3em', opacity:0.5, marginBottom:12}}>{isKit ? 'ORDER CONFIRMED' : isWaitlist ? 'WAITLIST JOINED' : 'WELCOME'}</div>
          
          <h1 style={{fontSize:36, fontWeight:300, margin:0, lineHeight:1.15}}>
            {isKit ? 'Your Kit is on its way.' : isWaitlist ? 'You’re on the list.' : 'Welcome to the Method, beautiful.'}
          </h1>
          
          <p style={{marginTop:20, fontSize:16, lineHeight:1.7, opacity:0.75}}>
            {isKit 
              ? 'Thank you for investing in your practice. Your Body Sculpt Practitioner Kit has been reserved and will be prepared with care.'
              : isWaitlist
              ? 'Thank you for your interest in becoming a certified practitioner. We honor your desire to elevate your work.'
              : 'We are so honored you chose to join us. You have just taken a powerful step toward elevating your practice, your results, and your impact. This method was created for practitioners like you — precise, intuitive, and devoted to excellence.'}
          </p>

          <div style={{marginTop:40, background:'#fcfaf7', border:'1px solid #e8e2d9', padding:'28px'}}>
            <h3 style={{fontSize:12, letterSpacing:'0.15em', margin:'0 0 20px'}}>YOUR NEXT STEPS</h3>
            
            {isKit ? (
              <div style={{display:'grid', gap:16}}>
                <div style={{display:'flex', gap:12}}><span style={{background:'#111', color:'#fff', minWidth:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11}}>1</span><div><strong style={{fontSize:14}}>Check your email</strong><div style={{fontSize:13, opacity:0.7, marginTop:4, lineHeight:1.5}}>Shipping confirmation and tracking will arrive within 24 hours.</div></div></div>
                <div style={{display:'flex', gap:12}}><span style={{background:'#111', color:'#fff', minWidth:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11}}>2</span><div><strong style={{fontSize:14}}>Unboxing + training</strong><div style={{fontSize:13, opacity:0.7, marginTop:4, lineHeight:1.5}}>Your kit includes quick-start video and protocol guide.</div></div></div>
                <div style={{display:'flex', gap:12}}><span style={{background:'#111', color:'#fff', minWidth:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11}}>3</span><div><strong style={{fontSize:14}}>Portal access</strong><div style={{fontSize:13, opacity:0.7, marginTop:4, lineHeight:1.5}}>Login details will be emailed to access your practitioner resources.</div></div></div>
              </div>
            ) : isWaitlist ? (
              <div style={{display:'grid', gap:16}}>
                <div style={{display:'flex', gap:12}}><span style={{background:'#111', color:'#fff', minWidth:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11}}>1</span><div><strong style={{fontSize:14}}>You’re in the priority circle</strong><div style={{fontSize:13, opacity:0.7, marginTop:4, lineHeight:1.5}}>We will notify you first when the next certification opens.</div></div></div>
                <div style={{display:'flex', gap:12}}><span style={{background:'#111', color:'#fff', minWidth:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11}}>2</span><div><strong style={{fontSize:14}}>Stay connected</strong><div style={{fontSize:13, opacity:0.7, marginTop:4, lineHeight:1.5}}>Keep an eye on your inbox for behind-the-scenes trainings and updates from Amanda.</div></div></div>
                <div style={{display:'flex', gap:12}}><span style={{background:'#111', color:'#fff', minWidth:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11}}>3</span><div><strong style={{fontSize:14}}>In the meantime</strong><div style={{fontSize:13, opacity:0.7, marginTop:4, lineHeight:1.5}}>Explore the Practitioner Kit to begin elevating your results today.</div></div></div>
              </div>
            ) : (
              <div style={{display:'grid', gap:16}}>
                <div style={{display:'flex', gap:12}}><span style={{background:'#111', color:'#fff', minWidth:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11}}>1</span><div><strong style={{fontSize:14}}>Check your inbox (in the next 10 minutes)</strong><div style={{fontSize:13, opacity:0.7, marginTop:4, lineHeight:1.5}}>You will receive your enrollment confirmation and portal login invitation from Amanda’s team.</div></div></div>
                <div style={{display:'flex', gap:12}}><span style={{background:'#111', color:'#fff', minWidth:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11}}>2</span><div><strong style={{fontSize:14}}>Enter your portal</strong><div style={{fontSize:13, opacity:0.7, marginTop:4, lineHeight:1.5}}>Your personalized dashboard will be active within 24 hours — this is where your trainings, resources, and community live.</div></div></div>
                <div style={{display:'flex', gap:12}}><span style={{background:'#111', color:'#fff', minWidth:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11}}>3</span><div><strong style={{fontSize:14}}>Prepare to begin</strong><div style={{fontSize:13, opacity:0.7, marginTop:4, lineHeight:1.5}}>Set aside 2 hours this week for your Method orientation. Come with an open heart — we will handle the rest.</div></div></div>
              </div>
            )}
          </div>

          <div style={{marginTop:32, padding:'20px 24px', background:'#111', color:'#fcfaf7'}}>
            <div style={{fontSize:13, lineHeight:1.6, opacity:0.9}}>
              {isKit ? 'Questions about your kit? Reply directly to your confirmation email — Amanda’s team is here to support you.' : isWaitlist ? 'We can’t wait to welcome you fully when the doors open. You are exactly where you need to be.' : 'You belong here. Your decision to invest at this level says everything about the practitioner you already are — and the leader you are becoming.'}
            </div>
          </div>

          <div style={{marginTop:32, display:'grid', gap:12}}>
            <a href="/portal" style={{display:'block', background:'#111', color:'#fff', padding:'18px', textAlign:'center', textDecoration:'none', fontSize:12, letterSpacing:'0.12em'}}>ENTER YOUR PORTAL →</a>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <a href="/amanda-catherine" style={{display:'block', border:'1px solid #d8d2c9', padding:'14px', textAlign:'center', textDecoration:'none', fontSize:11, letterSpacing:'0.08em', color:'#111'}}>BACK TO SITE</a>
              <a href="mailto:support@amandacatherine.com" style={{display:'block', border:'1px solid #d8d2c9', padding:'14px', textAlign:'center', textDecoration:'none', fontSize:11, letterSpacing:'0.08em', color:'#111'}}>CONTACT SUPPORT</a>
            </div>
          </div>

          <div style={{marginTop:24, textAlign:'center', fontSize:11, opacity:0.4}}>A confirmation email is on its way. If you don’t see it, check spam / promotions.</div>
        </div>
      </div>
    </div>
  );
}

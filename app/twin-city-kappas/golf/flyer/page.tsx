import QRCode from 'qrcode';

const logo='https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png';
const eventUrl='https://efficiencyarchitects.online/twin-city-kappas/golf';
const studioUrl='https://efficiencyarchitects.online/studio';

export default async function TwinCityGolfFlyer(){
  const [eventQr,studioQr]=await Promise.all([
    QRCode.toDataURL(eventUrl,{margin:0,width:420,errorCorrectionLevel:'H',color:{dark:'#111111',light:'#F5F1E8'}}),
    QRCode.toDataURL(studioUrl,{margin:0,width:220,errorCorrectionLevel:'H',color:{dark:'#F5F1E8',light:'#111111'}}),
  ]);

  return <main className="flyer-page">
    <style>{`
      .flyer-page{min-height:100vh;background:#d8d1c3;padding:32px;display:grid;place-items:center;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:#111}.sheet{width:min(100%,850px);aspect-ratio:8.5/11;background:#f5f1e8;position:relative;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.18);display:flex;flex-direction:column}.serif{font-family:Iowan Old Style,Palatino Linotype,Book Antiqua,Palatino,Georgia,serif}.top{display:flex;justify-content:space-between;align-items:flex-start;padding:46px 48px 0}.brand{display:flex;gap:12px;align-items:center}.brand img{width:52px;height:52px;object-fit:contain}.brand-copy{display:grid;gap:3px}.brand-copy b{font-size:11px;letter-spacing:.18em;text-transform:uppercase}.brand-copy span{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#777067}.meeting{font-size:9px;letter-spacing:.22em;text-transform:uppercase;text-align:right;color:#777067;line-height:1.55}.hero{padding:72px 48px 0;position:relative}.golf{font-size:clamp(7rem,20vw,13rem);line-height:.68;letter-spacing:-.085em;font-weight:400;margin:0}.stroke{position:absolute;left:46px;right:46px;top:67%;height:2px;background:#8f1423;transform:rotate(-4deg);transform-origin:center}.date{display:flex;align-items:end;gap:18px;margin-top:32px}.date strong{font-size:clamp(4rem,10vw,6rem);line-height:.8;letter-spacing:-.06em;font-weight:400;color:#8f1423}.date span{font-size:12px;letter-spacing:.22em;text-transform:uppercase;padding-bottom:7px}.statement{margin:46px 48px 0;max-width:650px;font-size:25px;line-height:1.12;letter-spacing:-.025em}.details{margin-top:auto;background:#111;color:#f5f1e8;padding:34px 48px 26px;display:grid;grid-template-columns:1fr 180px;gap:36px;align-items:end}.facts{display:grid;grid-template-columns:1fr 1fr;gap:28px 24px}.fact small{display:block;font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:#a7a39d;margin-bottom:7px}.fact b{font-size:20px;font-weight:600}.course{grid-column:1/-1}.course b{font-size:28px}.qr-area{display:grid;justify-items:center;gap:9px}.qr-area img{width:158px;height:158px}.qr-area span{font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:#bdb7ad;text-align:center}.footer{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-top:26px;border-top:1px solid rgba(245,241,232,.16);grid-column:1/-1}.footer-left{font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:#9f9a92}.maker{display:flex;align-items:center;gap:10px}.maker-copy{display:grid;text-align:right}.maker-copy b{font-size:8px;letter-spacing:.14em;text-transform:uppercase}.maker-copy span{font-size:7px;letter-spacing:.1em;text-transform:uppercase;color:#8f8980}.maker img{width:38px;height:38px}.working{position:absolute;right:46px;top:285px;font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:#8f1423;transform:rotate(90deg);transform-origin:right top}@media(max-width:720px){.flyer-page{padding:0;background:#f5f1e8}.sheet{width:100%;min-height:100vh;aspect-ratio:auto;box-shadow:none}.top,.hero{padding-left:26px;padding-right:26px}.top{padding-top:28px}.hero{padding-top:56px}.statement{margin-left:26px;margin-right:26px;font-size:20px}.details{padding:28px 26px 22px;grid-template-columns:1fr 128px;gap:22px}.qr-area img{width:118px;height:118px}.maker img{width:32px;height:32px}.working{right:22px;top:220px}.meeting{display:none}.golf{font-size:7.2rem}.date strong{font-size:4rem}.course b{font-size:23px}}@media print{.flyer-page{background:#fff;padding:0}.sheet{width:8.5in;height:11in;box-shadow:none}.maker img,.qr-area img{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    `}</style>
    <section className="sheet">
      <div className="top">
        <div className="brand"><img src={logo} alt="Twin City Kappas crest"/><div className="brand-copy"><b>Twin City Alumni Chapter</b><span>Kappa Alpha Psi Fraternity, Inc.</span></div></div>
        <div className="meeting">In conjunction with the<br/>Kappa Provincial Meeting<br/>Winston-Salem, NC</div>
      </div>

      <div className="hero">
        <div className="working">Working tournament date</div>
        <h1 className="golf serif">GOLF</h1>
        <div className="stroke"/>
        <div className="date"><strong className="serif">03.12</strong><span>8:00 AM</span></div>
      </div>

      <div className="statement serif">Competition. Connection. Kappa fellowship. One morning at Winston Lake.</div>

      <section className="details">
        <div className="facts">
          <div className="fact"><small>Entry</small><b>$85 / Player</b></div>
          <div className="fact"><small>Format</small><b>2-Man Teams</b></div>
          <div className="fact course"><small>Course</small><b className="serif">Winston Lake Golf Course</b></div>
        </div>
        <div className="qr-area"><img src={eventQr} alt="QR code to Twin City Kappas golf event page"/><span>Scan for tournament details</span></div>
        <div className="footer"><div className="footer-left">March 12 is a working date pending final confirmation.</div><div className="maker"><div className="maker-copy"><b>Designed by Efficiency Architects</b><span>See what we can create</span></div><img src={studioQr} alt="QR code to Efficiency Architects Creative Studio"/></div></div>
      </section>
    </section>
  </main>
}

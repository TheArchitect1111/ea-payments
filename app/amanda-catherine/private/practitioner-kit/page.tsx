export const metadata = {
  title: 'Body Sculpt Practitioner Starter Kit | Amanda Catherine',
  robots: { index: false, follow: false },
};

export default function PractitionerKitPage() {
  return <main style={{background:'#f4f0e8',color:'#17221c',padding:'40px 20px',minHeight:'100vh'}}>
    <div style={{maxWidth:960,margin:'auto'}}>
      <p style={{letterSpacing:'.14em',textTransform:'uppercase',fontSize:12}}>AesthetiKine · Practitioner essentials</p>
      <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(34px,6vw,60px)',lineHeight:1.1}}>Body Sculpt Practitioner Starter Kit</h1>
      <p>7-piece Colombian Wood Therapy Collection · <strong>$499 CAD</strong></p>
      <img src="/amanda-catherine/body-sculpt-practitioner-kit.jpg" alt="Original Body Sculpt Practitioner Starter Kit artwork, $499 CAD" style={{display:'block',width:'100%',maxWidth:580,height:'auto',margin:'32px 0'}}/>
      <p>Contact Amanda to confirm your order and delivery arrangements.</p>
      <a href="mailto:Amanda@aesthetikine.com?subject=Body%20Sculpt%20Practitioner%20Kit%20purchase">Arrange your purchase with Amanda →</a>
    </div>
  </main>;
}

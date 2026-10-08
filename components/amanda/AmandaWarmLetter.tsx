export default function AmandaWarmLetter({ compact = false }: { compact?: boolean }) {
  return <section aria-label="A personal welcome from Amanda" style={{background:'#fffdf8',border:'1px solid #ddd7cb',borderRadius:10,padding:compact?'20px 24px':'30px 36px',margin:'0 0 28px',color:'#17211c'}}>
    <p style={{fontSize:12,letterSpacing:2,textTransform:'uppercase',color:'#596b5b',fontWeight:700}}>A personal welcome</p>
    <h2 style={{fontFamily:'Georgia,serif',fontSize:compact?26:32,margin:'10px 0 16px'}}>A note from Amanda</h2>
    <p style={{fontFamily:'Georgia,serif',lineHeight:1.75}}>Welcome. Whether you are here to restore your well-being, grow your clinical skills, or build something meaningful, I want you to feel supported in taking your next step. My work brings health, education and purpose together, with practical guidance and care for the person behind every goal.</p>
    <p style={{fontFamily:'Georgia,serif',lineHeight:1.75}}>Explore the path that fits where you are today. I look forward to connecting with you.</p>
    <p style={{fontFamily:'Georgia,serif',fontWeight:700}}>Warmly,<br/>Amanda Catherine</p>
  </section>;
}

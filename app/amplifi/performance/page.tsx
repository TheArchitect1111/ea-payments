'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { analyzeAmplifiPerformance } from '@/lib/amplifi-performance';
import '../amplifi-create.css';

const fields = [
  ['impressions','Impressions'],['reach','Reach'],['engagements','Engagements'],['clicks','Link clicks'],['conversions','Conversions'],['spend','Ad spend'],['revenue','Revenue'],['posts','Posts']
] as const;

export default function AmplifiPerformancePage() {
  const [values, setValues] = useState<Record<string,string>>({ impressions:'10000', reach:'7200', engagements:'430', clicks:'210', conversions:'19', spend:'0', revenue:'0', posts:'5' });
  const analysis = useMemo(() => analyzeAmplifiPerformance({
    impressions:Number(values.impressions), reach:Number(values.reach), engagements:Number(values.engagements), clicks:Number(values.clicks), conversions:Number(values.conversions), spend:Number(values.spend), revenue:Number(values.revenue), posts:Number(values.posts)
  }), [values]);
  return <main className="af-create-shell" style={{maxWidth:1120,margin:'0 auto',padding:'40px 22px 80px'}}>
    <header style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'flex-start',marginBottom:28}}>
      <div><span className="af-eyebrow">Amplifi · Performance Intelligence</span><h1 style={{fontSize:'clamp(2.4rem,6vw,5rem)',lineHeight:.95,margin:'12px 0'}}>Know what worked.<br/>Know what to do next.</h1><p style={{maxWidth:680}}>Enter the results available from your social platform or campaign report. Amplifi turns raw numbers into a diagnosis and a next move. No developer account is required for this workflow.</p></div>
      <Link className="af-secondary-button" href="/amplifi">Back to Amplifi</Link>
    </header>

    <section className="af-panel" style={{marginBottom:20}}>
      <div className="af-section-heading"><div><span className="af-eyebrow">Campaign results</span><h2>What happened?</h2></div><strong style={{fontSize:'2rem'}}>{analysis.score}/100</strong></div>
      <div className="af-editor-grid">
        {fields.map(([key,label]) => <label className="af-field" key={key}><span>{label}</span><input inputMode="decimal" value={values[key] ?? ''} onChange={e=>setValues(v=>({...v,[key]:e.target.value.replace(/[^0-9.]/g,'')}))}/></label>)}
      </div>
    </section>

    <section className="af-panel" id="results" style={{marginBottom:20}}>
      <span className="af-eyebrow">Amplifi diagnosis</span><h2 style={{fontSize:'2.2rem',margin:'8px 0 18px'}}>{analysis.diagnosis}</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
        {analysis.insights.map(item=><article key={item.key} style={{padding:18,border:'1px solid rgba(255,255,255,.12)',borderRadius:18}}><small>{item.label}</small><strong style={{display:'block',fontSize:'1.8rem',marginTop:8}}>{item.display}</strong><span style={{textTransform:'capitalize'}}>{item.status}</span></article>)}
      </div>
    </section>

    <section className="af-panel">
      <span className="af-eyebrow">Next move</span><h2>What Amplifi recommends</h2>
      <ol style={{display:'grid',gap:12,paddingLeft:22}}>{analysis.recommendations.map((r,i)=><li key={i} style={{paddingLeft:6}}>{r}</li>)}</ol>
      <p style={{opacity:.62,fontSize:'.86rem',marginTop:22}}>{analysis.methodology}</p>
    </section>
  </main>;
}

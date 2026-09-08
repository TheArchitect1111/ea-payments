'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {analyzeAmplifiPerformance} from '@/lib/amplifi-performance';
import './performance-premium.css';
const fields=[['impressions','Impressions'],['reach','Reach'],['engagements','Engagements'],['clicks','Link clicks'],['conversions','Conversions'],['spend','Ad spend'],['revenue','Revenue'],['posts','Posts']] as const;
export default function AmplifiPerformancePage(){
 const [values,setValues]=useState<Record<string,string>>({impressions:'10000',reach:'7200',engagements:'430',clicks:'210',conversions:'19',spend:'0',revenue:'0',posts:'5'});
 const analysis=useMemo(()=>analyzeAmplifiPerformance({impressions:Number(values.impressions),reach:Number(values.reach),engagements:Number(values.engagements),clicks:Number(values.clicks),conversions:Number(values.conversions),spend:Number(values.spend),revenue:Number(values.revenue),posts:Number(values.posts)}),[values]);
 return <main className="ap-page"><div className="ap-wrap">
  <nav className="ap-top"><span className="ap-brand">Amplifi · Results</span><Link className="ap-back" href="/amplifi">Back to Amplifi</Link></nav>
  <section className="ap-hero"><div><span className="ap-kicker">LET'S SEE WHAT YOUR CAMPAIGN IS TELLING US</span><h1>What connected?<br/>What should you try next?</h1><p>Enter the numbers you can see in your campaign report. Amplifi will help you read the story behind them and point you toward a useful next move.</p></div><div className="ap-score"><small>CAMPAIGN SIGNAL</small><strong>{analysis.score}</strong><span>out of 100 · a quick directional read</span></div></section>
  <section className="ap-entry"><div className="ap-entry-head"><div><span className="ap-kicker">YOUR RESULTS</span><h2>What happened?</h2></div><p>Use whatever numbers you have. You do not need every field, and you do not need a developer account.</p></div><div className="ap-fields">{fields.map(([key,label])=><label className="ap-field" key={key}><span>{label}</span><input inputMode="decimal" value={values[key]??''} onChange={e=>setValues(v=>({...v,[key]:e.target.value.replace(/[^0-9.]/g,'')}))}/></label>)}</div></section>
  <section className="ap-insight"><div className="ap-diagnosis"><small>WHAT WE SEE</small><h2>{analysis.diagnosis}</h2><p>This is a directional read of the campaign signals you entered. Use it as a guide for what to test next, not as a promise of future results.</p></div><div className="ap-metrics">{analysis.insights.map(item=><article className="ap-metric" key={item.key}><small>{item.label}</small><strong>{item.display}</strong><span>{item.status}</span></article>)}</div></section>
  <section className="ap-next"><div><small>A USEFUL NEXT MOVE</small><h2>Here is where we would go next.</h2></div><div><ol>{analysis.recommendations.map((r,i)=><li key={i}>{r}</li>)}</ol><p className="ap-method">{analysis.methodology}</p></div></section>
 </div></main>;
}

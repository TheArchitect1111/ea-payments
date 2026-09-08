'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import '../amplifi-create.css';

type Mode = 'post' | 'series' | 'campaign';
type GeneratedItem = { id?: string; headline?: string; caption?: string; callToAction?: string; visualDirection?: string; layoutFamily?: string; imageUrl?: string; specification?: { id: string; headline?: string; subhead?: string; callToAction?: string; visualDirection?: string; layoutFamily?: string }; };
type CreativeResponse = { ok?: boolean; error?: string; creative?: GeneratedItem[]; qaThreshold?: number; regenerateOnFailure?: boolean };
type CampaignPost = { title: string; caption: string; callToAction: string; imageDirection: string; imageUrl?: string };
type Campaign = { title: string; strategy: string; posts: CampaignPost[] };
type CampaignResponse = { ok?: boolean; error?: string; campaign?: Campaign };
type PremiumPackage = { graphics: CampaignPost[]; carousel: Array<{index:number;role:string;headline:string;copy:string;imageUrl:string}>; shortVideo:{format:string;durationSeconds:number;renderEngine:string;approvalRequired:boolean;scenes:Array<{index:number;startSecond:number;durationSeconds:number;headline:string;onScreenCopy:string;visualDirection:string;imageUrl:string}>}; qa:{threshold:number;overall:number;passed:boolean;violations:string[];regenerateOnFailure:boolean} };
type PremiumPackageResponse = { ok?: boolean; error?: string; package?: PremiumPackage };
type InitialBrief = { brandName?: string; websiteUrl?: string; topic?: string; goal?: string; audience?: string; offer?: string; cta?: string; destinationUrl?: string; timing?: string; details?: string };

const MODE_COPY: Record<Mode,{title:string;description:string;promise:string}> = {
  post:{title:'Create a Post',description:'One finished idea, written and designed for a clear purpose.',promise:'Best for announcements, offers, updates, observations and timely moments.'},
  series:{title:'Create a Series',description:'A coordinated set with a recognizable voice and visual system.',promise:'Perfect for thoughts of the day, poems, tips, education, spotlights and recurring themes.'},
  campaign:{title:'Run a Campaign',description:'Give Amplifi the goal. It builds the strategy and coordinated campaign around it.',promise:'Best when you want people to register, book, buy, attend, inquire or take another measurable action.'},
};
const GOALS=['Get more customers','Promote an event','Sell a product or service','Increase appointments','Build awareness','Grow my audience','Launch something new'];

function visualOf(item: GeneratedItem) { return item.imageUrl || (item.specification?.headline ? `/api/amplifi/post-image?title=${encodeURIComponent(item.specification.headline)}&subhead=${encodeURIComponent(item.specification.subhead||'')}&layout=${encodeURIComponent(item.specification.layoutFamily||'editorial-hero')}&format=portrait&v=5` : ''); }
function headlineOf(item: GeneratedItem) { return item.headline || item.specification?.headline || ''; }
function captionOf(item: GeneratedItem) { return item.caption || item.specification?.subhead || ''; }
function directionOf(item: GeneratedItem) { return item.visualDirection || item.specification?.visualDirection || ''; }
function layoutOf(item: GeneratedItem) { return item.layoutFamily || item.specification?.layoutFamily || ''; }

export default function AmplifiCreateStudio({initialMode='campaign',initialBrief}:{initialMode?:Mode;initialBrief?:InitialBrief}) {
  const presetGoal = initialBrief?.goal && GOALS.includes(initialBrief.goal) ? initialBrief.goal : initialBrief?.goal ? 'Something else' : '';
  const [mode,setMode]=useState<Mode>(initialMode); const [brandName,setBrandName]=useState(initialBrief?.brandName||''); const [websiteUrl,setWebsiteUrl]=useState(initialBrief?.websiteUrl||''); const [topic,setTopic]=useState(initialBrief?.topic||''); const [goal,setGoal]=useState(presetGoal); const [goalOther,setGoalOther]=useState(presetGoal==='Something else'?initialBrief?.goal||'':''); const [audience,setAudience]=useState(initialBrief?.audience||''); const [offer,setOffer]=useState(initialBrief?.offer||''); const [cta,setCta]=useState(initialBrief?.cta||''); const [destinationUrl,setDestinationUrl]=useState(initialBrief?.destinationUrl||''); const [timing,setTiming]=useState(initialBrief?.timing||''); const [details,setDetails]=useState(initialBrief?.details||''); const [count,setCount]=useState(7); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [creative,setCreative]=useState<GeneratedItem[]>([]); const [campaign,setCampaign]=useState<Campaign|null>(null); const [premium,setPremium]=useState<PremiumPackage|null>(null);
  const objective=useMemo(()=>goal==='Something else'?goalOther.trim():goal.trim(),[goal,goalOther]);
  const resetOutput=()=>{setCreative([]);setCampaign(null);setPremium(null);setError('')}; const chooseMode=(next:Mode)=>{setMode(next);resetOutput()};

  async function packageCampaign(nextCampaign: Campaign) {
    const response=await fetch('/api/portal/amplifi/premium-package',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({posts:nextCampaign.posts})});
    const data=(await response.json()) as PremiumPackageResponse;
    if (data.package) setPremium(data.package);
    if (!response.ok && data.error) throw new Error(data.error);
  }

  async function generate(){
    setError('');setCreative([]);setCampaign(null);setPremium(null);
    if(!topic.trim()||!objective||!audience.trim()){setError('Tell Amplifi what this is about, what you want to happen, and who you want to reach.');return}
    setBusy(true);
    try{
      if(mode==='campaign'){
        if(!cta.trim()){setError('A campaign needs a clear next action for the audience.');return}
        const response=await fetch('/api/portal/amplifi/create-campaign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({promotion:topic.trim(),audience:audience.trim(),result:objective,callToAction:cta.trim(),details:[offer.trim(),timing.trim(),details.trim()].filter(Boolean).join(' · '),tone:'Authoritative and premium',ctaUrl:destinationUrl.trim(),promotionScope:'single',imageStyle:'Emotionally relevant premium editorial creative',platforms:['Facebook','Instagram','LinkedIn']})});
        const data=(await response.json()) as CampaignResponse; if(!response.ok||!data.ok||!data.campaign) throw new Error(data.error||'Amplifi could not build this campaign.'); setCampaign(data.campaign); await packageCampaign(data.campaign);
      } else {
        const response=await fetch('/api/portal/amplifi/create-content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,brandName:brandName.trim(),websiteUrl:websiteUrl.trim(),topic:topic.trim(),objective,audience:audience.trim(),offer:offer.trim(),callToAction:cta.trim(),destinationUrl:destinationUrl.trim(),details:[timing.trim(),details.trim()].filter(Boolean).join(' · '),imageStyle:'Emotionally relevant premium editorial creative',count:mode==='series'?count:1})});
        const data=(await response.json()) as CreativeResponse; if(!response.ok||!data.ok||!data.creative) throw new Error(data.error||'Amplifi could not create this content.'); setCreative(data.creative);
      }
    }catch(err){setError(err instanceof Error?err.message:'Amplifi could not create this right now.')}finally{setBusy(false)}
  }

  return <main className="af-create-shell">
    <header className="af-create-header"><a href="/amplifi/workspace" aria-label="Amplifi home"><Image src="/amplifi/amplifi-logo-premium.png" alt="Amplifi" width={1973} height={797} priority/></a><span>Creative Studio</span></header>
    <section className="af-create-intro"><small>GIVE AMPLIFI THE IDEA</small><h1>What would you like to create?</h1><p>Choose the job. Amplifi will ask only what it needs, then the Creative Foundry produces the actual work.</p>{initialBrief?<p><strong>Customer Zero brief loaded:</strong> this campaign uses the same creation flow available to Amplifi customers.</p>:null}</section>
    <section className="af-mode-grid" aria-label="Creation mode">{(Object.keys(MODE_COPY) as Mode[]).map(item=><button key={item} type="button" className={mode===item?'is-active':''} onClick={()=>chooseMode(item)}><strong>{MODE_COPY[item].title}</strong><span>{MODE_COPY[item].description}</span><small>{MODE_COPY[item].promise}</small></button>)}</section>
    <section className="af-guided-card">
      <div className="af-question"><label htmlFor="brand">Who is this for?</label><p>Your business, organization, brand or personal platform.</p><input id="brand" value={brandName} onChange={e=>setBrandName(e.target.value)} placeholder="Brickey's Barbershop"/><input value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} placeholder="Website, if you have one" inputMode="url"/></div>
      <div className="af-question"><label htmlFor="topic">What are we creating around?</label><p>Tell Amplifi the offer, event, idea, message or theme in plain language.</p><textarea id="topic" value={topic} onChange={e=>setTopic(e.target.value)} placeholder={mode==='series'?'A 30-day series of short leadership thoughts':mode==='campaign'?'Fill Tuesday through Thursday barber appointments':'Announce our new Saturday hours'}/></div>
      <div className="af-question"><label>What do you want to happen?</label><p>This becomes the objective Amplifi designs toward.</p><div className="af-check-grid">{GOALS.map(item=><label key={item} className={goal===item?'is-selected':''}><input type="radio" name="goal" value={item} checked={goal===item} onChange={()=>setGoal(item)}/><span>{item}</span></label>)}<label className={goal==='Something else'?'is-selected':''}><input type="radio" name="goal" value="Something else" checked={goal==='Something else'} onChange={()=>setGoal('Something else')}/><span>Something else</span></label></div>{goal==='Something else'?<input value={goalOther} onChange={e=>setGoalOther(e.target.value)} placeholder="Tell Amplifi what success looks like"/>:null}</div>
      <div className="af-question"><label htmlFor="audience">Who needs to care?</label><p>Describe the people you most want this creative to move.</p><textarea id="audience" value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Busy professionals within 10 miles who usually wait until the weekend to book a haircut"/></div>
      <div className="af-question af-two-col"><div><label htmlFor="offer">What should they know?</label><textarea id="offer" value={offer} onChange={e=>setOffer(e.target.value)} placeholder="Offer, proof point, special detail or reason to care"/></div><div><label htmlFor="cta">What should they do next?</label><input id="cta" value={cta} onChange={e=>setCta(e.target.value)} placeholder="Book an appointment"/><input value={destinationUrl} onChange={e=>setDestinationUrl(e.target.value)} placeholder="Where should they go?" inputMode="url"/></div></div>
      {mode==='series'?<div className="af-question af-count-row"><label htmlFor="count">How many pieces should be in the series?</label><input id="count" type="number" min={3} max={30} value={count} onChange={e=>setCount(Math.min(30,Math.max(3,Number(e.target.value)||3)))}/></div>:null}
      <div className="af-question af-two-col"><div><label htmlFor="timing">When does this matter?</label><input id="timing" value={timing} onChange={e=>setTiming(e.target.value)} placeholder="This month, before October 1, every Monday…"/></div><div><label htmlFor="details">Anything Amplifi should know?</label><textarea id="details" value={details} onChange={e=>setDetails(e.target.value)} placeholder="Words to avoid, important context, restrictions or your own words"/></div></div>
      {error?<p className="af-create-error" role="alert">{error}</p>:null}<button className="af-build-button" type="button" onClick={generate} disabled={busy}>{busy?'Amplifi is building it…':mode==='campaign'?'Build my campaign':mode==='series'?'Create my series':'Create my post'}</button><p className="af-approval-note">Nothing publishes until you approve it.</p>
    </section>

    {creative.length?<section className="af-output"><small>AMPLIFI CREATED</small><h2>{mode==='series'?`${creative.length}-piece series`:'Your post'}</h2><div className="af-output-grid af-visual-grid">{creative.map((item,index)=><article key={item.id||item.specification?.id||index}><img className="af-creative-preview" src={visualOf(item)} alt={headlineOf(item)||topic}/><span>{String(index+1).padStart(2,'0')}</span><h3>{headlineOf(item)||topic}</h3>{captionOf(item)?<p>{captionOf(item)}</p>:null}<small>{directionOf(item)}</small><b>{layoutOf(item)}</b></article>)}</div><a className="af-output-action" href="/amplifi/workspace">Continue to review and publishing →</a></section>:null}
    {campaign?<section className="af-output"><small>AMPLIFI CAMPAIGN</small><h2>{campaign.title}</h2><p className="af-strategy">{campaign.strategy}</p>{premium?<div className={`af-qa-banner ${premium.qa.passed?'is-pass':'is-fail'}`}><strong>Creative QA {premium.qa.overall}/10</strong><span>{premium.qa.passed?'Passed the 8.5 production gate.':'Needs regeneration before production.'}</span></div>:null}<div className="af-output-grid af-visual-grid">{(premium?.graphics||campaign.posts).map((post,index)=><article key={`${post.title}-${index}`}><img className="af-creative-preview" src={post.imageUrl||`/api/amplifi/post-image?title=${encodeURIComponent(post.title)}&subhead=${encodeURIComponent(post.caption.slice(0,150))}&layout=${encodeURIComponent(['editorial-hero','editorial-split','story-proof','promotion-offer','editorial-hero'][index])}&format=portrait&v=5`} alt={post.title}/><span>{String(index+1).padStart(2,'0')}</span><h3>{post.title}</h3><p>{post.caption}</p><small>{post.imageDirection}</small><b>{post.callToAction}</b></article>)}</div>{premium?<><div className="af-package-heading"><small>CAROUSEL</small><h2>One campaign, told as a swipeable story.</h2></div><div className="af-carousel-strip">{premium.carousel.map(slide=><article key={slide.index}><img src={slide.imageUrl} alt={slide.headline}/><span>{slide.index} · {slide.role}</span><h3>{slide.headline}</h3></article>)}</div><div className="af-package-heading"><small>SHORT-FORM VIDEO</small><h2>{premium.shortVideo.durationSeconds}-second vertical cut, ready for the render engine.</h2><p className="af-strategy">Five coordinated scenes · 9:16 · {premium.shortVideo.renderEngine} · approval required before publishing.</p></div><div className="af-video-scenes">{premium.shortVideo.scenes.map(scene=><article key={scene.index}><img src={scene.imageUrl} alt={scene.headline}/><div><span>{scene.startSecond}s–{scene.startSecond+scene.durationSeconds}s</span><h3>{scene.headline}</h3><p>{scene.onScreenCopy}</p></div></article>)}</div></>:null}<a className="af-output-action" href="/amplifi/workspace">Review, approve and schedule this campaign →</a></section>:null}
  </main>;
}

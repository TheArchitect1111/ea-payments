import { NextResponse } from 'next/server';
import { getAgent } from '@/lib/agents/registry';
import type { AIRequestContext } from '@/lib/ai/types';
import { premiumJury } from '@/lib/amplifi-premium-intelligence';

export const dynamic='force-dynamic';
export const maxDuration=300;

const scenarios=[
 {id:'restaurant',brand:'Ember Table',business:'chef-driven neighborhood restaurant',audience:'local professionals and couples',goal:'fill slower Tuesday dinner service',voice:['warm','witty','confident'],visual:'cinematic plated dinner, open kitchen energy, real guests, rich evening light'},
 {id:'barber',brand:'Northline Barber Co.',business:'premium neighborhood barbershop',audience:'busy professional men',goal:'increase weekday bookings',voice:['sharp','direct','stylish'],visual:'premium documentary barbershop moment, precise fade, mirror reflections, tactile tools, natural skin texture'},
 {id:'nonprofit',brand:'Bright Futures Lab',business:'youth education nonprofit',audience:'local donors and community partners',goal:'increase registrations and donor interest for a free youth program',voice:['human','hopeful','credible'],visual:'documentary youth learning scene, mentor interaction, authentic classroom energy, no staged charity imagery'},
 {id:'advisor',brand:'Harbor Ridge Advisory',business:'independent financial advisory practice',audience:'professionals age 40 to 60',goal:'generate consultations around retirement planning',voice:['calm','precise','trustworthy'],visual:'editorial professional portrait and planning moment, sophisticated office, natural light, no cliché stock handshake'},
 {id:'athlete',brand:'TB3',business:'college athlete personal brand',audience:'fans, brands, community partners',goal:'grow NIL and community partnership opportunities',voice:['confident','grounded','aspirational'],visual:'cinematic athlete community appearance, speaking with youth, premium sports editorial lighting, authentic interaction'},
 {id:'dentist',brand:'Aster Dental Studio',business:'modern cosmetic dental studio',audience:'adults considering cosmetic dentistry',goal:'book more smile consultations',voice:['reassuring','modern','clean'],visual:'high-end lifestyle portrait, natural smile, airy modern clinic detail, no exaggerated before-after claims'},
 {id:'realtor',brand:'Maya Cole Homes',business:'residential real estate advisor',audience:'first-time homebuyers',goal:'generate conversations with first-time buyers',voice:['clear','savvy','encouraging'],visual:'editorial home-tour moment, buyer noticing a meaningful detail, architectural light, not keys-in-hand cliché'},
 {id:'fitness',brand:'Forge Method',business:'small-group strength studio',audience:'busy adults over 35',goal:'increase trial-session bookings',voice:['energetic','smart','non-bro'],visual:'documentary strength training, coach cueing a real client, premium contrast, authentic effort, no fitness-model posing'},
 {id:'bakery',brand:'Sunday Crumb',business:'artisan bakery',audience:'local food lovers and gift buyers',goal:'increase weekend preorders',voice:['playful','sensory','charming'],visual:'macro pastry detail, baker hands finishing product, warm window light, premium food editorial styling'},
 {id:'consultant',brand:'Signal North',business:'operations consultancy for small businesses',audience:'owners of growing service businesses',goal:'generate discovery calls',voice:['smart','provocative','plainspoken'],visual:'editorial founder-work scene, process notes, real operational context, modern restrained composition'}
];

async function generateImage(prompt:string){
 const key=process.env.OPENAI_API_KEY?.trim();
 if(!key)return null;
 const response=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_IMAGE_MODEL?.trim()||'dall-e-3',prompt,size:'1792x1024',quality:'standard',response_format:'url',n:1}),signal:AbortSignal.timeout(120000)});
 if(!response.ok){console.error('Amplifi proof image generation failed',response.status,await response.text());return null;}
 const data=await response.json() as {data?:Array<{url?:string;revised_prompt?:string}>};
 return data.data?.[0]?.url||null;
}

async function generateScenario(scenario:(typeof scenarios)[number]){
 const agent=getAgent('amplifi-content-director');
 if(!agent)return {id:scenario.id,brand:scenario.brand,passed:false,error:'agent-unavailable'};
 const prompt=`Create ONE premium five-piece social campaign for this business. Return JSON only as {"id":"${scenario.id}","campaignTitle":string,"strategy":string,"posts":[{"title":string,"caption":string,"callToAction":string,"imageDirection":string}]}. Exactly five posts. Do not write generic AI copy. Every post must be specific to this business, audience and goal. Use sharp human observations, concrete language, memorable but natural headlines, and no invented claims or statistics.\nBrand: ${scenario.brand}\nBusiness: ${scenario.business}\nAudience: ${scenario.audience}\nGoal: ${scenario.goal}\nVoice: ${scenario.voice.join(', ')}\nVisual standard: ${scenario.visual}`;
 const ctx:AIRequestContext={requestId:crypto.randomUUID(),actor:{id:`proof-${scenario.id}`,type:'system',role:'proof-run'},route:'/api/amplifi/proof-run',metadata:{product:'amplifi',workflow:'premium-proof-run',scenario:scenario.id}};
 let campaign:any;
 try{const result=await agent.execute({intent:'single business premium proof run',query:prompt,context:{brand:scenario.brand,business:scenario.business,audience:scenario.audience,goal:scenario.goal}},ctx);campaign=result.raw;}catch(error){console.error('Amplifi proof text generation failed',scenario.id,error);return {id:scenario.id,brand:scenario.brand,passed:false,error:'text-generation-failed'};}
 if(!campaign||!Array.isArray(campaign.posts)||campaign.posts.length!==5)return {id:scenario.id,brand:scenario.brand,passed:false,error:'missing-five-post-campaign'};
 const brandTerms=[scenario.brand,scenario.business,...scenario.voice];
 const jury=campaign.posts.map((p:any)=>premiumJury(`${p.title}\n${p.caption}`,{brandTerms,platform:'instagram'}));
 const hero=campaign.posts[0];
 const imagePrompt=`Create a premium editorial social campaign photograph with no text, logo, watermark, UI or border. Brand context: ${scenario.brand}, ${scenario.business}. Audience: ${scenario.audience}. Business goal: ${scenario.goal}. Creative concept: ${hero.imageDirection||scenario.visual}. Style: ${scenario.visual}. Avoid generic corporate stock-photo staging. Natural anatomy, realistic hands and faces, believable materials, art-directed composition, premium commercial photography.`;
 const imageUrl=await generateImage(imagePrompt);
 return {id:scenario.id,brand:scenario.brand,business:scenario.business,goal:scenario.goal,campaignTitle:campaign.campaignTitle,strategy:campaign.strategy,posts:campaign.posts,jury,copyPassed:jury.every((j:any)=>j.passed),imageUrl,imagePassed:Boolean(imageUrl),passed:jury.every((j:any)=>j.passed)&&Boolean(imageUrl)};
}

async function mapWithConcurrency<T,R>(items:T[],limit:number,fn:(item:T)=>Promise<R>){
 const out:R[]=[]; let next=0;
 async function worker(){while(true){const i=next++;if(i>=items.length)return;out[i]=await fn(items[i]);}}
 await Promise.all(Array.from({length:Math.min(limit,items.length)},()=>worker())); return out;
}

export async function GET(){
 const results=await mapWithConcurrency(scenarios,2,generateScenario);
 return NextResponse.json({ok:true,generatedAt:new Date().toISOString(),scenarioCount:results.length,passed:results.filter((r:any)=>r.passed).length,copyPassed:results.filter((r:any)=>r.copyPassed).length,imagePassed:results.filter((r:any)=>r.imagePassed).length,results});
}

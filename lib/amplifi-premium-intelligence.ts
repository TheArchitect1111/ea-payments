export type PremiumIdea={angle:string;hook:string;reason:string;score:number};
export type PremiumWritingScore={specificity:number;originality:number;voice:number;clarity:number;stopPower:number;platformFit:number;payForIt:number;overall:number;violations:string[]};

const GENERIC=[/unlock/i,/elevate/i,/transform your/i,/in today['’]s/i,/game[- ]changer/i,/take .* to the next level/i,/revolutionize/i,/seamless/i,/supercharge/i,/whether you['’]re/i];
const clamp=(n:number)=>Math.max(0,Math.min(10,Math.round(n*10)/10));
const avg=(xs:number[])=>Math.round(xs.reduce((a,b)=>a+b,0)/xs.length*10)/10;

export function scorePremiumWriting(text:string,brandTerms:string[]=[],platform='instagram'):PremiumWritingScore{
 const t=text.trim(); const words=t.split(/\s+/).filter(Boolean); const violations:string[]=[];
 const genericHits=GENERIC.filter(r=>r.test(t)).length; if(genericHits)violations.push('generic-ai-language');
 const specificity=clamp(5+Math.min(3,brandTerms.filter(x=>x&&t.toLowerCase().includes(x.toLowerCase())).length*1.5)+( /\d|\$|%|\b(?:today|tonight|this week|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i.test(t)?1:0)-genericHits);
 const originality=clamp(8-genericHits*2-(words.length<5?2:0)-( /learn more|click here|don['’]t miss out/i.test(t)?1.5:0));
 const voice=clamp(brandTerms.length?5+Math.min(4,brandTerms.filter(x=>t.toLowerCase().includes(x.toLowerCase())).length*1.5):7);
 const clarity=clamp(9-(words.length>90?2:0)-(t.split(/[.!?]/).filter(Boolean).length>8?1:0));
 const stopPower=clamp(5+(t.length<180?1:0)+( /[?!]/.test(t)?0.5:0)+( /\b(?:you|your|why|what|stop|skip|instead|before|after)\b/i.test(t)?1:0)-genericHits);
 const platformFit=clamp(platform==='x'?(t.length<=280?9:5):platform==='linkedin'?(words.length<=180?8.5:6.5):(words.length<=120?8.5:7));
 const payForIt=clamp(avg([specificity,originality,voice,clarity,stopPower,platformFit])-genericHits*.5);
 const overall=avg([specificity,originality,voice,clarity,stopPower,platformFit,payForIt]);
 if(originality<7.5)violations.push('originality-below-premium'); if(specificity<7.5)violations.push('not-specific-enough'); if(payForIt<8.5)violations.push('pay-for-it-failed');
 return{specificity,originality,voice,clarity,stopPower,platformFit,payForIt,overall,violations};
}

export function rankPremiumIdeas(ideas:Array<Omit<PremiumIdea,'score'>>,brandTerms:string[]=[]):PremiumIdea[]{
 return ideas.map(i=>{const s=scorePremiumWriting(`${i.hook} ${i.reason}`,brandTerms);return{...i,score:avg([s.originality,s.specificity,s.stopPower,s.payForIt])}}).sort((a,b)=>b.score-a.score);
}

export function buildPremiumIdeaTournament(input:{goal:string;audience:string;brandName?:string;businessType?:string}):Array<Omit<PremiumIdea,'score'>>{
 const who=input.audience||'the audience', goal=input.goal, brand=input.brandName||input.businessType||'this business';
 return[
  {angle:'specific friction',hook:`What is making ${goal.toLowerCase()} harder than it should be?`,reason:`Name a recognizable friction for ${who}, then make ${brand} the useful next step.`},
  {angle:'unexpected contrast',hook:`The obvious answer is not always the useful one.`,reason:`Contrast the common approach with a more specific path toward ${goal}.`},
  {angle:'timely trigger',hook:`Why this matters right now`,reason:`Connect a current moment, deadline, season or behavior to ${who} without inventing urgency.`},
  {angle:'identity',hook:`For people who care about getting this right.`,reason:`Frame ${goal} around how ${who} wants to see themselves, not around product features.`},
  {angle:'proof-shaped story',hook:`Show the moment the problem becomes the result.`,reason:`Use a concrete before/after experience without inventing testimonials or statistics.`},
  {angle:'sharp question',hook:`What would change if ${goal.toLowerCase()} actually happened?`,reason:`Turn the desired outcome into a question ${who} can answer emotionally and practically.`},
  {angle:'myth reversal',hook:`Stop solving the wrong part of the problem.`,reason:`Challenge a familiar assumption and redirect attention toward the action that supports ${goal}.`},
  {angle:'micro-story',hook:`One small moment can explain the whole problem.`,reason:`Build the post around a vivid, believable scene that ${who} recognizes.`}
 ];
}

export function premiumJury(text:string,opts:{brandTerms?:string[];platform?:string;threshold?:number}={}){
 const threshold=opts.threshold??8.5; const score=scorePremiumWriting(text,opts.brandTerms||[],opts.platform||'instagram');
 const jurors={creativeDirector:avg([score.originality,score.stopPower,score.payForIt]),brandEditor:avg([score.specificity,score.voice,score.clarity]),socialEditor:avg([score.stopPower,score.platformFit,score.clarity])};
 const hardFail=score.originality<7.5||score.specificity<7.5||score.payForIt<threshold||Object.values(jurors).some(x=>x<7.5);
 return{passed:!hardFail&&score.overall>=threshold,threshold,score,jurors,verdict:hardFail?'regenerate':'approval-eligible'};
}

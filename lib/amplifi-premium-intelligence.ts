export type PremiumIdea={angle:string;hook:string;reason:string;score:number};
export type PremiumWritingScore={specificity:number;originality:number;voice:number;clarity:number;stopPower:number;engagement:number;value:number;brandFit:number;platformFit:number;payForIt:number;overall:number;violations:string[]};

const GENERIC=[/unlock/i,/elevate/i,/transform your/i,/in today['’]s/i,/game[- ]changer/i,/take .* to the next level/i,/revolutionize/i,/seamless/i,/supercharge/i,/whether you['’]re/i,/here are (?:three|3|five|5) tips/i,/did you know/i];
const EMPTY_ENGAGEMENT=[/what do you think\??$/i,/thoughts\??$/i,/agree\??$/i,/drop .* below/i];
const clamp=(n:number)=>Math.max(0,Math.min(10,Math.round(n*10)/10));
const avg=(xs:number[])=>Math.round(xs.reduce((a,b)=>a+b,0)/xs.length*10)/10;
const wordsOf=(value:string)=>value.toLowerCase().match(/[a-z0-9]+/g)?.filter(w=>w.length>=4&&!['this','that','with','from','your','have','will','into','about','their','they','them'].includes(w))||[];
function contextOverlap(text:string,terms:string[]){const hay=new Set(wordsOf(text));const context=[...new Set(terms.flatMap(wordsOf))];return context.filter(word=>hay.has(word)).length;}

export function scorePremiumWriting(text:string,brandTerms:string[]=[],platform='instagram'):PremiumWritingScore{
 const t=text.trim();const words=t.split(/\s+/).filter(Boolean);const violations:string[]=[];
 const genericHits=GENERIC.filter(r=>r.test(t)).length;if(genericHits)violations.push('generic-ai-language');
 const emptyEngagement=EMPTY_ENGAGEMENT.some(r=>r.test(t));if(emptyEngagement)violations.push('empty-engagement-bait');
 const overlap=contextOverlap(t,brandTerms);
 const concreteSignals=(/\d|\$|%|\b(?:today|tonight|this week|morning|evening|weekend|appointment|booking|consultation|registration|preorder|donor|client|buyer|customer|home|class|service|product|session|deadline|before|after)\b/i.test(t)?1:0);
 const usefulSignals=(/\b(?:how|why|because|before|after|instead|check|avoid|compare|save|remember|ask|choose|notice|watch|try|step|mistake|lesson|reason)\b/i.test(t)?1:0);
 const tensionSignals=(/\b(?:but|instead|wrong|mistake|overlook|before|until|still|actually|never|only|cost|risk|problem|better|worse)\b/i.test(t)?1:0);
 const conversationSignals=(/[?]/.test(t)?1:0)+(/\b(?:which|would you|have you|when did|what would|tell me|share|choose)\b/i.test(t)?1:0);
 const specificity=clamp(5.8+Math.min(3,overlap*.65)+concreteSignals*.8-genericHits*1.2);
 const originality=clamp(8.4-genericHits*2-(words.length<5?2:0)-(/learn more|click here|don['’]t miss out/i.test(t)?1.5:0)+tensionSignals*.45);
 const voice=clamp(7.2+Math.min(2.2,overlap*.45)-genericHits*.7);
 const clarity=clamp(9-(words.length>90?2:0)-(t.split(/[.!?]/).filter(Boolean).length>8?1:0));
 const stopPower=clamp(6.5+(t.length<220?.6:0)+tensionSignals*.8+concreteSignals*.5+(/[?!]/.test(t)?.3:0)-genericHits);
 const engagement=clamp(6.2+conversationSignals*.65+usefulSignals*.55+tensionSignals*.45+concreteSignals*.35-(emptyEngagement?1.5:0)-genericHits*.6);
 const value=clamp(6.5+usefulSignals*1.15+concreteSignals*.6+Math.min(1.2,overlap*.25)-genericHits*.6);
 const brandFit=clamp(6.3+Math.min(3.2,overlap*.7)+specificity*.08-genericHits*.7);
 const platformFit=clamp(platform==='x'?(t.length<=280?9:5):platform==='linkedin'?(words.length<=180?8.7:6.5):(words.length<=120?8.8:7));
 const payForIt=clamp(specificity*.16+originality*.14+voice*.1+clarity*.08+stopPower*.15+engagement*.14+value*.11+brandFit*.07+platformFit*.05-genericHits*.5);
 const overall=clamp(specificity*.13+originality*.13+voice*.09+clarity*.1+stopPower*.14+engagement*.14+value*.11+brandFit*.08+platformFit*.04+payForIt*.04);
 if(originality<7.5)violations.push('originality-below-premium');if(specificity<7.5)violations.push('not-specific-enough');if(stopPower<7.8)violations.push('weak-hook');if(engagement<7.8)violations.push('weak-engagement');if(value<7.8)violations.push('low-reader-value');if(brandFit<7.5)violations.push('weak-brand-fit');if(payForIt<8.5)violations.push('pay-for-it-failed');
 return{specificity,originality,voice,clarity,stopPower,engagement,value,brandFit,platformFit,payForIt,overall,violations};
}

export function rankPremiumIdeas(ideas:Array<Omit<PremiumIdea,'score'>>,brandTerms:string[]=[]):PremiumIdea[]{return ideas.map(i=>{const s=scorePremiumWriting(`${i.hook} ${i.reason}`,brandTerms);return{...i,score:avg([s.originality,s.specificity,s.stopPower,s.engagement,s.value,s.payForIt])}}).sort((a,b)=>b.score-a.score);}

export function buildPremiumIdeaTournament(input:{goal:string;audience:string;brandName?:string;businessType?:string}):Array<Omit<PremiumIdea,'score'>>{
 const who=input.audience||'the audience',goal=input.goal,brand=input.brandName||input.businessType||'this business';
 return[
  {angle:'specific friction',hook:`What is making ${goal.toLowerCase()} harder than it should be?`,reason:`Name a recognizable friction for ${who}, reveal its consequence, then make ${brand} the useful next step.`},
  {angle:'contrarian take',hook:`The advice everyone repeats about this misses the part that matters.`,reason:`Challenge one familiar assumption for ${who}, then replace it with a useful, defensible insight tied to ${goal}.`},
  {angle:'timely trigger',hook:`Why this matters right now`,reason:`Connect a current moment, deadline, season or behavior to ${who} without inventing urgency.`},
  {angle:'identity',hook:`For people who care about getting this right.`,reason:`Frame ${goal} around how ${who} wants to see themselves, not around product features.`},
  {angle:'proof-shaped story',hook:`Show the moment the problem becomes the result.`,reason:`Use a concrete before/after experience without inventing testimonials or statistics.`},
  {angle:'sharp question',hook:`What would change if ${goal.toLowerCase()} actually happened?`,reason:`Ask a question ${who} can answer emotionally and practically, then reward the pause with a useful insight.`},
  {angle:'myth reversal',hook:`Stop solving the wrong part of the problem.`,reason:`Challenge a familiar assumption and redirect attention toward the action that supports ${goal}.`},
  {angle:'micro-story',hook:`One small moment can explain the whole problem.`,reason:`Build the post around a vivid, believable scene that ${who} recognizes.`},
  {angle:'mistake and lesson',hook:`The expensive part is usually the mistake you do not notice yet.`,reason:`Surface one believable mistake, explain why it happens, and give ${who} a practical correction.`},
  {angle:'save-worthy utility',hook:`Before you do this again, check these three things.`,reason:`Create a compact checklist ${who} would genuinely save or send to someone else.`},
  {angle:'conversation starter',hook:`There are two reasonable ways to approach this. Which one fits you?`,reason:`Present a meaningful choice with enough context that ${who} has a reason to respond.`},
  {angle:'behind the scenes',hook:`Here is the part customers rarely see.`,reason:`Reveal a real process, decision or standard that demonstrates how ${brand} thinks and works.`}
 ];
}

export function premiumJury(text:string,opts:{brandTerms?:string[];platform?:string;threshold?:number}={}){
 const threshold=opts.threshold??8.5;const score=scorePremiumWriting(text,opts.brandTerms||[],opts.platform||'instagram');
 const jurors={creativeDirector:avg([score.originality,score.stopPower,score.payForIt]),brandEditor:avg([score.specificity,score.voice,score.brandFit]),socialEditor:avg([score.stopPower,score.engagement,score.platformFit]),audienceEditor:avg([score.engagement,score.value,score.clarity])};
 const hardFail=score.originality<7.5||score.specificity<7.5||score.stopPower<7.8||score.engagement<7.8||score.value<7.8||score.brandFit<7.5||score.payForIt<threshold||Object.values(jurors).some(x=>x<7.5);
 return{passed:!hardFail&&score.overall>=threshold,threshold,score,jurors,verdict:hardFail?'regenerate':'approval-eligible'};
}

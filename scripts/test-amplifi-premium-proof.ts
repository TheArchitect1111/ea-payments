import assert from 'node:assert/strict';
import { premiumJury, scorePremiumWriting } from '../lib/amplifi-premium-intelligence';
import { evaluatePremiumVisual } from '../lib/creative-foundry/premium-visual';

const cases = [
  {id:'restaurant',terms:['Ember Table','restaurant','Tuesday dinner','local professionals'],text:'Tuesday called. It would like its personality back. Ember Table is making the slower dinner night the one worth planning around. Skip the leftovers, bring someone you like, and make Tuesday dinner feel intentional.'},
  {id:'barber',terms:['Northline Barber','barbershop','weekday booking','professional men'],text:'Your Saturday does not need another errand. Northline Barber makes the weekday chair the smarter move: a sharp cut, less weekend scramble, and one appointment already handled before Friday.'},
  {id:'nonprofit',terms:['Bright Futures Lab','youth education','registration','donor','community'],text:'A free seat in the room only matters if a young person gets into it. Bright Futures Lab is opening youth program registration now, and community partners can help make sure families hear about it.'},
  {id:'advisor',terms:['Harbor Ridge Advisory','retirement','consultation','professionals'],text:'Retirement planning gets real when “someday” becomes a date on the calendar. Harbor Ridge Advisory helps professionals turn the pile of accounts, questions and assumptions into one clear retirement conversation.'},
  {id:'athlete',terms:['TB3','athlete','NIL','community','brand'],text:'The jersey gets attention. What an athlete does with that attention builds the brand. TB3 is opening NIL partnership conversations with brands that want to show up at youth camps, community events and real activation sessions, not simply buy a post.'},
  {id:'dentist',terms:['Aster Dental Studio','dental','smile consultation'],text:'You probably do not need a “perfect” smile. You may just want to stop thinking about the one thing you notice in every photo. Aster Dental Studio starts with a smile consultation, not a sales pitch.'},
  {id:'realtor',terms:['Maya Cole Homes','first-time buyer','home'],text:'The first home tour is exciting. The third one is where the questions get better. Maya Cole Homes helps first-time buyers know what to notice before “I love it” turns into “I missed that.”'},
  {id:'fitness',terms:['Forge Method','strength','trial session','adults'],text:'You do not need to train like a fitness influencer. You need strength that survives your actual week. Forge Method coaches adults through small-group sessions built around useful progress, starting with a trial session.'},
  {id:'bakery',terms:['Sunday Crumb','bakery','weekend preorder','pastry'],text:'The best part of Saturday morning should not be standing in a sold-out bakery line. Sunday Crumb weekend preorders put the pastry box aside before the good stuff disappears.'},
  {id:'consultant',terms:['Signal North','operations','service business','discovery call'],text:'Growth can look healthy while the back office quietly catches fire. Signal North helps service-business owners find the operational drag hiding behind full calendars, busy teams and work that keeps circling back.'},
];

for (const sample of cases) {
  const verdict = premiumJury(sample.text,{brandTerms:sample.terms,platform:'instagram'});
  assert.equal(verdict.passed,true,`${sample.id} premium sample failed: ${verdict.score.violations.join(', ')}`);
  assert.ok(verdict.score.payForIt>=8.5,`${sample.id} missed Pay-For-It threshold`);
  assert.ok(verdict.score.specificity>=7.5,`${sample.id} missed specificity`);
}

const generic='Unlock your potential and elevate your business with our seamless game-changing solution. Learn more today.';
const genericScore=scorePremiumWriting(generic,['business'],'instagram');
assert.ok(genericScore.violations.includes('generic-ai-language'),'Generic AI language was not rejected.');
assert.ok(!premiumJury(generic,{brandTerms:['business'],platform:'instagram'}).passed,'Generic content incorrectly passed the jury.');

const premiumVisual=evaluatePremiumVisual({conceptStrength:9,originality:8.8,brandSpecificity:9,visualImpact:9.2,composition:9,typography:8.8,realism:9.1,platformFit:9,technicalQuality:9.2,payForIt:9});
assert.equal(premiumVisual.passed,true,'Premium visual should pass.');
const weakVisual=evaluatePremiumVisual({conceptStrength:6,originality:6,brandSpecificity:5,visualImpact:6,composition:6,typography:6,realism:6,platformFit:7,technicalQuality:7,payForIt:5});
assert.equal(weakVisual.passed,false,'Weak visual incorrectly passed.');
assert.ok(weakVisual.repairs.length>=5,'Weak visual did not produce repair guidance.');

console.log(`Amplifi premium proof contract passed: ${cases.length}/10 sectors accepted; generic copy rejected; visual gate distinguishes premium from weak creative.`);

import assert from 'node:assert/strict';
import { premiumJury, scorePremiumWriting } from '../lib/amplifi-premium-intelligence';
import { evaluatePremiumVisual } from '../lib/creative-foundry/premium-visual';

const cases = [
  {id:'restaurant',terms:['Ember Table','restaurant','Tuesday dinner','local professionals'],text:'Your Tuesday dinner plans deserve better than becoming leftovers by default. Instead of another rushed meal, make it the evening local professionals actually look forward to: Ember Table, a neighborhood restaurant, gives you a reserved table by 6 p.m. Bring one colleague, compare the week’s priorities over dinner, and head back tomorrow with a real conversation behind you. What would make Tuesday dinner worth leaving home for?'},
  {id:'barber',terms:['Northline Barber','barbershop','weekday booking','professional men'],text:'Saturday morning shouldn’t start with another errand. Instead, book your Northline Barber weekday appointment before Friday: get a sharp cut, keep the weekend open, and skip the last-minute scramble. Which day can you protect for yourself this week?'},
  {id:'nonprofit',terms:['Bright Futures Lab','youth education','registration','donor','community'],text:'A free seat matters only when a young person can claim it. Before youth education registration closes this week, help Bright Futures Lab get the invitation to families who may miss it. Community donors: instead of assuming families will find it, share the registration link with one school or parent group today. Who should hear about it?'},
  {id:'advisor',terms:['Harbor Ridge Advisory','retirement','consultation','professionals'],text:'Retirement planning gets real when “someday” becomes a date on the calendar. Instead of leaving retirement to guesswork, Harbor Ridge Advisory helps professionals use a consultation to sort accounts, questions, and assumptions before choosing a next step. What would you want answered first?'},
  {id:'athlete',terms:['TB3','athlete','NIL','community','brand'],text:'An NIL partnership is stronger when the brand shows up in person. Instead of buying a post, work with TB3 to activate at a youth camp this month: meet families, support community, and give the brand a real role. Which experience would your audience remember?'},
  {id:'dentist',terms:['Aster Dental Studio','dental','smile consultation'],text:'A photo can make one small detail impossible to ignore. Before choosing another whitening kit, book a smile consultation with Aster Dental Studio: discuss the dental options, your goals, and what will actually change. What would help you feel more at ease in photos?'},
  {id:'realtor',terms:['Maya Cole Homes','first-time buyer','home'],text:'The first home tour is exciting; the third is where details matter. Before you decide, Maya Cole Homes helps first-time buyers compare the home, check repair questions, and avoid falling for the kitchen alone. Which detail would you check before making an offer?'},
  {id:'fitness',terms:['Forge Method','strength','trial session','adults'],text:'You don’t need a perfect week to build strength. Instead, start with one Forge Method trial session: adults can test the coaching, find a pace that fits, and see how small-group training works before committing. What would make training easier to keep this week?'},
  {id:'bakery',terms:['Sunday Crumb','bakery','weekend preorder','pastry'],text:'Saturday’s best pastry shouldn’t disappear while you're in line. Instead, reserve your Sunday Crumb weekend preorder before Friday night and collect the bakery box when you arrive. Choose the pastries your group wants before the weekend rush. What belongs in your box?'},
  {id:'consultant',terms:['Signal North','operations','service business','discovery call'],text:'A full calendar can hide the work your team repeats. Before another service business hires to solve the pressure, Signal North helps find the operations bottleneck behind missed handoffs during a discovery call. Which task circles back most often on your team?'},
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

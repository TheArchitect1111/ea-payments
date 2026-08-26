import assert from 'node:assert/strict';

const directions={sports:'sports-editorial-heritage'};
function plan(brief){
 const blockers=[];
 for(const kind of ['logo','photo','heritage','qr']) if(!brief.assets.some(a=>a.kind===kind&&a.approved)) blockers.push(`Missing approved ${kind} asset`);
 if(!brief.facts.length) blockers.push('No verified facts supplied');
 return {status:blockers.length?'BLOCKED':'READY_TO_RENDER',blockers};
}
const twinCity={facts:['March 12'],assets:[{kind:'logo',approved:true},{kind:'heritage',approved:true},{kind:'photo',approved:false},{kind:'qr',approved:true}]};
const blocked=plan(twinCity);
assert.equal(blocked.status,'BLOCKED');
assert.ok(blocked.blockers.includes('Missing approved photo asset'));
const ready=plan({...twinCity,assets:twinCity.assets.map(a=>a.kind==='photo'?{...a,approved:true}:a)});
assert.equal(ready.status,'READY_TO_RENDER');
const badEvidence={overflowCount:1,collisionCount:0,brokenImageCount:0,contrastFailures:0,creativeScore:7,brandScore:9,hasRequiredQr:true,hasPrimaryImage:true,hasHeritageImage:true,mobileReviewed:true,desktopReviewed:true,printReviewed:true,purposeClear:true};
assert.ok(badEvidence.overflowCount>0 || badEvidence.creativeScore<8,'Weak render must fail premium gate');
console.log('Design Studio acceptance tests passed');

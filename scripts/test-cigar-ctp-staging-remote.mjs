import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.CIGAR_STAGING_BASE?.replace(/\/+$/,'');
if(!base||!base.startsWith('https://'))throw Error('CIGAR_STAGING_BASE (https URL) required');
const host=new URL(base).origin;
const json=JSON.parse(fs.readFileSync(new URL('../lib/cigar-ctp/questions.json',import.meta.url),'utf8'));
const answers={};
for(const q of json.questions.filter(q=>q.path==='all'||q.path==='brand')){
 answers[q.id]={selected:[q.options[0].id],detail:q.id==='B03'?'QA synthetic example: reports may be 14 days late. No real client data.':''};
}
const send=async(path,body,headers={})=>{
 const res=await fetch(base+path,{method:'POST',headers:{Origin:host,...headers},body,redirect:'manual'});
 const type=res.headers.get('content-type')??'';
 assert.ok(type.includes('application/json'),path+': Expected JSON, got '+res.status+' '+type);
 const payload=await res.json();
 return {status:res.status,payload};
};
const bad=await send('/api/cigar-ctp/preview/submit',JSON.stringify({
 qaOnly:true,consent:true,businessName:'Real Person',contactName:'Real Person',
 email:'user@publicmail.com',answers
}),{'Content-Type':'application/json'});
assert.equal(bad.status,400,'Real customer data must be rejected');
const fake=await send('/api/cigar-ctp/preview/submit',JSON.stringify({
 qaOnly:true,consent:true,businessName:'QA Synthetic Cigars',contactName:'QA Tester',
 email:'qa-synthetic@testing.example',answers,hoursPerWeek:6,laborCostPerHour:40
}),{'Content-Type':'application/json'});
assert.equal(fake.status,200,'Staging QA Airtable handoff failed ('+fake.status+'): '+JSON.stringify(fake.payload));
assert.equal(fake.payload.ok,true);
assert.match(fake.payload.qaSubmissionId,/^CIGAR-QA-/);
assert.equal(fake.payload.emailStatus,'draft-not-sent');
assert.equal(fake.payload.impact.annualHours,312);
assert.equal(fake.payload.impact.annualLaborCapacityValue,12480);
assert.equal(fake.payload.impact.realizedCashSavings,null);
const form=new FormData();
form.set('report',new File(['Invoice,Status,Amount\nQA-01,Paid,100\nQA-02,Unpaid,50\n'],'qa-report.csv',{type:'text/csv'}));
const upload=await send('/api/cigar-ctp/preview/report',form);
assert.equal(upload.status,200,'Report parse failed: '+JSON.stringify(upload.payload));
assert.equal(upload.payload.analysis.sheets[0].rows,3);
assert.equal(upload.payload.analysis.format,'csv');
console.log('PASS: staging QA saved to EA Airtable, id='+fake.payload.qaSubmissionId+', no email sent, rejects public PII, CSV report analyzed.');

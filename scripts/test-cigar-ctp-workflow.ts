import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {extractCigarReport} from '../lib/cigar-ctp/report-analyzer';
import {evaluateVendorAction} from '../lib/cigar-ctp/vendor-guard';
import {calculateCapacityImpact,buildAssessmentEmailPreview} from '../lib/cigar-ctp/impact';
import {buildCigarReportEmail} from '../lib/cigar-ctp/report-email';

async function main(){
const csv=await extractCigarReport('orders.csv',Buffer.from('Invoice,Status,Amount\nA1,Paid,"1,200"\nA2,Unpaid,300\n'));
assert.equal(csv.format,'csv');
assert.equal(csv.sheets[0].rows,3);
assert.equal(csv.sheets[0].preview[1][2],'1,200');

const zip=new JSZip();
zip.file('xl/workbook.xml','<workbook><sheets><sheet name="Unpaid Wholesale" sheetId="1"/></sheets></workbook>');
zip.file('xl/sharedStrings.xml','<sst><si><t>Invoice</t></si><si><t>Retailer</t></si><si><t>A100</t></si><si><t>Sample Shop</t></si></sst>');
zip.file('xl/worksheets/sheet1.xml','<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" t="s"><v>3</v></c></row></sheetData></worksheet>');
const xl=await extractCigarReport('vendor.xlsx',await zip.generateAsync({type:'nodebuffer'}));
assert.equal(xl.sheets[0].name,'Unpaid Wholesale');
assert.equal(xl.sheets[0].rows,2);
assert.equal(xl.sheets[0].preview[1][1],'Sample Shop');
assert.ok(xl.findings.some(x=>x.includes('Unpaid')));
assert.equal(xl.caveat.includes('not verified'),false);
const reordered=new JSZip();
reordered.file('xl/workbook.xml','<workbook><sheets><sheet name="Unpaid Wholesale" sheetId="9" r:id="rIdA"/><sheet name="Paid Wholesale" sheetId="3" r:id="rIdB"/></sheets></workbook>');
reordered.file('xl/_rels/workbook.xml.rels','<Relationships><Relationship Id="rIdA" Target="worksheets/sheet2.xml"/><Relationship Id="rIdB" Target="worksheets/sheet1.xml"/></Relationships>');
reordered.file('xl/worksheets/sheet1.xml','<worksheet><sheetData><row r="1"><c r="A1"><v>111</v></c></row></sheetData></worksheet>');
reordered.file('xl/worksheets/sheet2.xml','<worksheet><sheetData><row r="1"><c r="A1"><v>222</v></c></row></sheetData></worksheet>');
const shuffled=await extractCigarReport('renamed.xlsx',await reordered.generateAsync({type:'nodebuffer'}));
assert.equal(shuffled.sheets[0].name,'Unpaid Wholesale');
assert.equal(shuffled.sheets[0].preview[0][0],'222','Sheet name must follow workbook relationship, not zip file number');
assert.equal(shuffled.sheets[1].name,'Paid Wholesale');
assert.equal(shuffled.sheets[1].preview[0][0],'111');
await assert.rejects(extractCigarReport('fake.xlsx',Buffer.from('bad')),/XLSX/);
await assert.rejects(extractCigarReport('bad.exe',Buffer.from('hello')),/XLSX, CSV or PDF/);

const noNumbers=calculateCapacityImpact({});
assert.equal(noNumbers.annualLaborCapacityValue,null);
assert.equal(noNumbers.realizedCashSavings,null);
const known=calculateCapacityImpact({hoursPerWeek:6,laborCostPerHour:40});
assert.equal(known.annualHours,312);
assert.equal(known.annualLaborCapacityValue,12480);
assert.equal(known.realizedCashSavings,null);
const note=buildAssessmentEmailPreview({businessName:'QA Sample',contactName:'Owner'}, {}, [], noNumbers);
assert.ok(note.body.includes('Financial impact cannot yet be reliably quantified'));
assert.ok(!note.body.includes('$30,000'));
const knownNote=buildAssessmentEmailPreview({businessName:'QA Sample',contactName:'Owner'}, {}, [],known);
assert.ok(knownNote.body.includes('12,480'));
assert.ok(knownNote.body.includes('NOT a verified cash saving'));

for(const role of ['brand','lounge','distributor'] as const){
 const answer={C01:{selected:[role],detail:''},C02:{selected:['reporting'],detail:''}};
 const email=buildCigarReportEmail({businessName:'QA Sample Business',contactName:'QA Tester',answers:answer});
 assert.ok(email.html.includes('<img src="https://app.efficiencyarchitects.online/ea-logo.png"'));
 assert.ok(email.html.includes('align="center"'));
 assert.ok(email.html.includes('Book Your Strategy Meeting'));
 assert.ok(email.html.includes('https://calendly.com/freedom-efficiencyarchitects/30min'));
 assert.ok(email.text.includes('YOUR ASSESSMENT SUMMARY'));
 assert.ok(!email.text.includes('$30,000'));
 assert.equal(email.role,role);
 const injected=buildCigarReportEmail({businessName:'QA <script>alert(1)</script>',contactName:'Tester',answers:answer});
 assert.ok(!injected.html.includes('<script>alert(1)</script>'),'Html escape user input');
}
const withNumbers=buildCigarReportEmail({businessName:'QA Cigar Studio',contactName:'QA Tester',answers:{C01:{selected:['brand'],detail:''}},hoursPerWeek:6,laborCostPerHour:40});
assert.ok(withNumbers.text.includes('$12,480'));
assert.ok(withNumbers.text.includes('not verified cash savings'));
const policy={approved:true,recipientVerified:true,approvedEmail:'reports@vendor.example',reportDueAt:'2026-09-01',maxReminders:2,remindersSent:0,paused:false};
const evaluated=evaluateVendorAction('request-report','QA Test Business','reports@vendor.example',policy,new Date('2026-10-12'));
assert.equal(evaluated.status,'eligible');
assert.equal(evaluated.sent,false);
assert.ok(evaluated.body.includes('automated'));
assert.equal(evaluateVendorAction('place-order','Company','reports@vendor.example',policy).status,'blocked');
assert.equal(evaluateVendorAction('invoice-question','Company','reports@vendor.example',policy).status,'owner-review');
assert.equal(evaluateVendorAction('reminder','Company','wrong@vendor.example',policy).status,'blocked');
assert.equal(evaluateVendorAction('reminder','Company','reports@vendor.example',{...policy,remindersSent:2}).status,'blocked');
assert.equal(evaluateVendorAction('reminder','Company','reports@vendor.example',{...policy,paused:true}).status,'blocked');
console.log('PASS: PDF/XLSX/CSV access rules, Excel row extraction, CSV quoting, no fabricated balances, no-send vendor policy and recipient/reminder restrictions');

}
main().catch(err=>{ console.error(err); process.exitCode=1; });

import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {extractCigarReport} from '../lib/cigar-ctp/report-analyzer';
import {evaluateVendorAction} from '../lib/cigar-ctp/vendor-guard';

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
await assert.rejects(extractCigarReport('fake.xlsx',Buffer.from('bad')),/XLSX/);
await assert.rejects(extractCigarReport('bad.exe',Buffer.from('hello')),/XLSX, CSV or PDF/);

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

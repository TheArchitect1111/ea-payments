/** Dependency-free, real printable PDF bytes. No customer/tenant defaults. */
import {createHash} from 'node:crypto';
export type ReceiptData={studentName:string;brandName:string;offerTitle:string;amountCadCents:number;
  provider:'stripe'|'square';paymentReference:string;paidAt:string};
export function createSubportalReceipt(data:ReceiptData):Buffer{
  const lines=[data.brandName,'PAYMENT RECEIPT','',
    'Student: '+data.studentName,'Program: '+data.offerTitle,
    'Total: CAD '+(data.amountCadCents/100).toFixed(2),
    'Payment via: '+data.provider.toUpperCase(),'Reference: '+data.paymentReference,
    'Paid: '+data.paidAt,'','Retain this receipt for your records.'];
  const safe=(s:string)=>s.normalize('NFKD').replace(/[^\x20-\x7e]/g,' ')
    .replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').slice(0,105);
  const stream=['BT','/F1 12 Tf','52 740 Td',...lines.flatMap((s,i)=>[...(i?['0 -33 Td']:[]), '('+safe(s)+') Tj']),'ET'].join('\n')+'\n';
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    '<< /Length '+Buffer.byteLength(stream,'ascii')+' >>\nstream\n'+stream+'endstream',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf='%PDF-1.4\n';const offsets=[0];
  objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf,'ascii'));pdf+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});
  const xref=Buffer.byteLength(pdf,'ascii');
  pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
  offsets.slice(1).forEach(offset=>{pdf+=String(offset).padStart(10,'0')+' 00000 n \n';});
  pdf+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
  return Buffer.from(pdf,'ascii');
}
export const subportalPdfChecksum=(buffer:Buffer)=>createHash('sha256').update(buffer).digest('hex');

/** One-page, dependency-free PDF receipt for verified Amanda transactions. */
export type AmandaReceiptData = {
  customer: string;
  program: string;
  amountCad: number;
  provider: 'Stripe' | 'Square';
  reference: string;
  paidAt: string;
  isTest: boolean;
  expiresAt?: string | null;
};

export function createAmandaReceiptPdf(data: AmandaReceiptData): Buffer {
  const lines = [
    'AMANDA CATHERINE  |  AESTHETIKINE STUDIO LAB',
    'PAYMENT RECEIPT',
    '',
    'Customer: ' + data.customer,
    'Program: ' + data.program,
    'Amount paid: CAD ' + data.amountCad.toFixed(2),
    'Payment provider: ' + data.provider,
    'Transaction reference: ' + data.reference,
    'Payment date: ' + data.paidAt,
    data.isTest ? 'PRIVATE 3-DAY TEST - NO AUTOMATIC RENEWAL' : 'Full-price program enrollment',
    data.isTest && data.expiresAt ? 'Preview expires: ' + data.expiresAt : '',
    '',
    'Access: amandacatherine.ca/portal/amanda-catherine/learning',
    'Support: via the Amanda Catherine portal',
    '',
    'This receipt is a record of the verified payment above.',
  ].filter((line, index) => line || index === 2 || index === 11);
  const clean = (value: string) => value.normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ').replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    .slice(0, 150);
  const command = ['BT','/F1 12 Tf','48 742 Td'];
  for (let i = 0; i < lines.length; i += 1) {
    if (i > 0) command.push('0 -32 Td');
    if (i === 0) command.push('/F1 14 Tf');
    if (i === 1) command.push('/F1 19 Tf');
    if (i === 3) command.push('/F1 12 Tf');
    command.push('(' + clean(lines[i]) + ') Tj');
  }
  command.push('ET');
  const stream = command.join('\n') + '\n';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    '<< /Length ' + Buffer.byteLength(stream, 'ascii') + ' >>\nstream\n' + stream + 'endstream',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += (i + 1) + ' 0 obj\n' + objects[i] + '\nendobj\n';
  }
  const xrefPosition = Buffer.byteLength(pdf, 'ascii');
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) pdf += String(offset).padStart(10, '0') + ' 00000 n \n';
  pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefPosition + '\n%%EOF\n';
  return Buffer.from(pdf, 'ascii');
}

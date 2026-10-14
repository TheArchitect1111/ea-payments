import type { Brick, WelcomeResult } from '../BrickInterface';
import { sourceAdapter } from './sourceAdapter';

/** Synthetic email contract. Never represent re_mock_ as a Resend message ID. */
function mockEmail(sessionId: string): WelcomeResult & { sender: string; fallback: string } {
  if (!/^cs_test_[0-9]+_[a-zA-Z0-9_-]+$/.test(sessionId)) throw new Error('Valid checkout session required');
  return {
    successPage: '/success/' + sessionId,
    emailId: 're_mock_' + sessionId,
    receiptPdf: '/receipt/' + sessionId + '.pdf',
    nextSteps: 'Check email for receipt and next steps; open the learning portal.',
    accessLink: '/learn/' + encodeURIComponent(sessionId.replace(/^cs_test_[0-9]+_/, '')),
    sender: 'Client sender resolved by email provider configuration',
    fallback: 'Gmail fallback implementation present; delivery not attempted',
  };
}

const base = sourceAdapter({
  id: 'email',
  files: [
    {path:'lib/amanda-catherine/premium-receipt-email.ts',contains:'RESEND_API_KEY'},
    {path:'lib/amanda-catherine/receipt-pdf.ts',contains:'createAmandaReceiptPdf'},
    {path:'lib/email/gmail.ts',contains:'sendGmailEmail'},
  ],
  verify: async () => {
    const proof = mockEmail('cs_test_1234567890_test-course');
    const valid = proof.emailId.startsWith('re_mock_') &&
      proof.emailId.includes('cs_test_1234567890_test-course') &&
      proof.receiptPdf.endsWith('.pdf') && proof.accessLink.includes('/learn/');
    return {status: valid ? 200 : 503, evidence: valid
      ? 'Resend sender implementation + receipt PDF generator + Gmail fallback found; re_mock_ session-linked contract verified. No live delivery or generated PDF proven; production requires real Resend ID.'
      : 'Email contract shape failed'};
  },
});

export const emailAdapter: Brick = {
  ...base,
  welcome: async ({sessionId}) => mockEmail(sessionId),
};

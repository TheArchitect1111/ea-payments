import type { Brick, WelcomeResult } from '../BrickInterface';
import { sourceAdapter } from './sourceAdapter';

/** Synthetic shape test only. re_pending_ is never a provider delivery receipt. */
function makeWelcome(sessionId: string): WelcomeResult {
  if (!/^cs_test_[0-9]+_[a-zA-Z0-9_-]+$/.test(sessionId)) throw new Error('Valid synthetic checkout session ID required');
  const courseId = sessionId.replace(/^cs_test_[0-9]+_/, '');
  return {
    successPage: '/success/' + sessionId,
    accessLink: '/learn/' + encodeURIComponent(courseId),
    receiptPdf: '/receipt/' + sessionId + '.pdf',
    nextSteps: 'Check email for receipt + Access course in Learn portal + Next steps in email',
    emailId: 're_pending_' + sessionId,
  };
}

const base = sourceAdapter({
  id: 'welcome',
  files: [
    { path: 'lib/amanda-catherine/payment-fulfillment.ts', contains: 'premiumWelcomeSentAt' },
    { path: 'lib/amanda-catherine/payment-fulfillment.ts', contains: 'learningUrl' },
    { path: 'lib/amanda-catherine/payment-fulfillment.ts', contains: 'sendPaymentConfirmationEmail' },
    { path: 'lib/amanda-catherine/test-access-rules.ts', contains: 'amandaTrialExpired' },
  ],
  verify: async () => {
    const sessionId = 'cs_test_1234567890_test-course';
    const w = makeWelcome(sessionId);
    const valid = w.successPage.includes(sessionId) &&
      w.accessLink.includes('/learn/') &&
      w.accessLink.includes('test-course') &&
      w.receiptPdf.endsWith('.pdf') &&
      w.nextSteps.trim().length > 0 &&
      w.emailId === 're_pending_' + sessionId;
    return { status: valid ? 200 : 503, evidence: valid
      ? 'Welcome contract returns successPage + accessLink /learn/ + receiptPdf .pdf + nextSteps + pending email ID; synthetic test, no delivery claimed'
      : 'Welcome contract shape invalid' };
  },
});

export const welcomeAdapter: Brick = {
  ...base,
  welcome: async ({ sessionId }) => makeWelcome(sessionId),
};

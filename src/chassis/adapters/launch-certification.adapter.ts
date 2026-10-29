/**
 * Chassis socket for the shared launch-certification runner.
 * A healthy socket means the runner is wired; it does not certify a client deployment.
 */
export const launchCertificationAdapter = {
  id: 'launch-certification',
  async health() {
    return {
      status: 200 as const,
      evidence: 'Reusable evidence-bound launch certification runner is wired; client deployment certification is evaluated separately.',
    };
  },
  price() {
    return { currency: 'CAD' as const, amount: 0 as const, note: 'included with portal' as const };
  },
  async checkout() {
    return { notApplicable: true as const, reason: 'Launch certification is an operations capability, not a commerce socket.' };
  },
  async welcome() {
    return {
      successPage: '/admin/ea-factory/launch',
      emailId: 'not-applicable',
      receiptPdf: 'not-applicable',
      nextSteps: 'Review the evidence-bound certification report and resolve every blocker.',
      accessLink: '/admin/ea-factory/launch',
    };
  },
  attach() { return true; },
};

export default launchCertificationAdapter;

/** Conservative TB3 reserve ledger. Only provider-reconciled, settled cash may be considered.
 * Never use merchandise gross, estimated Printful costs or Stripe balance as cash. */
export type ReserveInputs = {
  settledPayoutCents: number | null;
  verifiedPrintfulChargesCents: number | null;
  taxAndRefundObligationsCents: number | null;
  otherCommittedCostsCents: number | null;
  parentLoanReceivedCents: number | null;
  previousRepaymentsCents: number | null;
};
export type ReserveResult = {
  reconciled: boolean;
  businessCashAfterCommitmentsCents: number | null;
  outstandingLoanCents: number | null;
  reserveTargetCents: number;
  eligibleRepaymentCents: number;
};
export function reconcileTb3Reserve(x: ReserveInputs): ReserveResult {
  const entries = Object.values(x);
  const valid = entries.every(n => n !== null && Number.isSafeInteger(n) && n >= 0);
  if (!valid) return {reconciled:false,businessCashAfterCommitmentsCents:null,
    outstandingLoanCents:null,reserveTargetCents:50000,eligibleRepaymentCents:0};
  const loan = x.parentLoanReceivedCents!;
  const previous = x.previousRepaymentsCents!;
  if (previous > loan) return {reconciled:false,businessCashAfterCommitmentsCents:null,
    outstandingLoanCents:null,reserveTargetCents:50000,eligibleRepaymentCents:0};
  const cash = x.settledPayoutCents! - x.verifiedPrintfulChargesCents! -
    x.taxAndRefundObligationsCents! - x.otherCommittedCostsCents!;
  const outstanding = loan - previous;
  return {reconciled:true,businessCashAfterCommitmentsCents:cash,
    outstandingLoanCents:outstanding,reserveTargetCents:50000,
    eligibleRepaymentCents:Math.min(outstanding,Math.max(0,cash-50000))};
}

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reconcileTb3Reserve} from '../lib/tb3/reserve-reconciliation';

const base={settledPayoutCents:120000,verifiedPrintfulChargesCents:30000,
 taxAndRefundObligationsCents:10000,otherCommittedCostsCents:5000,
 parentLoanReceivedCents:50000,previousRepaymentsCents:0};
test('no provider evidence means no discretionary repayments',()=>{
 const r=reconcileTb3Reserve({...base,settledPayoutCents:null});
 assert.equal(r.reconciled,false);
 assert.equal(r.eligibleRepaymentCents,0);
});
test('reconciled business cash preserves 500-dollar working reserve',()=>{
 const r=reconcileTb3Reserve(base);
 assert.equal(r.businessCashAfterCommitmentsCents,75000);
 assert.equal(r.eligibleRepaymentCents,25000);
 assert.equal(r.outstandingLoanCents,50000);
});
test('cannot repay more than outstanding parent loan',()=>{
 const r=reconcileTb3Reserve({...base,previousRepaymentsCents:40000});
 assert.equal(r.outstandingLoanCents,10000);
 assert.equal(r.eligibleRepaymentCents,10000);
});
test('below-target cash cannot authorize repayment',()=>{
 assert.equal(reconcileTb3Reserve({...base,settledPayoutCents:60000}).eligibleRepaymentCents,0);
});
test('invalid negative or fractional ledger inputs fail closed',()=>{
 for(const amount of [-1,1.25,NaN,Infinity]){
  assert.equal(reconcileTb3Reserve({...base,verifiedPrintfulChargesCents:amount}).reconciled,false);
 }
});
test('cannot record repayments larger than the received loan',()=>{
 assert.equal(reconcileTb3Reserve({...base,previousRepaymentsCents:50001}).reconciled,false);
});
test('zero outstanding loan cannot create a repayment',()=>{
 assert.equal(reconcileTb3Reserve({...base,parentLoanReceivedCents:0}).eligibleRepaymentCents,0);
});

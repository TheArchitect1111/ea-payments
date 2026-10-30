/** Universal chassis contract. Integration proof must be established before attach(). */
export type BrickHealth = { status: 200 | 503; evidence: string };
export type CheckoutType = 'stripe-test' | 'square-full';
export type CheckoutRequest = { type: CheckoutType; courseId: string };
export type CheckoutResult = { sessionId: string; entitlement: string };
/** Explicit non-payment socket result; no synthetic payment identity is created. */
export type CheckoutNotApplicable = { notApplicable: true; reason: string };
export type CheckoutSocketResult = CheckoutResult | CheckoutNotApplicable;
export type NonPaymentPriceContract = { currency: 'CAD'; amount: 0; note: 'included with portal' };
export type WelcomeRequest = { sessionId: string };
export type WelcomeResult = { successPage: string; emailId: string; receiptPdf: string; nextSteps: string; accessLink: string };
/** Socket defaults preserve existing payment adapters and their narrow results. */
export interface Brick<
  PriceResponse extends { amountCad: number; contractId: string } | NonPaymentPriceContract = { amountCad: number; contractId: string },
  CheckoutResponse extends CheckoutSocketResult = CheckoutSocketResult,
  WelcomeArguments extends unknown[] = [payment: WelcomeRequest],
  WelcomeResponse = WelcomeResult
> {
  readonly id: string;
  health(): Promise<BrickHealth>;
  price(): PriceResponse;
  checkout(opts: CheckoutRequest): Promise<CheckoutResponse>;
  welcome(...args: WelcomeArguments): Promise<WelcomeResponse>;
  /** Only true after the chassis has recorded a successful integration test. */
  attach(): boolean;
}
export const BRICK_IDS = ['auth','lms','billing','catalog','menu','checkout','welcome','email','entitlement','jane','amazon','preview','production-gate','chassis-cert','launch-certification'] as const;
export type BrickId = typeof BRICK_IDS[number];

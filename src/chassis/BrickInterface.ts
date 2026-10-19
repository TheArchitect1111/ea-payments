/** Universal chassis contract. Integration proof must be established before attach(). */
export type BrickHealth = { status: 200 | 503; evidence: string };
export type CheckoutType = 'stripe-test' | 'stripe-live' | 'square-full';
export type CheckoutRequest = { type: CheckoutType; courseId: string; email?: string; returnOrigin?: string };
export type CheckoutResult = { sessionId: string; entitlement: string; url?: string };
export type WelcomeRequest = { sessionId: string };
export type WelcomeResult = { successPage: string; emailId: string; receiptPdf: string; nextSteps: string; accessLink: string };
export interface Brick {
  readonly id: string;
  health(): Promise<BrickHealth>;
  price(): { amountCad: number; contractId: string };
  checkout(opts: CheckoutRequest): Promise<CheckoutResult>;
  welcome(payment: WelcomeRequest): Promise<WelcomeResult>;
  /** Only true after the chassis has recorded a successful integration test. */
  attach(): boolean;
}
export const BRICK_IDS = ['auth','lms','billing','catalog','menu','checkout','welcome','email','entitlement','jane','amazon','preview','production-gate','chassis-cert'] as const;
export type BrickId = typeof BRICK_IDS[number];

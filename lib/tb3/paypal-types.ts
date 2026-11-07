import { z } from "zod";
import { resolveTb3Cart } from "./merch-cart";

export const Recipient = z
  .object({
    name: z.string().trim().min(2).max(100),
    address1: z.string().trim().min(1).max(150),
    address2: z.string().trim().max(150).optional(),
    city: z.string().trim().min(1).max(100),
    state_code: z.string().regex(/^[A-Z]{2}$/),
    country_code: z.literal("US"),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  })
  .strict();
export const CheckoutInput = z
  .object({
    checkoutToken: z.string().regex(/^[a-f0-9]{64}$/),
    cart: z.unknown(),
    email: z.string().trim().email().max(254),
    recipient: Recipient,
  })
  .strict();
export type Lines = ReturnType<typeof resolveTb3Cart>;
export type PayPalIntent = {
  id: string;
  tenant: "tarris";
  mode: "live" | "sandbox";
  merchantId: string;
  inputHash: string;
  createdAt: string;
  email: string;
  recipient: z.infer<typeof Recipient>;
  lines: Lines;
  subtotal: number;
  shipping: number;
  tax: number;
  shippingMethod: string;
  total: number;
  paypalId?: string;
  captureId?: string;
  state: "creating" | "created" | "paid" | "hold";
  printfulId?: number;
  fulfillment:
    | "pending"
    | "draft"
    | "confirming"
    | "confirmed"
    | "review"
    | "simulated";
};
// Provider JSON is untrusted and heterogeneous. Each security-relevant field is
// checked by the transport/service before use; this type never establishes truth.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PayPalObject = Record<string, any>;
export interface PayPalLedger {
  lock<T>(
    id: string,
    fn: (
      row: PayPalIntent | null,
      save: (row: PayPalIntent) => Promise<void>,
    ) => Promise<T>,
  ): Promise<T>;
  find(orderId: string, captureId?: string): Promise<PayPalIntent | null>;
}
export function cents(value: unknown): number {
  if (typeof value !== "string" || !/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value))
    throw Error("Invalid money");
  const [whole, part = ""] = value.split(".");
  const n = Number(whole) * 100 + Number(part.padEnd(2, "0"));
  if (!Number.isSafeInteger(n) || n < 0 || n > 100000000)
    throw Error("Invalid money");
  return n;
}
export const dollars = (value: number) => (value / 100).toFixed(2);

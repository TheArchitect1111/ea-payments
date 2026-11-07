import { createPayPalHandlers } from "./paypal-http";
import { getPayPalRuntime } from "./paypal-runtime";
import { checkRateLimit } from "@/lib/ai/rate-limit";
export const paypalHandlers = createPayPalHandlers(
  getPayPalRuntime,
  (key) => checkRateLimit("tb3-paypal:" + key, 40, 60 * 60 * 1000).ok,
);

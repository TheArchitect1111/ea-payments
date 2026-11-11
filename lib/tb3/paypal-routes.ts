import { createPayPalHandlers } from "./paypal-http";
import { getPayPalRuntime } from "./paypal-runtime";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import type { NextRequest } from "next/server";
import { hasTb3SandboxTestSession } from "./paypal-sandbox-test-session";
export const paypalHandlers = createPayPalHandlers(
  getPayPalRuntime,
  (key) => checkRateLimit("tb3-paypal:" + key, key === "sandbox-session" ? 5 : key === "sandbox-payee-diagnostic" ? 1 : 40, 60 * 60 * 1000).ok,
  async (request) => {
    if (hasTb3SandboxTestSession(request)) return { actor: "sandbox-test", workspace: "preview" };
    const { authorize } = await import("./server");
    return authorize(request as NextRequest, false);
  },
);

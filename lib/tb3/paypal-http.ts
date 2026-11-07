import { z } from "zod";
import type { paypalService } from "./paypal-service";
import type { PayPalConfig } from "./paypal-config";
import { PayPalError } from "./paypal-transport";

export type PayPalRuntime = {
  config: PayPalConfig;
  service: ReturnType<typeof paypalService>;
  verify: (headers: Headers, event: unknown) => Promise<boolean>;
};
const reply = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
async function read(req: Request, limit: number) {
  if (
    !req.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw Error("JSON required");
  const reader = req.body?.getReader();
  if (!reader) throw Error("Body required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw Error("Body too large");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function recordCheckoutFailure(action: "create" | "capture", error: unknown) {
  // Log only error classification. Never log personal details, secrets or payment IDs.
  const isProvider = error instanceof PayPalError;
  const databaseCode = !isProvider && error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code || "").slice(0, 12) : undefined;
  console.error("[tb3-paypal] checkout failure", {
    action,
    source: isProvider ? "paypal" : databaseCode ? "database" : "application",
    status: isProvider ? error.status : undefined,
    issue: isProvider ? error.issue : undefined,
    databaseCode
  });
}

export function createPayPalHandlers(
  getRuntime: () => PayPalRuntime | null,
  rateAllowed: (key: string) => boolean = () => true,
) {
  const buyer = (req: Request, rt: PayPalRuntime) =>
    req.headers.get("origin") === rt.config.origin &&
    new URL(req.url).origin === rt.config.origin;
  return {
    async config() {
      const rt = getRuntime();
      return reply(
        rt
          ? { available: true, clientId: rt.config.clientId, currency: "USD" }
          : { available: false },
      );
    },
    async create(req: Request) {
      const rt = getRuntime();
      if (!rt) return reply({ error: "PayPal checkout is unavailable." }, 503);
      if (!buyer(req, rt))
        return reply({ error: "Request origin denied." }, 403);
      if (
        !rateAllowed(
          (req.headers.get("x-forwarded-for") || "unknown").split(",")[0]!,
        )
      )
        return reply({ error: "Too many checkout requests." }, 429);
      try {
        return reply(await rt.service.create(await read(req, 16384)));
      } catch (error) {
        recordCheckoutFailure("create", error);
        return reply(
          { error: "Unable to create checkout. No payment was confirmed." },
          503,
        );
      }
    },
    async capture(req: Request) {
      const rt = getRuntime();
      if (!rt) return reply({ error: "PayPal checkout is unavailable." }, 503);
      if (!buyer(req, rt))
        return reply({ error: "Request origin denied." }, 403);
      if (
        !rateAllowed(
          "capture:" +
            (req.headers.get("x-forwarded-for") || "unknown").split(",")[0],
        )
      )
        return reply({ error: "Too many payment checks." }, 429);
      try {
        const body = z
          .object({
            checkoutToken: z.string().regex(/^[a-f0-9]{64}$/),
            orderId: z.string().regex(/^[A-Za-z0-9]{6,64}$/),
          })
          .strict()
          .parse(await read(req, 2048));
        const result = await rt.service.capture(
          body.checkoutToken,
          body.orderId,
        );
        return reply(result, result.status === "pending" ? 202 : 200);
      } catch (error) {
        recordCheckoutFailure("capture", error);
        return reply(
          {
            error:
              error instanceof PayPalError &&
              error.issue === "INSTRUMENT_DECLINED"
                ? "Your funding source was declined. Choose another method in PayPal."
                : "Payment could not be verified. Check payment status before trying another checkout.",
          },
          503,
        );
      }
    },
    async webhook(req: Request) {
      const rt = getRuntime();
      if (!rt) return reply({ error: "PayPal webhook unavailable." }, 503);
      try {
        const event = await read(req, 131072);
        if (
          !event ||
          typeof event.id !== "string" ||
          typeof event.event_type !== "string"
        )
          return reply({ error: "Invalid event." }, 400);
        if (!(await rt.verify(req.headers, event)))
          return reply({ error: "Invalid signature." }, 400);
        await rt.service.webhook(event);
        return reply({ received: true });
      } catch {
        return reply({ error: "Webhook reconciliation pending retry." }, 503);
      }
    },
    async cancel(req: Request) {
      const rt = getRuntime();
      if (!rt) return reply({ error: "PayPal checkout is unavailable." }, 503);
      if (!buyer(req, rt))
        return reply({ error: "Request origin denied." }, 403);
      if (
        !rateAllowed(
          "cancel:" +
            (req.headers.get("x-forwarded-for") || "unknown").split(",")[0],
        )
      )
        return reply({ error: "Too many cancellation requests." }, 429);
      try {
        const input = z
          .object({
            checkoutToken: z.string().regex(/^[a-f0-9]{64}$/),
            orderId: z.string().regex(/^[A-Za-z0-9]{6,64}$/),
          })
          .strict()
          .parse(await read(req, 2048));
        return reply(
          await rt.service.cancel(input.checkoutToken, input.orderId),
        );
      } catch {
        return reply(
          {
            error: "Cancellation could not be confirmed. Check payment status.",
          },
          503,
        );
      }
    },
  };
}

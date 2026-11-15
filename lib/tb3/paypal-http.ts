import { z } from "zod";
import { expiredSandboxTestCookieHeader, issueTb3SandboxTestCookie, sandboxTestCookieHeader, TB3_SANDBOX_TEST_TOKEN_ENV } from "./paypal-sandbox-test-session";
import type { paypalService } from "./paypal-service";
import type { PayPalConfig } from "./paypal-config";
import { PayPalError } from "./paypal-transport";
import { TB3_PAYPAL_SANDBOX_TEST_BRANCH } from "./paypal-sandbox-test-item";

export type PayPalRuntime = {
  config: PayPalConfig;
  service: ReturnType<typeof paypalService>;
  verify: (headers: Headers, event: unknown) => Promise<boolean>;
  sandboxTestItem?: boolean;
  sandboxPayeeDiagnostic?: () => Promise<unknown>;
};
const reply = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
function safePayeeDiagnosticResult(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Invalid diagnostic result");
  const result = value as Record<string, unknown>;
  const status = ["CREATED", "PAYER_ACTION_REQUIRED", "APPROVED", "COMPLETED", "VOIDED", "OTHER"];
  const source = ["create_response", "readback", "not_returned"];
  return {
    orderCreated: result.orderCreated === true,
    orderStatus: typeof result.orderStatus === "string" && status.includes(result.orderStatus) ? result.orderStatus : "OTHER",
    intentCapture: result.intentCapture === true,
    purchaseUnitCount: Number.isInteger(result.purchaseUnitCount) && Number(result.purchaseUnitCount) >= 0 ? Number(result.purchaseUnitCount) : 0,
    explicitPayeeOmitted: result.explicitPayeeOmitted === true,
    amountMatches: result.amountMatches === true,
    fixtureBreakdownMatches: result.fixtureBreakdownMatches === true,
    paymentCaptured: result.paymentCaptured === true,
    merchantIdentityReturned: result.merchantIdentityReturned === true,
    merchantMatchesExpected: result.merchantMatchesExpected === true || result.merchantMatchesExpected === false ? result.merchantMatchesExpected : null,
    merchantIdentitySource: typeof result.merchantIdentitySource === "string" && source.includes(result.merchantIdentitySource) ? result.merchantIdentitySource : "not_returned",
  };
}
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
export function createPayPalHandlers(
  getRuntime: () => PayPalRuntime | null,
  rateAllowed: (key: string) => boolean = () => true,
  authorizeSandboxTest?: (request: Request) => Promise<unknown>,
  sandboxTestTokenVerifier: () => string | undefined = () => process.env[TB3_SANDBOX_TEST_TOKEN_ENV],
  sandboxPayeeDiagnosticScope: () => boolean = () =>
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === TB3_PAYPAL_SANDBOX_TEST_BRANCH,
) {
  const sandboxTestAuthorized = async (request: Request, runtime: PayPalRuntime) => {
    if (!runtime.sandboxTestItem) return true;
    if (!authorizeSandboxTest) return false;
    try {
      await authorizeSandboxTest(request);
      return true;
    } catch {
      return false;
    }
  };
  const buyer = (req: Request, rt: PayPalRuntime) =>
    req.headers.get("origin") === rt.config.origin &&
    new URL(req.url).origin === rt.config.origin;
  return {
    async sandboxPayeeDiagnostic(req: Request) {
      if (!sandboxPayeeDiagnosticScope()) return reply({ error: "Not found." }, 404);
      const rt = getRuntime();
      if (!rt?.sandboxTestItem || rt.config.mode !== "sandbox" || !rt.sandboxPayeeDiagnostic)
        return reply({ error: "Sandbox diagnostic unavailable." }, 404);
      if (!buyer(req, rt)) return reply({ error: "Request origin denied." }, 403);
      if (!(await sandboxTestAuthorized(req, rt)))
        return reply({ error: "Private Sandbox certification access required." }, 403);
      if (!rateAllowed("sandbox-payee-diagnostic"))
        return reply({ error: "Diagnostic rate limit reached." }, 429);
      try {
        return reply(safePayeeDiagnosticResult(await rt.sandboxPayeeDiagnostic()));
      } catch (error) {
        const safeIssue = error instanceof PayPalError && /^[A-Z_]{1,40}$/.test(error.issue)
          ? error.issue
          : "DIAGNOSTIC_FAILED";
        return reply({
          orderCreated: false,
          error: safeIssue,
          providerStatus: error instanceof PayPalError ? error.status : null,
        }, 502);
      }
    },
    async sandboxTestSession(req: Request) {
      const rt = getRuntime();
      if (!rt?.sandboxTestItem || rt.config.mode !== "sandbox") return reply({ error: "Sandbox certification is unavailable." }, 404);
      if (new URL(req.url).origin !== rt.config.origin || req.headers.get("origin") !== rt.config.origin)
        return reply({ error: "Request origin denied." }, 403);
      if (!rateAllowed("sandbox-session")) return reply({ error: "Please wait before trying again." }, 429);
      if (req.method === "DELETE") {
        return new Response(null, { status: 204, headers: { "Cache-Control": "no-store", "Set-Cookie": expiredSandboxTestCookieHeader() } });
      }
      let body: unknown;
      try { body = await read(req, 1024); } catch { return reply({ error: "Sandbox test access was not accepted." }, 400); }
      if (!body || typeof body !== "object" || Object.keys(body).length !== 1 || typeof (body as { token?: unknown }).token !== "string")
        return reply({ error: "Sandbox test access was not accepted." }, 401);
      const session = issueTb3SandboxTestCookie((body as { token: string }).token, sandboxTestTokenVerifier());
      if (!session) return reply({ error: "Sandbox test access was not accepted." }, 401);
      return new Response(null, { status: 204, headers: { "Cache-Control": "no-store", "Set-Cookie": sandboxTestCookieHeader(session.value, session.maxAge) } });
    },
    async config(req?: Request) {
      const rt = getRuntime();
      if (rt?.sandboxTestItem && (!req || !(await sandboxTestAuthorized(req, rt))))
        return reply({ available: false }, 403);
      return reply(
        rt
          ? { available: true, clientId: rt.config.clientId, currency: "USD" }
          : { available: false },
      );
    },
    async create(req: Request) {
      const rt = getRuntime();
      if (!rt) return reply({ error: "PayPal checkout is unavailable." }, 503);
      if (!(await sandboxTestAuthorized(req, rt)))
        return reply({ error: "Private Sandbox certification access required." }, 403);
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
      } catch {
        return reply(
          { error: "Unable to create checkout. No payment was confirmed." },
          503,
        );
      }
    },
    async capture(req: Request) {
      const rt = getRuntime();
      if (!rt) return reply({ error: "PayPal checkout is unavailable." }, 503);
      if (!(await sandboxTestAuthorized(req, rt)))
        return reply({ error: "Private Sandbox certification access required." }, 403);
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
      if (!(await sandboxTestAuthorized(req, rt)))
        return reply({ error: "Private Sandbox certification access required." }, 403);
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

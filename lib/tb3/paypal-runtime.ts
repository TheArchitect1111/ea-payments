import "server-only";
import { paypalConfig } from "./paypal-config";
import { paypalTransport, verifyPayPalWebhook } from "./paypal-transport";
import { paypalService } from "./paypal-service";
import { paypalLedger } from "./paypal-ledger";
import { paypalDatabaseUrl } from "./paypal-database-config";
import { tb3Printful } from "./printful-client";
import { cents, type Lines, type PayPalIntent } from "./paypal-types";

const states = new Set(
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(
    " ",
  ),
);
export async function quotePayPalOrder(
  lines: Lines,
  recipient: PayPalIntent["recipient"],
) {
  if (paypalConfig()?.mode !== "live")
    throw Error("Live Printful quote unavailable in sandbox");
  if (!states.has(recipient.state_code))
    throw Error("Unsupported delivery state");
  // No invented sales-tax calculation or assumption that Printful's supplier tax
  // is the customer's sales tax. Other destinations require an approved adapter.
  const reviewed = (process.env.TB3_PAYPAL_NO_TAX_STATES || "")
    .split(",")
    .map((x) => x.trim());
  if (
    process.env.TB3_PAYPAL_TAX_POLICY_APPROVED !== "true" ||
    !reviewed.includes(recipient.state_code)
  )
    throw Error("Approved destination tax calculation required");
  for (const productId of new Set(lines.map((x) => x.productId))) {
    const detail = await tb3Printful<{
      sync_variants?: {
        id: number;
        variant_id: number;
        is_ignored?: boolean;
        availability_status?: string;
        files?: unknown[];
      }[];
    }>("/store/products/" + productId);
    for (const line of lines.filter((x) => x.productId === productId)) {
      const v = detail.sync_variants?.find((v) => v.id === line.variantId);
      if (
        !v ||
        v.variant_id !== line.catalogVariantId ||
        v.is_ignored ||
        ["discontinued", "out_of_stock", "temporary_out_of_stock"].includes(
          v.availability_status || "",
        ) ||
        !v.files?.length
      )
        throw Error("Catalog variant unavailable");
    }
  }
  const rates = await tb3Printful<
    { id: string; rate: string; currency: string }[]
  >("/shipping/rates", {
    method: "POST",
    body: JSON.stringify({
      recipient,
      currency: "USD",
      items: lines.map((x) => ({
        variant_id: x.catalogVariantId,
        quantity: x.quantity,
        value: (x.unitAmount / 100).toFixed(2),
      })),
    }),
  });
  const valid = rates
    .filter((x) => x.currency === "USD" && /^[A-Za-z0-9_-]{1,40}$/.test(x.id))
    .flatMap((x) => {
      try {
        return [{ ...x, cost: cents(x.rate) }];
      } catch {
        return [];
      }
    })
    .sort((a, b) => a.cost - b.cost);
  if (!valid.length) throw Error("Shipping quote unavailable");
  return { shipping: valid[0]!.cost, tax: 0, shippingMethod: valid[0]!.id };
}
export function getPayPalRuntime() {
  const config = paypalConfig();
  if (config?.mode === "sandbox") {
    if (!paypalDatabaseUrl()) return null;
    const request = paypalTransport(config);
    const service = paypalService(config, {
      ledger: paypalLedger,
      request,
      quote: async () => {
        throw Error("Sandbox must not request a provider quote");
      },
      printful: async () => {
        throw Error("Sandbox must not access Printful");
      },
      autoConfirm: false,
      fundingVerified: false,
      costCap: 0,
    });
    return {
      config,
      service,
      verify: (headers: Headers, event: unknown) =>
        verifyPayPalWebhook(headers, event, config, request),
    };
  }
  if (
    !config ||
    !(
      process.env.TB3_PAYPAL_DATABASE_URL ||
      process.env.EA_MERCHANT_DATABASE_URL
    ) ||
    !process.env.PRINTFUL_API_KEY?.trim() ||
    process.env.TB3_PRINTFUL_CATALOG_VERIFIED !== "true" ||
    process.env.TB3_PRINTFUL_FUNDING_VERIFIED !== "true" ||
    process.env.TB3_MERCH_DRAFT_FULFILLMENT_APPROVED !== "true" ||
    process.env.TB3_PAYPAL_TAX_POLICY_APPROVED !== "true" ||
    !process.env.TB3_PAYPAL_NO_TAX_STATES?.trim()
  )
    return null;
  const request = paypalTransport(config);
  const service = paypalService(config, {
    ledger: paypalLedger,
    request,
    quote: quotePayPalOrder,
    printful: tb3Printful,
    autoConfirm: process.env.TB3_PAYPAL_AUTO_FULFILLMENT_APPROVED === "true",
    fundingVerified: true,
    costCap: Number(process.env.TB3_MERCH_MAX_PRINTFUL_COST_CENTS),
    approval: () => ({
      autoConfirm: process.env.TB3_PAYPAL_AUTO_FULFILLMENT_APPROVED === "true",
      fundingVerified: process.env.TB3_PRINTFUL_FUNDING_VERIFIED === "true",
      costCap: Number(process.env.TB3_MERCH_MAX_PRINTFUL_COST_CENTS),
    }),
  });
  return {
    config,
    service,
    verify: (headers: Headers, event: unknown) =>
      verifyPayPalWebhook(headers, event, config, request),
  };
}

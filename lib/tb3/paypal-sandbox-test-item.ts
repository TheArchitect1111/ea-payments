import {
  TB3_PAYPAL_SANDBOX_PROJECT,
  TB3_PAYPAL_SANDBOX_TEST_BRANCH,
  TB3_PAYPAL_SANDBOX_TEST_VARIANT_ID,
} from "./paypal-sandbox-test-constants";
export { TB3_PAYPAL_SANDBOX_PROJECT, TB3_PAYPAL_SANDBOX_TEST_BRANCH, TB3_PAYPAL_SANDBOX_TEST_VARIANT_ID };

export function isTb3SandboxLedgerTarget(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    if (!(url.protocol === "postgres:" || url.protocol === "postgresql:") || url.searchParams.get("sslmode") === "disable") return false;
    const hostRef = url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)?.[1]?.toLowerCase() ?? "";
    const poolerHost = /^[a-z0-9-]+\.pooler\.supabase\.com$/i.test(url.hostname);
    if (!hostRef && !poolerHost) return false;
    const username = decodeURIComponent(url.username);
    const match = username.match(/^(ea_merchant_api|tb3_paypal_api)(?:\.([a-z0-9]+))?$/i);
    if (!match) return false;
    const userRef = (match[2] ?? "").toLowerCase();
    const projectRef = hostRef || userRef;
    return projectRef === TB3_PAYPAL_SANDBOX_PROJECT && (!hostRef || !userRef || hostRef === userRef);
  } catch {
    return false;
  }
}

export function isTb3SandboxTestCheckoutEnabled(input: {
  vercelEnv?: string;
  branch?: string;
  paypalEnv?: string;
  checkoutEnabled?: string;
  testItemEnabled?: string;
  databaseUrl?: string;
  printfulDraftApproved?: string;
  printfulAutoApproved?: string;
}): boolean {
  return input.vercelEnv === "preview" &&
    input.branch === TB3_PAYPAL_SANDBOX_TEST_BRANCH &&
    input.paypalEnv === "sandbox" &&
    input.checkoutEnabled === "true" &&
    input.testItemEnabled === "true" &&
    input.printfulDraftApproved !== "true" &&
    input.printfulAutoApproved !== "true" &&
    isTb3SandboxLedgerTarget(input.databaseUrl);
}

/** Accept only the fixed synthetic item; never map it to a Printful product or SKU. */
export function resolveTb3SandboxTestCart(input: unknown) {
  if (!Array.isArray(input) || input.length !== 1) {
    throw new Error("Only the fixed Sandbox certification item is available.");
  }
  const item = input[0] as { variantId?: unknown; quantity?: unknown; [key: string]: unknown };
  if (!item || typeof item !== "object" || Object.keys(item).length !== 2 ||
      item.variantId !== TB3_PAYPAL_SANDBOX_TEST_VARIANT_ID || item.quantity !== 1) {
    throw new Error("Only the fixed Sandbox certification item is available.");
  }
  return [{
    productId: 0,
    variantId: TB3_PAYPAL_SANDBOX_TEST_VARIANT_ID,
    catalogVariantId: 0,
    name: "TB3 Sandbox certification test item",
    size: "No fulfillment",
    image: "",
    quantity: 1,
    unitAmount: 1,
    currency: "usd" as const,
  }];
}

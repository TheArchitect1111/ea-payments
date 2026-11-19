import { requestTb3PayPalOAuthToken } from "./paypal-oauth-token";
import type { Tb3PayPalOAuthConfig } from "./paypal-oauth-config";

export function createTb3PayPalOAuthDiagnostic(deps: {
  environment: () => string | undefined;
  enabled: () => string | undefined;
  config: () => Tb3PayPalOAuthConfig | null;
  fetcher?: typeof fetch;
}) {
  return async () => {
    if (deps.environment() !== "production") return { status: "BLOCKED", httpStatus: 0, errorCategory: "ENVIRONMENT_NOT_ALLOWED" } as const;
    if (deps.enabled() !== "true") return { status: "BLOCKED", httpStatus: 0, errorCategory: "DIAGNOSTIC_DISABLED" } as const;
    const config = deps.config();
    if (!config) return { status: "BLOCKED", httpStatus: 0, errorCategory: "LIVE_CONFIGURATION_UNAVAILABLE" } as const;
    try {
      const response = await requestTb3PayPalOAuthToken(config, deps.fetcher);
      const httpStatus = response.status;
      await response.body?.cancel();
      if (response.ok) return { status: "PASS", httpStatus, errorCategory: "NONE" } as const;
      return { status: "FAIL", httpStatus, errorCategory: httpStatus === 401 ? "INVALID_CLIENT_CREDENTIALS" : "OAUTH_REJECTED" } as const;
    } catch {
      return { status: "FAIL", httpStatus: 0, errorCategory: "OAUTH_UNAVAILABLE" } as const;
    }
  };
}

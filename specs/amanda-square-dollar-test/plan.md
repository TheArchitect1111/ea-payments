# Implementation Plan
Constitution check: approved scope is an added test option. Preserve existing normal Square checkout and protected APIs. Sandbox-only server endpoint with explicit credentials and hostname validation. Never trust a browser payment success flag.
Architecture: keep the registry-backed normal CTA; add a test link to Wood Therapy only; own-name/email form invokes a dedicated Square Sandbox checkout endpoint. Save registration and order correlation before returning a checkout URL.
Sequence: implementation, targeted transport-mocked checks, build, source commit. Full payment fulfillment integration remains required before release.
Risk: Square Sandbox checkout UI differs from production; credentials/configuration may require owner setup. Return URL does not grant access.

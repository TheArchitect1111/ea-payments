# EA Modular Assembly — Run 5

Date: 2026-09-12

## Objective

Connect certified assembly to the commercial tenant-foundation path for the fully certified `Website + Portal Starter` package and persist durable per-tenant assembly evidence.

## Result

- Starter provisioning defaults to certified assembly unless an explicit mode override is supplied.
- Certified assembly preflight happens before organization or entitlement writes.
- Certified entitlement failures now fail closed instead of producing a false success.
- Successful certified provisioning records a durable assembly receipt through the existing Creative Studio persistence layer.
- Receipts contain portal slug, organization id, package, requested modules, admitted modules, certification run, timestamp, and a deterministic SHA-256 fingerprint.
- Existing packages that are not fully certified remain on legacy behavior unless certified mode is explicitly requested.

## Safety

No new vendor, account, subscription, or persistence service is introduced. Run 5 uses the existing EA durable persistence layer.

## Acceptance

Run 5 is accepted when its contract test passes in the Run 6 branch and in main CI, and Run 6 may then certify the next safe capability wave.

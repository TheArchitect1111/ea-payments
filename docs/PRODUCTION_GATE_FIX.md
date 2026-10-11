# Production gate 503 diagnosis and fix

## Reproduction
- Original source `97e9e3156644f1f7d3aaf1b300b2b49d9ef3ab99`; EA Production Gate [run 38133815296](https://github.com/TheArchitect1111/ea-payments/actions/runs/38133815296), initial and retry failed desktop/mobile console checks with HTTP 503.
- Network-instrumentation PR [#546](https://github.com/TheArchitect1111/ea-payments/pull/546) added `networkResponses` with URL, HTTP status, method and resource type, preserving every existing visual/console gate.
- Diagnostic [run 38134910322](https://github.com/TheArchitect1111/ea-payments/actions/runs/38134910322) reports **GET http://127.0.0.1:3000/api/public/amanda/media**, `resourceType: fetch`, **HTTP 503**, on desktop and mobile. Google Fonts stylesheet and Amanda .webp image returned 200.

## Root cause and scope
- `scripts/ea-preview-gate.mjs` falls back to an exact-commit `next start` at 127.0.0.1:3000 because the preview build identity cannot be verified with the available automation bypass environment. The local GitHub runner does not carry optional Amanda Airtable base/token config.
- The public media endpoint `app/api/public/amanda/media/route.ts` calls `listAmandaMediaAssets` which resolves the registry via Airtable; absent base or token causes `Amanda registry is unavailable`, caught as 503. The optional `AmandaMediaSection` already hides itself on an empty media list.
- This proves a configuration gap in the local verification context, **not** an Airtable outage in deployed production. Do not claim live Airtable/People/Postgres/provider certification from this gate.

## Fix
- When *both* an Airtable base and token are not configured, the optional public media endpoint now explicitly returns HTTP 200 with `{ok:true,media:[],available:false,reason:'not_configured'}`, `Cache-Control:no-store`, and a server warning. No external media data is fabricated. An unconfigured media panel remains hidden, as designed.
- If Airtable credentials **are** present, actual provider errors are still logged and return HTTP 503; the browser gate continues to fail on them. No console/response filters were added and no gate was bypassed.

## Release verification
- New behavior commit `612ccb1e3b093b42e234240eeaf7bc492dc57bb0` on `fix/amanda-optional-media-unconfigured-20261011`.
- Full post-fix tests, build, desktop/mobile browser verification, and exact-source manifest promotion **pending fresh gate evidence** at the time of this document's creation. The existing `.ea/gates/latest.json` remains certified to `ac6a628b` until the GitHub gate creates its own immutable manifest-only promotion commit. Do not hand-edit old PASS evidence.

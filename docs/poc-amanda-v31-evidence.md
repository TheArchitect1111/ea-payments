# V3.1 Identity Bridge - Evidence

Verified: 2026-05-13
Preview: https:[STRIPPED 65 bytes].vercel.app
Branch: poc/amanda-v31-identity-bridge

Gates:
1. test-session + secret -> 200 OK ✅ (commit 642d4279)
2. session + synthetic header -> 200
3. session no header -> 403

Secret: FRAPPE_BRIDGE_SECRET set in Vercel Preview+Production
Fix: Added app/api/ea/bridge/test-session/route.ts

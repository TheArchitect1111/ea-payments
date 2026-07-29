# ECE Certification Run Status

Date: 2026-07-29  
Base preserved: `501510201`  
Certification branch: `cert/ece-production-equivalent`  
Certification commits: `a944e82f7` → `c6da697c0`  
**Production deploy: not performed**

## Provider readiness (secure inspection — values never printed)

| Capability | Local workspace | Vercel Preview | Notes |
|---|---|---|---|
| Research (OpenAI web_search) | MISSING | MISSING | `OPENAI_API_KEY` not present in Preview env list |
| Creative (EA AI gateway) | MISSING | MISSING | Same key |
| Vision critic | Prefers OpenAI gateway | MISSING | Anthropic exists on **Production only**; critic no longer requires Anthropic |
| Openverse | Ready (public API) | Ready | No secret required |
| MediaPipe worker | MISSING (`ECE_FACE_FOCAL_ENABLED`) | MISSING | Optional until enabled |
| Durable artifact storage | N/A locally | Airtable keys present on Preview | |
| Playwright | Available in repo | Not run — no Ready auth path for automation yet | |

**Status: `BLOCKED_PROVIDER` for pack generation and certification.**

## Preview deployment

| Field | Value |
|---|---|
| Branch | `cert/ece-production-equivalent` |
| Commit | `c6da697c0e5d115ddc0b5a8072ec1f31483e4509` |
| Environment | Preview (not Production) |
| Status | Ready (GitHub deployment success) |
| URL | https://ea-payments-ojhy1zfkv-the-architects-projects-cc813778.vercel.app |
| Protection | Vercel Deployment Protection / SSO login wall observed |

CLI `vercel deploy` also hit a 250MB function size limit on one attempt; GitHub-linked Preview for `c6da697c0` reached Ready.

## Code change on cert branch (minimal)

- Provider-neutral vision critic: OpenAI gateway preferred, Anthropic optional fallback
- Acceptance page AdminLogin import fix (build unblocker)
- Readiness check script (SET/MISSING only)

## Three-subject run / 72 screenshots / human acceptance

**Not executed.** Blockers:

1. No vision/research/creative credentials on Preview (`OPENAI_API_KEY` absent from Vercel Preview).
2. No local `.env.local` in this workspace to run production-equivalent locally.
3. Preview URL behind Vercel authentication — cannot open acceptance page or generate projects without shared access.
4. Without real providers, any subject run would be `BLOCKED_PROVIDER` (correctly — not fake success).

## Final verdict

# NO-GO

Do not deploy Production. Do not report GO.

### Required before resuming certification (human / secure config only)

1. Add `OPENAI_API_KEY` to Vercel **Preview** (reuse Production value via dashboard if already used elsewhere — do not paste into chat).
2. Optionally set `AI_MODEL_VISION` on Preview to a vision-capable model.
3. Grant Preview access past Deployment Protection for the certification operator (or temporarily disable protection for this branch).
4. Confirm admin login works on the Preview host.
5. Re-run: generate three subjects → 18 previews → 72 screenshots → multimodal critic → human approval on `/admin/ea-factory/experience-acceptance`.

Only after all 18 previews pass human review may Production release proceed per the certification prompt.

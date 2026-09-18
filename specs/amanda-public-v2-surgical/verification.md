# Verification evidence, 2026-09-18

Baseline: approved/amanda-public-page-v2-2026-09-18 at 62a09f43e9cd581906006fe49658346244998dbb, verified before editing. Isolated branch: surgical/amanda-public-v2-2026-09-18.

UI commit: 522573e363e406486e384e0775f371995e3925f1. Preview deployment dpl_BR9xXtb3E64LjGHE3CgqryNBBz6F; target null (preview), ready.

Exact tested share link:
https://ea-payments-7g7ut528l-the-architects-projects-cc813778.vercel.app/amanda-catherine?_vercel_share=KOgY7SZvP0DwyGzpSdHkhHNTuJMYeqqW
Share expiry reported by hosting service: 2026-09-19 13:30:16 UTC.

## Passed
- Fresh tab on a new deployment host opened directly to Amanda public page without Vercel or portal login. Independent unauthenticated browser verified earlier isolated deployment.
- Final desktop document client width 1348; scroll width 1348. All five page images loaded. Kit artwork retains 1152 x 1536 natural dimensions and full 3:4 ratio, with no cover crop.
- Quote portrait and both TT National Training Tour image occurrences absent from rendered DOM/JSX; no empty media wrappers retained.
- Nav, hero, Jane, contact and footer JSX identical to approved baseline. Section order preserved. Portal paths, offer/payment configuration and Jane image have no diffs.
- Exact supplied biography appears once. Four distinct Create cards and exact keynote visible.
- Speaking submission on final preview returned: Preview checked successfully. No inquiry or email was sent.
- Clinical Mentorship CTA selected mentorship; safe application test on first isolated preview returned same dry-run status. Founder CTA selected advisory and updated the form heading on final preview.
- API tests: valid preview 200; invalid fields/honeypot 400; cross-origin 403; size limit 413; production-disabled sending 503; rate limit 429. No email sent.
- Unlisted kit page opens with original artwork, $499 CAD, robots noindex/nofollow, no checkout buttons and no main-page link to the unlisted route. Unlisted does not mean authenticated.
- Build succeeds locally and in Vercel. Changed-file eslint has zero errors and six warnings (image elements and retained portal link). TypeScript reports zero errors in changed public files; broader repository has existing errors and its build skips type validation.
- Product artwork byte identity SHA256: 03f388ecdc8da1bb7d6e86ac898f5cfeb43147dc98dc2af13da6f94f6f949d63, equal to standalone original upload.
- Partnership web PDF: all 10 pages and extracted text preserved; rendered page montage checked.

## Pending acceptance and integrations
- Rendered mobile browser check, because available tools do not expose viewport resizing. Responsive CSS review is not claimed as browser verification.
- Emails: confirmation, preparation, follow-up and interview-published drafts prepared with existing workflow stage IDs; live triggers, persistence, approved booking/publication events and actual delivery are not wired/tested.
- Checkout: disabled; fulfillment/tax/shipping/payment and secure order access require confirmation.
- Sources and other missing destinations: see pending-inputs.md. RIMAN supplied Canadian query loads Amanda storefront with US region. Do not claim Canadian storefront behavior verified.
- Continuous YouTube playback and course query preselection remain unverified/unchanged.

No production deployment or Portal V2 edits.

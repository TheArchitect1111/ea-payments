# Feature Specification: TB3 HQ v2.1
Request: Pasted text(20261005-220618).txt, 2026-10-05. Preview only, branch codex/tb3-hq-remake-20261005. Base remote commit 1452e0a.
## Intent and scope
Nine-item nav, nutrition framing, CTA-only asset lightbox, real user-entered activity calendar, module logs, opportunity holds, contextual Eva command/panel/mobile presence. Public booking integration follows approval and is excluded.
## Source of truth and resolved contradictions
16 listed assets, not 15. Existing approved filenames remain authoritative. Vault makes no image requests before View Asset; storytelling images necessarily load on HQ. Source screenshots named in prompt not supplied. No invented stats, dates, video thumbnails, city image or claims of Google/AI connectivity.
## Preview persistence
Existing calendar endpoint is authenticated GET-only. Do not weaken it. Review records saved to this browser, with explicit UI disclosure. Study/training/community logs feed shared preview state and Calendar; opportunity status Contracted creates a linked hold. Backend account/calendar/booking sync is Phase 2. Live AI requests may use existing guarded AI gateway; unsigned previews retain command actions and truthful unavailable state.
## Protected invariants
Public page, legal/auth/payments/security unchanged. Only TB3 HQ and scoped components/evidence changed. Do not publish production or official promotion.
## Acceptance criteria
Nine links ordered exactly; 16 lightweight vault placeholders, search/count filters, no vault img before click, native accessible lightbox with original image, download/copy/close/unload; nutrition full face/background at requested frame; 15 single-use storytelling images; real Calendar Month/Week/Day/add/edit/delete and next three Upcoming; forms update derived metrics; opportunity holds linked; context/quick actions and responsive 320px Eva panel, 56px mobile button in reserved area; no seeded data, no pictures in Calendar/data widgets; no content overlap; 1440/375 browser checks.
## Verification
Build, scoped type check, targeted lint, tenant safety; browser creation/save/reload/calendar views/command/filters/lightbox/image-loading tests and screenshots, source equivalence, deployed commit READY.
## Rollback
Preview only. Leave v2.0 and production unchanged; reject v2.1 if checks fail.

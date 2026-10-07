# Tarris Close-Case Gaps Checklist - 2026-10-07

[ ] Gap 1: Activate TB3 shared tracking in the approved preview. Apply/verify supabase/migrations/013_tb3_shared_tracking.sql and configure the TB3 preview database connection so POST /api/opportunities/create returns 201 instead of 503.

[ ] Gap 2: Establish an explicitly authorized active Tarris membership and run a true two-browser end-to-end test: public booking -> Inbound card -> Discussion -> Contracted/Completed -> earnings -> contract PDF -> calendar -> activity/impact sync -> shared reload.

[ ] Gap 3: Protect the HQ route at the application layer for Tarris + authorized admin only and make it non-indexable. Do not count Vercel Deployment Protection as the product auth gate.

[ ] Gap 4: Promote the audited TB3 branch to the TB3 production domain only after gates pass. www.tb3.online/hq currently serves the older 8-item fake-data HQ.

[ ] Gap 5: Remove all close-case placeholder/fake UI. Latest preview still renders "$0 Tracked"; production still renders 85/72/60/90 percentages, SEP 14/16/18/20 and Approved module placeholders.

[ ] Gap 6: Resolve the Media Library category acceptance mismatch. Current filters omit Training; acceptance requires TRAINING/ACADEMICS/BRAND/ATHLETE/COMMUNITY/FUTURE.

[ ] Gap 7: Finish release evidence: accepted full TypeScript gate or documented exception, rerun v2.1/v2.2 visual tests after DB activation, and create the final v2.2 release tag.

# Amanda workflow repair evidence

Status: source repairs prepared; production unchanged; certification blocked.

## Implemented
- Public proxy preserves enroll/apply/learning path instead of redirecting everything to owner (public repo draft PR #9).
- Selected course survives enrollment and checkout cancellation. Verified checkout navigates to Learning with enrolled/welcome query; login preserves this destination; the purchased course is selected within Learning.
- No new plaintext learner passwords. Email-code instructions, persisted welcome status and retries for new grants.
- Course grants and payment records require durable persistence on production/preview.
- Existing canonical People identity upsert connects payments/applications when People is enabled; existing directory roles and other portal identities are preserved. No global flags changed.
- Durable application acknowledgment and owner follow-up communication history. New follow-up and assessment review operations require active persisted Amanda staff membership.
- Academy shows payment, assignment, person link and progress; People view joins purchases/applications/progress; Business Insights counts course purchases and sales.
- Learner checkboxes no longer create a 100% score/certificate. Assessment evidence submission and staff review implement score/practical approval gates; existing issued certificates retained.
- Private resource signing supplies the SDK-required private access option.

## Passed locally
- Behavior: all four course/offer queries choose the intended radio/checkout offer; invalid queries fall back safely.
- Behavior: all four courses require assessment evidence, passing score and practical approval. Self-completion never awards certificates.
- Existing Amanda checkout, learning handoff, client delivery phase 1 and completion contracts pass. These are source contracts, not live funnel evidence.
- Scoped ESLint: no errors; existing image/effect warnings remain.
- Full TypeScript reports no diagnostics in changed files; the repository-wide check fails in untouched files/services/dependencies.
- Diff whitespace check passes.
- Public preview routing responds 307 to the intended EA enroll/apply/learning paths and preserves course/form/program parameters; the Body Sculpt route was directly verified on deployment dpl_HNW8X2fyBNb26Y4k7jAeqeN7nMW4.

## Blocked / not proven
- Existing tenant-safety source contract fails on the unchanged module resolver. Neither that test nor resolver was altered.
- Local full build fails in existing factory/admin client bundles. The Amanda learning client also imported server persistence through course-content; repaired by extracting the existing pure access helpers without changing access rules. Full build still requires a fresh preview check.
- No test Stripe transactions executed; no transaction IDs or live webhook/entitlement proof. Four non-admin checkout/login/lesson launches remain mandatory.
- Preview browser/mobile verification and actual owner membership/People/email service configuration remain unverified.
- Current catalog maps Reset/Body Sculpt resources but no BBL/Wood Therapy resources. Recordings/lesson content cannot be fabricated.
- Training courses currently inherit a weekly Monday release schedule. Recovered training sources describe one/two-day intensives. The release schedule has been left unchanged pending authoritative delivery rules.
- Assessment evidence review infrastructure is implemented, but Amanda's approved assessment questions/rubric, complete practical delivery instructions and kit/mentorship operational process still need authoritative content.
- Jane synchronization and unrelated owner destinations were not changed.

## Release requirement
Do not merge/deploy or mark READY based on these source checks. Complete preview and four-course non-admin payment-to-learning proof, resolve course delivery/content gaps and verify application/People/communication/reporting records first.

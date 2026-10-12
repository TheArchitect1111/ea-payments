# EA Cigar Industry CTP | Locked client journey and brand reference

**Status:** Client-journey scope locked for continuity; **visual artwork not approved yet**.  
**Project:** Efficiency Architects, Cigar Industry CTP (Consider the Possibilities)  
**Repository:** `TheArchitect1111/ea-payments`  
**Working branch:** `feature/cigar-ctp-guided-preview-20261012`  
**Preview route:** `/discover/cigar`  
**CTP landing reference:** `https://cc.efficiencyarchitects.online/ctp` (verify actual route before linking to a prospect)  
**Recorded:** 2026-10-12

## Customer-facing story: FIVE steps (approved sequence)

The client-facing workflow explainer is **five steps**, not a 10-box system diagram.

1. **Fill Out the CTP.** Owner selects **Brand Owner**, **Lounge/Retail Owner**, or **Distributor/Wholesaler**, and answers **16 guided questions** relevant to their role (seven shared, seven role-specific, two final). Briefly explain that answers help EA understand operational visibility, inventory, sales, communication, time lost, and priorities. Reports/documents are optional.
2. **Submit the Assessment.** Owner reviews answers, enters contact details and consent, and submits the completed CTP for evaluation.
3. **Receive the Personalized Email.** The intended production follow-up includes a **thank-you**, **personal greeting**, **assessment/evaluation**, and **link to schedule** a meeting. Do **not** claim this is currently delivered in preview.
4. **Schedule the Strategy Meeting.** Owner uses the calendar link to choose a convenient time and discuss assessment results with EA.
5. **Meet & Commit (or Decide Next Steps).** EA and owner discuss findings and proposed opportunities. The owner decides whether to commit to a subsequent engagement. A meeting is not an automatic agreement, guarantee of improvements, or activation of software.

**Plain-English customer promise:** “Tell us how your cigar business operates. We will identify what is working, where capacity may be lost, and practical opportunities worth discussing.”

### Assessment internals are NOT the explainer steps

The assessment engine contains **30 distinct questions**: `C01–C07` common (7), `B01–B07` brand (7), `L01–L07` lounge (7), `D01–D07` distributor (7), `F01–F02` final (2). Each of the three main role branches sees **16 questions**. Internal UI screens for intro, choice, shared questions, role path, final questions, optional upload, contact, review, submit, and post-submission are implementation details, not 10 client-facing steps.

## Official logo, mandatory

**Use the actual EA logo asset from this repository, not a generated approximation, monogram, lettermark, or text-only substitute.**

- Canonical artwork source: `public/images/ea-logo.png` (official gold/white EA symbol, the spelled-out EFFICIENCY ARCHITECTS, and official tagline on black).
- Also present as `public/ea-logo.png`; same recognizable identity with a different file size/composition.
- In customer-facing workflow explainer artwork, place the **unmodified official logo at the top** as explicitly requested. Keep it legible, avoid squashing/cropping; do not invent a new symbol.
- If image-generation tools cannot preserve logo pixels exactly, composite the original repository PNG **after** creating the explainer body. Logo is an imported protected asset, not AI-generated text.
- **Neither of the preceding workflow explainer images was approved**; the wrong/invented logo must not be reused.

## Customer-facing visual design, scope locked

- Infographic is for a **cigar business owner**, not a developer.
- One simple, readable five-part journey with arrows clearly connecting steps.
- One relevant illustrative scene per step: (1) owner completing business assessment; (2) submission confirmation; (3) personalized email containing thanks, greeting, evaluation and calendar link; (4) actual-looking appointment selection; (5) welcoming strategy meeting and voluntary go/no-go decision.
- Warm, premium, emotionally connected hospitality photography; adult subjects only, with authentic diverse representation and clear faces. No repetitive product catalog visuals. Small, highly readable step copy and a concise outcomes line.
- The visual must explain **what happens and what the client gains**, not portray source-file paths, branching code, internal QA, or scoring internals.
- Ensure the logo is the actual approved asset before presenting the next image for review.

## Protected implementation / not authorized for change

Keep unchanged: approved questions/answers, three branches, scoring and recommendations, report generation, report upload and evaluation, email integration, form submission, navigation and scroll, removed filler, and responsive behavior. Do not modify unrelated EA projects.

**PREVIEW ONLY is in force.** The preview route is protected and **does not send real email to prospects**. Do not enable production submissions, report emails, or claim that step 3 is active without separate authorization and production validation. Explain a full production client journey as a **planned/intended** workflow until activation is proven.

## Current locked image-repair baseline

The most recently verified image repair on the feature branch was commit `bc6844880da2c02904826602e120cfde98056b15`. Its image registry has 35 distinct source paths for 30 questions + intro + four stages; QA verified 35 image loads, desktop/mobile framing at 1440×900 and 390×844, and preserved branching. That technical verification is **not approval** of any client-facing explainer artwork.

## Approval / release boundaries

- **Locked:** the five-step narrative, correct EA logo file reference, illustration approach, 16-question per-path fact, preservation requirements and Preview Only gate.
- **Not locked or approved:** final infographic composition, image file, publication/send, production submission/email delivery or any sales promise dependent on those features.
- The workflow diagram may be treated as final **only after the actual EA logo appears** and the client-facing explanation is reviewed as readable and accurate.

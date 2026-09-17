# Amanda Recovery Evidence Gate

Status: recovery only. Production is not authorized by this document.

## Rule
Amanda is not client-ready because a deployment succeeds or because a human/agent says it looks good. Client-ready requires captured evidence from the rendered experience.

## Required surfaces
1. Public site, desktop.
2. Public site, 390px mobile.
3. Course enrollment using `non-surgical-tummy-tuck-training` as the canonical probe.
4. Owner portal route.
5. Learning route or its authentication handoff while preserving the Amanda learning destination.

## Evidence
Every run captures full-page PNG evidence. Failed runs retain Playwright traces and video. The CI job uploads the evidence bundle as a GitHub Actions artifact.

## Current limitation
These tests prove rendering, routing, basic Amanda branding, mobile overflow, and destination continuity. They do NOT yet prove authenticated owner/student behavior, Stripe payment completion, entitlement creation, module playback/progress, or pixel-level agreement with Amanda's approved reference imagery. Those remain UNVERIFIED until explicit tests/reference images are added.

## Release rule
No Amanda recovery candidate may be represented as client-ready while any required surface is failing or unverified.

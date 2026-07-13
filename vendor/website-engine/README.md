# @ea/website-engine

Unified Website Engine foundation for Efficiency Architects.

## Problem

Two website systems exist today:

1. **landing-chassis** ? config-driven CPR/SisterHub landing pages
2. **experience-builder** ? Puck block composer in ea-payments

## Solution (v0.1)

A shared **section registry** with canonical kinds (hero, testimonials, faq, cta, forms, footer, ...).

- Landing chassis keys map to kinds
- Experience builder blocks map to kinds
- Pages assemble from enabled section instances (no hard-coded client page trees)

## Usage

```ts
import {
  createDefaultWebsiteRegistry,
  assembleWebsitePage,
  landingChassisPageTemplate,
  adaptExperienceBlocks,
} from '@ea/website-engine';

const registry = createDefaultWebsiteRegistry();
const page = landingChassisPageTemplate({
  id: 'cpr-home',
  name: 'CPR Home',
  organizationId: 'cpr',
  themeId: 'cpr-theme',
});
const assembled = assembleWebsitePage(page, registry);
```

## Non-goals (this slice)

- Does not migrate CPR landing pages
- Does not replace Puck runtime
- Does not redesign marketing UI

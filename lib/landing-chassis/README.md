# EA Landing Page Chassis™

**Build once. Deploy everywhere.**

Configurable 9-section story framework for EA client landing pages. CPR is the reference implementation.

## Sections (fixed order)

1. **Possibility** — Hero: lead with the dream
2. **Social Proof** — Up to 3 testimonials
3. **Philosophy** *(optional)* — Quote + principles band
4. **Challenge** — Emotional problem framing
5. **Difference** — Four solution cards
6. **Process** — How it works timeline
7. **Portal** — Product differentiator + dashboard
8. **Results** — Stats + proof images + profile CTA
9. **Founder** — Short trust story
10. **Final CTA** — Apply / agreement / schedule
11. **Footer**

Content that does not advance the story (camps, merch, tributes, deep profiles) belongs on **secondary pages**.

## Usage

```typescript
import { LandingPage } from '@/lib/landing-chassis/LandingPage';
import { landingConfig } from '@/config/landing';
import '@/lib/landing-chassis/landing-chassis.css';

export default function Home() {
  return <LandingPage config={landingConfig} />;
}
```

## New client checklist

1. Copy `landing-chassis/` into the client repo (`lib/landing-chassis/`)
2. Create `config/landing.ts` with client copy, colors, images, links
3. Wire `app/page.tsx` to `<LandingPage config={...} />`
4. Add secondary pages for modules not on homepage
5. Override CSS variables in `:root` for brand colors

## CPR reference

- Config: `cpr-site/config/landing.ts`
- Off-homepage: `/camps`, `/merchandise`, `/tribute`

# Amanda Catherine V3 | Upgrade 2 + 3 photo audit

Date: 2026-10-17. Preview-only branch: `premium/amanda-upgrade`.

## Scope and evidence
Source-level audit of the approved local photo references used by `app/amanda-catherine/page.tsx` and `ClientRequestedUpdates.tsx`. The earlier automated Playwright run captured 20 before/after baseline images. The current hero follow-up capture is tracked by GitHub Actions. No claim is made that full-resolution photo pixels have been manually inspected; this environment cannot download repository binary photos for pixel-by-pixel correction.

| Approved photo | Page context | Action |
| --- | --- | --- |
| `amanda-black-blouse.jpg` | Homepage hero | Kept approved asset; desktop crop 59% 34%, mobile crop 62% center; reduced saturation and adjusted tonal contrast/overlay to protect headline legibility |
| `amanda-catherine-faith.webp` | About | Kept; consistent portrait aspect ratio 4:5 on desktop and 4:4.7 on small displays, subject bias 34%/30% vertical |
| `studio-interior.jpg` | Restore | Kept; general section image crop and fluid responsive sizing |
| `studio-treatment.jpg` | Learn | Kept; general section image crop and fluid responsive sizing |
| `amanda-catherine-entrepreneurial-artist.webp` | Create | Kept; general section image crop and fluid responsive sizing |
| `amanda-catherine-impact.webp` | Impact | Kept; general section image crop and fluid responsive sizing |
| `jane-payments.webp` | Scheduling/education panel | Kept; wide 5:4 aspect ratio in Jane card, center crop |
| `amanda-podium.jpg` | Speaking / client updates | Kept; common section responsive image constraints only when present within .ac-site .ac-section |
| `studio-exterior.jpeg` | Reviews / studio | Kept; common section responsive image constraints only when present within .ac-site .ac-section |

Image sets loaded dynamically from `/api/public/amanda/media` are data-driven, so their exact current URLs require a runtime response. Their cards inherit image containment rules; no media data was changed.

## Hero
Original approved headline and CTA labels were retained without text changes. Primary CTA styling becomes a more legible warm-paper button, whitespace and letter spacing are tuned, and the second CTA remains available. Navigation, hero markup, routes, CTA targets and class grid logic were not changed.

## Image handling
No stock photos added. No new photography, AI-generated portraits, or original asset replacements. Changes are CSS-only and reversible. No claimed asset sharpening: filters adjust display contrast and tonal balance but cannot restore native image detail.

## Acceptance
- Preview BUILD/READY and HTTP route verification are recorded separately.
- Desktop/mobile hero and section screenshots produced by `scripts/amanda-premium-screenshots.mjs` under `docs/baseline-screenshots/`.
- Screenshot evidence does not by itself confirm visual quality; manual inspection remains necessary before final approval.

# EA Immersive

Status: reusable template family

EA Immersive is a clean-room EA presentation system inspired by premium fintech editorial patterns. It copies no third-party code, branding, copy, or proprietary assets.

## Design grammar

- Oversized editorial typography
- Dominant full-bleed media
- Short copy blocks and deliberate negative space
- Rounded modular surfaces
- Alternating quiet and high-intensity sections
- Product/interface artifacts treated as focal objects
- Restrained depth and hover motion
- Strong mobile stacking
- One decisive final conversion action

## Canonical section manifest

1. immersive.hero
2. immersive.editorialFeature
3. immersive.productStage
4. immersive.cinematicMedia
5. immersive.benefitPair
6. immersive.trustStory
7. immersive.proofStatement
8. immersive.conversionFinale

## Architecture

Theme: vendor/theme-engine/src/themes/ea-immersive
Manifest: vendor/website-engine/src/immersive.ts
Assembler: assembleImmersiveTemplate in lib/platform/website-bridge.ts
Preview overlay: app/components/experience/themes/ea-immersive/ea-immersive.css

The manifest uses the existing Website Engine and the visual overlay uses existing Experience Builder/Puck components. No second renderer is introduced.

## Factory usage

Call assembleImmersiveTemplate({ id, name, organizationId }). The page manifest defaults to themeId ea-immersive.

Content, brand colors, imagery, CTAs, and organization data remain tenant/config driven.

## Guardrails

- No copied third-party code or assets
- No third-party brand names in generated client output
- Preserve Experience Director publish gate
- Honor prefers-reduced-motion
- Mobile layout must remain usable at 375px

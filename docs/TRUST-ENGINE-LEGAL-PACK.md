# Trust Engine — Legal Document Pack

Legal documents are **platform assets**, versioned like MSA/SOW, inherited by every EA product via configuration.

## Canonical sources

| Document | File | Public route |
|----------|------|--------------|
| Privacy Policy | `docs/legal/privacy-v1.0.md` | `/legal/privacy` |
| Terms of Service | `docs/legal/terms-v1.0.md` | `/legal/terms` |
| Mobile EULA | `docs/legal/eula-v1.0.md` | `/legal/eula` |
| AI Disclosure | `docs/legal/ai-disclosure-v1.0.md` | `/legal/ai-disclosure` |
| Support Policy | `docs/legal/support-policy-v1.0.md` | `/legal/support` |
| Cookie Policy | `docs/legal/cookie-policy-v1.0.md` | `/legal/cookies` |
| Master Services Agreement | `docs/legal/msa-v1.0.md` | `/legal/msa` |
| Statement of Work | `docs/legal/sow-template-v1.0.md` | `/legal/sow` |

Legacy `/privacy` and `/terms` redirect to the Legal Pack routes.

## Registry

- Types: `lib/trust-engine/types.ts`
- Pack + product mapping: `lib/trust-engine/legal-pack.ts`
- Acceptance helpers: `lib/trust-engine/acceptance.ts`
- Google Play Data Safety: `lib/trust-engine/google-play-data-safety.ts`
- Barrel: `lib/trust-engine/index.ts`

Each document record includes: `docType`, `version`, `effectiveDate`, `lastUpdated`, `status`, `applicableProducts`.

## Product → required documents

| Product | Required |
|---------|----------|
| Simplifi | Privacy, Terms, EULA, AI Disclosure, Support |
| Amplifi | Privacy, Terms, AI Disclosure, Support |
| Magnifi | Privacy, Terms, AI Disclosure, Support |
| Fortifi / Unifi | Privacy, Terms, AI Disclosure, Support, MSA |
| Pulse | Privacy, Terms, AI Disclosure, Support |
| Portal Products / Executive Portals | Privacy, Terms, MSA, SOW, Support |
| EA Platform | Privacy, Terms, AI Disclosure, Support |

Cookie Policy is optional for all packs. MSA/SOW use eSign (`requiresEsign`) and are excluded from checkbox onboarding.

## App integration

- UI: `app/components/LegalAcceptance.tsx`
- Simplifi register gate: `app/simplifi/register/SimplifiLegalGate.tsx`
- Persist shape: `serializeLegalAcceptance()` → version + timestamp + userId per doc

## Google Play

- Public privacy URL: `SIMPLIFI_PRIVACY_POLICY_URL` → `https://efficiencyarchitects.online/legal/privacy`
- Metadata object: `SIMPLIFI_GOOGLE_PLAY_DATA_SAFETY`

## Adding a future product

1. Add id to `TrustProductId` in `types.ts`
2. Add one entry to `PRODUCT_LEGAL_PACKS` listing required/optional doc types
3. Mount `<LegalAcceptance productId="…" />` on that product’s onboarding

Do **not** fork Markdown per product.

## Manual before production

1. Counsel review of all `docs/legal/*-v1.0.md` copy
2. Confirm production deploy serves `/legal/privacy` (Play Console)
3. Paste Play Data Safety from `SIMPLIFI_GOOGLE_PLAY_DATA_SAFETY`
4. Persist acceptance JSON to Airtable Client Records (field TBD) from register/API — sessionStorage is interim for Simplifi register only
5. Align Play Console Data Safety form with `SIMPLIFI_GOOGLE_PLAY_DATA_SAFETY`

## Trust Center (next layer)

See `docs/TRUST-CENTER.md` for governance dashboards, audit trail, version publish APIs, and `/trust`.

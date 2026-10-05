# OFFICIAL GOLDEN MASTER — 2025-10-04

## Public Page Official

URL: https://ea-payments-nakw5qxeg-the-architects-projects-cc813778.vercel.app/tarris?_vercel_share=hWNxnmYO3XKaLGshw2ppq4ADLRSMrwdV
Saved: v1.0_golden_master_2025_10_04
Status: LOCKED — No drift allowed without explicit version bump to v1.1
Features: Single-use official image map, corrected off-center image positions, mock TB3 merch products without Tarris portraits.

## Portal Official

URL: https://ea-payments-nakw5qxeg-the-architects-projects-cc813778.vercel.app/tarris/future?_vercel_share=hWNxnmYO3XKaLGshw2ppq4ADLRSMrwdV
Saved: v1.0_golden_master_2025_10_04
Status: LOCKED — No drift allowed without explicit version bump to v1.1
Features: Single-use narrative image placements, full tunnel name/number, full podium framing, bench shoes visible, premium Media Library vault, Earnings/Contracts data UI without photos, fake percentages and dates removed.

## Anti-Drift Lock

- Any future Work prompt must reference this golden master and verify no regression.
- Changes to image count, object-position, or status/calendar copy require an explicit version bump and changelog.
- Next version must be v1.1 with an explicit changelog.

## Capture and Versioning Status

- Page source and asset manifest are being preserved in this folder in the repository.
- Four requested PNG screenshots (1440px desktop and 375px mobile for both routes) are **not captured/saved yet**. The connected browser can show the previews, but its screenshot interface does not export image files into the repository or let this session set those viewport dimensions. No placeholder files are presented as screenshots.
- The two supplied routes resolve to the same Vercel Preview deployment (one deployment serving both /tarris and /tarris/future). It remains a Preview and has not been promoted to Production.
- The temporary `_vercel_share` links may expire; the deployment URL is stable while that Vercel deployment is retained.
- Git tag `v1.0-golden-master` is pending because the connected GitHub tools support branch updates but do not expose creating/pushing Git tags. The current preview commit is `ee4cc860075212078d98f52c941f1c5a6511f059`.

## Snapshot Contents

- `v1.0_golden_master_2025_10_04/app/tarris/page.tsx`
- `v1.0_golden_master_2025_10_04/app/tarris/future/page.tsx`
- `v1.0_golden_master_2025_10_04/ASSET_MANIFEST.txt`

The page-specific UI helpers are defined in the two files above; no other shared component files are imported by those pages.

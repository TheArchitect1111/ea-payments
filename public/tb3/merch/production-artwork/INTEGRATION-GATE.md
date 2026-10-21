# TB3 Fourthwall launch certification

## Established
- 14-product merch manifest: `public/tb3/merch/manifest.json`.
- Public and HQ page share the same component: `app/tarris/components/Tb3SharedMerch.tsx`.
- Purchase CTA appears only if a verified `fourthwall_product_url` property exists for that manifest item.
- Fourthwall store: `https://tarris-bouie-shop.fourthwall.com`.
- Claude Fourthwall connector connected by owner; prior 15 listings archived. Nothing publicly purchasable confirmed.

## Blocking launch requirements (not certified)
1. Genuine print-ready designs for both normal logo and signature collage; actual original photos and autograph only. Source garment JPG mockups are not printing artwork. Never substitute generated likenesses or falsely claim upscaled 150x150 source has native print detail.
2. Upload approved PNG artwork into Fourthwall media library via the Fourthwall/Claude artwork-upload widget; verify previews and source dimensions.
3. Create 14 new print-on-demand offers with correct blanks, colors, sizes, prices and per-offer permalink. Confirm actual offers published and purchasable.
4. Populate the per-offer `fourthwall_product_url` values in the manifest only after validated publications. Do not infer from store home URL.
5. Replace legacy Bonfire order CSV flow with a properly authenticated Fourthwall event ingestion or read-only orders API integration. Deduplicate by order ID, protect customer PII, reconcile refunds/cancellations, verify payouts separately from gross. Do not claim sales or payouts without source data.
6. Confirm end-to-end checkout in a permitted test transaction, delivery status event, and portal data consistency. Run responsive/browser checks and tests before any promotion.

## Separation and safety
This work exists on `assets/tb3-print-ready-20261021`, not master. Do not merge or deploy prior to code review, build, and acceptance checks. Amanda and unrelated projects have not been edited.

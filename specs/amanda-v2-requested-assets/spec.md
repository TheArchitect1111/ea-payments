# Amanda V2 requested assets and enrollment preview repair

Scope: Robert's eight-item September 18 request, preview only.

Baseline: deployed preview dpl_H5DP5gULLwJcE4RfN8qwwM4axyQ7 at d0d5fb359be63e4ac1638406f1fa4d2e080e17ac. Its source tree matches local c45090e. The approved snapshot 62a09f43e9cd581906006fe49658346244998dbb remains unchanged.

Acceptance: supplied black-blouse hero; podium photo and supplied talk titles in Speaking; explicit LIFELINE interview booking email action; both rendered BODY SCULPT tour posters replaced by supplied studio interior/treatment photography; supplied product image in RIMAN; existing supplied book cover beside enrollment description and Amazon purchase button; supplied exterior beside Google reviews; enrollment diagnosis and checkout testing in preview.

Protected: all other page copy, navigation, section order, styles and media, Jane artwork, course prices, financing JSX/location, frozen owner Portal V2, payment fulfillment, authentication and production. Book placement changes only the enrollment resource block. No real payment or email during QA. The interview action is an email booking request, not a confirmed scheduled interview.

Sources: 1000048234.jpg (portrait), 1000048237.jpg (podium), 1000048257.jpg (interior); treatment extracted exactly from 1000048260.jpg (289,161,532,598); RIMAN product panel extracted exactly from 1000048214.jpg (285,1011,536,1357). These two source photographs are available as screenshot panels, with no invented detail or generated replacement. Exterior is the original /Amanda/AesthetiKine_Studio_Exterior.jpeg matching the supplied screenshot. Book is the existing approved amanda-catherine-entrepreneurial-artist.webp. Talks: 1000048144.jpg and previously supplied Amanda_Catherine_EPK_FullBleed_NoLastPage.pdf page 7. Promotional graphics inform existing sections; no new promotional sections or unsupported claims.

Payment finding: current preview checkout returns 503 because STRIPE_SECRET_KEY is missing. Return URLs also use canonicalPlatformOrigin (EA production); preview branch now returns to its own request origin. Missing credentials must remain a real blocker, never disguised by a fake checkout. Auto-review rejected opening environment settings because secrets might be exposed; use non-secret diagnostics and complete unaffected work.

Verification: changed-file lint; existing checkout and learning-handoff checks; mocked route behavior including missing credentials and Stripe parameters; Vercel preview build; rendered page/image, booking action and enrollment resource inspection; compare protected JSX and owner Portal V2 against baseline. Real Stripe checkout requires an authorized preview credential and cannot be claimed verified without it.

Rollback: discard this isolated branch and preview deployment. Never promote or change production aliases/settings. Continue corrective work if rendered scope, images or invariants fail.

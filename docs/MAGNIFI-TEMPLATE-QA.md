# Magnifi Template QA

Magnifi has ten template families. This checklist verifies that each template renders, points to the right CTA, and produces an acceptable story.

## Template Inventory

| Template | Ideal Audience | Paired Simplifi Assessment | CTA Review |
|---|---|---|---|
| Executive Transformation | Executives, managers, corporate leaders | Operational Friction | `/assessment` |
| Entrepreneur Launch | Small business owners, consultants | Business Visibility | `/simplifi` |
| Hidden Asset Discovery | Professionals with underpackaged expertise | Capacity Recovery | `/assessment` |
| Community Blueprint | Associations, nonprofits, chapters | Community Health | `/simplifi` |
| University Ecosystem | Universities, alumni, advancement | Membership Growth | `/assessment` |
| Legacy and Scale | Multi-location, franchise, scaled orgs | Training Effectiveness | Review before launch |
| Media Empire | Creators, coaches, media brands | Social Media Effectiveness | Review before launch |
| Financial Transformation | Finance, advisory, control systems | Customer Experience | Review before launch |
| Athlete Development | Athletes, recruiting, sports programs | Communication Effectiveness | Review before launch |
| Faith Community Impact | Churches, ministries, faith orgs | Community Health | Review before launch |

## Per-Template QA Checklist

For each template:

- Capture or seed one representative example.
- Open `/magnifi/{captureId}`.
- Open `/magnifi/{captureId}?classic=1`.
- Open `/consider/{slug}` if a slug exists.
- Confirm hero headline is meaningful.
- Confirm Hidden Opportunity section is not generic.
- Confirm Future-State Reveal fits the audience.
- Confirm Possibility Engine includes useful paths forward.
- Confirm Mission Control copy is relevant.
- Confirm Top Three Priorities are specific.
- Confirm CTA route is correct.
- Confirm Simplifi Guidance link opens.
- Confirm colors/theme feel premium and readable.
- Confirm mobile rendering does not overlap text.

## Stakeholder Handoff SOP

| Scenario | Send | Message |
|---|---|---|
| Prospect needs to understand opportunity | Consider link | "Here is the story version of what we noticed." |
| Client needs internal buy-in | Magnifi link | "Use this to align stakeholders around the future state." |
| Operator needs action steps | Simplifi Guidance | "Here are the priorities and first move." |
| Someone wants a printable report | Classic report | "Use this version for review or notes." |

## Broken-Link Handling Audit

Current expected behavior:

- Missing capture ID returns 404 on `/magnifi/{id}`.
- Missing Consider slug returns 404 on `/consider/{slug}`.
- Archived or deleted records may no longer resolve.

Recommended launch behavior:

- Public links should eventually show a friendly unavailable page instead of raw 404.
- Admin should have a way to see whether the record is missing, archived, or access-restricted.
- Client support should use the Missing Magnifi Link SOP in `docs/PRODUCT-SUPPORT-AND-TRIAGE-SOP.md`.

## Demo Acceptance Criteria

A demo story is launch-worthy when:

- The subject is easy to explain in one sentence.
- The visual story makes the opportunity feel real.
- The CTA is safe and relevant.
- No private client details are exposed.
- It demonstrates a repeatable product category.

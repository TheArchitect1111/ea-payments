# Portal Options Codex Prompt

Before implementing portal modules, follow the EA Skin™ and Chassis Constitution™ in [`docs/EA-SKIN-AND-CHASSIS-CONSTITUTION.md`](EA-SKIN-AND-CHASSIS-CONSTITUTION.md).

## Opportunities & Resources™

### Objective

Add a reusable EA Portal Chassis™ module called **Opportunities & Resources™** that can be enabled or disabled on any portal deployment.

This is not an advertising module. It is a curated marketplace, sponsor, partner, resource, and opportunity management system that allows portal owners to provide value to their audience while optionally creating recurring revenue.

The module must feel premium and aligned with the EA platform philosophy: helpful, calm, curated, useful, and trust-building.

### Module Name

Primary name: **Opportunities & Resources™**

Portal owner selectable labels:

- Opportunities
- Resources
- Marketplace
- Recommended Partners
- Community Marketplace
- Trusted Resources
- Community Partners
- Member Benefits

### Portal Builder Integration

Add **Opportunities & Resources™** as a selectable module during portal creation.

Portal module options:

- Update Hub™
- Learning Hub™
- Event Hub™
- Community Directory™
- Opportunities & Resources™
- Job Board™
- Sponsor Center™
- Marketplace™

The module must be optional and deployable to any portal type.

Use module id: `opportunities-resources`.

### Admin Features

Portal owners must be able to create and manage listings.

Listing types:

- Sponsor
- Community Partner
- Resource
- Event
- Service
- Opportunity
- Job Posting
- Scholarship
- Training Program
- Discount / Offer
- Affiliate Resource

Listing fields:

- Title
- Description
- Category
- Logo/Image
- CTA Text
- External Link
- Internal Link
- Contact Information
- Featured Flag
- Active/Inactive
- Start Date
- End Date
- Sort Order

Categories must be custom per portal.

Example categories:

- Training
- Education
- Business Services
- Technology
- Events
- Recruiting
- Community Resources
- Health & Wellness
- Financial Services
- Volunteer Opportunities
- Career Opportunities

### Portal User Experience

The module should never look like advertising.

Use premium card-based layouts with labels such as:

- Featured Opportunity
- Recommended Resource
- Community Partner
- Upcoming Event
- Exclusive Offer
- Member Benefit
- Trusted Service Provider

### Display Options

Portal owners can enable any combination of:

- Dashboard widget: featured opportunity card
- Dedicated page: Opportunities & Resources page
- Sidebar widget: featured partner
- Footer section: community partners
- Rotating featured listings: optional carousel

### Search And Filtering

Portal users must be able to:

- Search listings
- Filter by category
- Filter by type
- View featured items
- Sort by newest
- Sort by most popular

### Analytics

Admin dashboard should track:

- Listing views
- Listing clicks
- Conversion clicks
- Top performing listings
- Active listings
- Expired listings

Create visual analytics cards.

### Optional Revenue Features

Portal owners may enable:

- Sponsorship listings
- Paid featured listings
- Affiliate links
- Sponsored announcements
- Partner directory
- Member discounts

Track:

- Referral clicks
- Affiliate URLs
- Sponsor performance

### Sponsored Announcements

Integrate with Update Hub™.

Organizations may publish:

- Featured opportunities
- Sponsor announcements
- Partner promotions
- Event promotions

These should appear as curated announcements rather than ads.

### Design Requirements

Follow EA design standards:

- Premium
- Light theme
- Apple-inspired simplicity
- Clean cards
- Large imagery
- Minimal clutter
- Mobile-first
- Consistent with Pulse™ and Update Hub™

Avoid:

- Banner ads
- Popups
- Flashing promotions
- Traditional advertising layouts

The module should feel like a valuable resource center, not an ad platform.

### Future Expansion

Design schema so the module can later support:

- Organization-wide sponsor networks
- EA Sponsorship Network™
- Shared opportunity marketplace
- Local business directories
- Community recommendation engines
- AI-powered opportunity recommendations

### Implementation Notes

Build this as a reusable chassis module that can be enabled on any current or future EA portal deployment.

Recommended first implementation path:

1. Add `opportunities-resources` to tenant module option types.
2. Add a shared listing schema and Airtable adapter.
3. Add admin CRUD for listings.
4. Add portal dashboard widget and dedicated page.
5. Add view/click analytics events.
6. Add optional Update Hub announcement publishing.
7. Add revenue fields without requiring payments on day one.

Use existing repository references before building from scratch:

- `ea-payments`: Partner Marketplace, Update Hub, Pulse events, admin dashboard patterns.
- `cpr-site`: resource library, events, ticket/messaging patterns, portal hub cards.
- `BrotherHub`: opportunities page and community update patterns.
- `SisterHub`: events/member portal layout and community admin patterns.

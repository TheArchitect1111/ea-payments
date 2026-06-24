# Connect Product Readiness Review

Date: June 24, 2026

## Scores

Product Readiness Score: 59 / 100

Launch Readiness Score: 60 / 100

Connect is now a functioning platform foundation with capture, relationship records, QR generation, campaigns, resources, automation rules, nurture sequences, opportunity scoring, forgotten-opportunity detection, and executive visibility. It is not yet a fully launch-ready commercial SaaS because persistence, delivery verification, and self-serve client configuration still need production service wiring.

## Current State

- Public capture: `/connect/[org]`
- Admin command center: `/admin/connect`
- Relationship API: `/api/connect/relationships`
- Engagement API: `/api/connect/events`
- Voice note API: `/api/connect/voice`
- QR SVG API: `/api/connect/qr`
- Multi-tenant seed configs: CPR and demo
- Airtable write hook for relationships when Connect table env vars exist

## Priority Gaps

1. Durable database architecture: Connect needs real tables for organizations, resources, campaigns, journeys, automation rules, engagement events, tasks, and alerts.
2. Email/SMS delivery: Resend, Twilio, and n8n actions are modeled but not yet verified end to end.
3. Self-serve admin persistence: Admin can review and launch from configured data, but create/edit flows still need durable CRUD.
4. AI memory: Rule-based opportunity intelligence exists; OpenAI-generated living relationship profiles should update after every interaction.
5. Real-world test matrix: 20 scans, 20 captures, 20 emails, 20 SMS, 20 redirects, and 20 AI evaluations have not been completed.

## UX Review

Parent: Strongest fit. Offer must be explicit within three seconds, such as “Get the Parent Recruiting Guide.”

Athlete: Needs athlete-specific copy and a lighter path that does not feel parent/admin heavy.

Coach: Needs team and roster-oriented routing, plus batch follow-up for multiple athletes.

Donor: Needs trust, impact proof, and donation/resource pathways.

Volunteer: Needs role clarity, training resource delivery, and next-shift reminders.

Sponsor: Needs partnership package delivery and staff routing.

Business Prospect: Needs consultation/resource path and clearer ROI framing.

## Recommended Build Order

1. Airtable schema setup and migration for every Connect object.
2. Resend/Twilio/n8n delivery verification with logging.
3. Admin CRUD for organizations, templates, resources, campaigns, journeys, and automation rules.
4. OpenAI relationship memory and recommendation updates.
5. Staff task board for follow-up completion.
6. QR export packs for events and teams.
7. Full production test run and failure report.

## Quick Wins

- Add CPR-specific QR links for every event and representative.
- Add one high-value offer per audience.
- Add consent language and delivery confirmation after capture.
- Add “call today” alerts to Master Control.
- Add QR SVG downloads to event prep workflow.

## Highest ROI Enhancements

- Forgotten Opportunity alerts.
- Staff-specific QR performance.
- AI-generated next action after every resource open.
- Nurture sequence builder.
- Airtable-backed resource library with upload support.

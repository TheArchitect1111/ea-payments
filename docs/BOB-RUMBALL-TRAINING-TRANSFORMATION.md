# Bob Rumball Training Transformation

## Objective

Build the flagship EA Training Transformation deployment by treating Bob Rumball's training ecosystem as an Organizational Knowledge Transformation initiative, not an LMS migration or course conversion project.

The first production action is discovery. No courses, learning modules, or AI answers should be built until the organization, departments, workflows, accessibility needs, and existing knowledge sources are understood.

## Operating Principle

Every decision must preserve long-term reuse for EA clients across nonprofits, healthcare, schools, municipalities, churches, sports organizations, associations, and businesses.

Build reusable platform capability only after the discovery model proves what the organization actually needs.

## Phase 1 Course Of Action

1. Launch discovery intake
   - Use `/connect/bob-rumball-discovery` as the stakeholder entry point.
   - Capture stakeholder name, email, role, department/company, location, referral/campaign, reason for connecting, timing, preferred follow-up, and notes.
   - Route responses into the existing Connect pipeline so classification, follow-up, and admin visibility are reused.

2. Run organizational discovery
   - Meet with leadership.
   - Meet with each department.
   - Document responsibilities, workflows, current onboarding, existing training, frustrations, compliance requirements, repeated questions, common mistakes, hard-to-learn skills, veteran-held knowledge, existing systems, and existing documentation.

3. Produce discovery deliverables
   - Organizational Assessment
   - Department Assessments
   - Knowledge Inventory
   - Training Inventory
   - Gap Analysis
   - Prioritized Transformation Roadmap

4. Approve pilot scope
   - Recommended first pilot: Human Resources or Medication Administration.
   - Choose one department only.
   - Define success metrics before transforming content.

## What Would Make The Experience Better

- Make discovery feel guided, not administrative.
- Ask stakeholders what they repeat most often, where new employees struggle, and what knowledge would be dangerous to lose.
- Separate "required training" from "confidence-building knowledge."
- Capture accessibility requirements at the source, especially ASL, captions, transcript, visual-first learning, keyboard support, and plain language needs.
- Treat every interview as a source asset that can become transcripts, SOPs, FAQs, micro-lessons, quiz questions, scenarios, and AI knowledge documents.
- Require source references for every AI answer from day one.
- Design the future employee experience around "find the answer, practice the situation, build confidence," not "complete a course."
- Design the manager experience around visibility: gaps, expirations, struggling departments, confusing policies, and people needing support.

## Reusable Platform Modules

These modules should remain platform-level capabilities, not Bob Rumball-only features:

- Learning Hub
- Knowledge Base
- Universal Search
- AI Training Assistant
- Course Builder
- Course Player
- Employee Dashboard
- Manager Dashboard
- Certification Engine
- Reporting
- Accessibility Engine
- Forms Library
- Resource Library
- Notification Engine
- Profile System
- Authentication
- Progress Tracking

## Guardrails

- Do not upload PDFs as courses.
- Do not write courses before discovery is complete.
- Do not create a separate auth, notification, database, portal, accessibility, search, or AI system.
- Do not let AI answer from unapproved content.
- Do not build Bob Rumball-only architecture when a reusable EA pattern can serve the need.

## Local Preview

Discovery intake profile:

`http://localhost:3000/connect/bob-rumball-discovery`

Admin visibility:

`http://localhost:3000/admin/connect`

Local admin credentials:

- Email: `demo@efficiencyarchitects.online`
- Password: `DemoPulse2026!`

## Definition Of Done For Discovery

Discovery is complete when EA can clearly answer:

- Which departments need transformation first?
- Which knowledge is currently trapped in people, documents, videos, and informal practice?
- Which training is compliance-critical?
- Which topics create the most confusion?
- Which accessibility supports are mandatory for each content type?
- Which pilot department should prove the model?
- Which reusable platform modules are required for the pilot?

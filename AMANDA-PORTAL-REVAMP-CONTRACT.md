# Amanda Catherine Portal Revamp Contract

Status: isolated build. Production cutover is not authorized.

## Visual authority
The approved Amanda Portal V2 reference remains the visual authority. The portal must preserve the warm cream/ivory editorial treatment, muted sage/blush accents, AesthetiKine Studio Lab identity, left navigation, Amanda owner profile, Welcome Amanda hierarchy, wellness photography, Quick Actions, appointments/activity, course/program progress, resources/messages, and Eva.

## Chassis rule
Amanda is a tenant/visual skin on the shared EA portal chassis. Authentication, sessions, routing, responsive shell behavior, tenant isolation, operational adapters, and release governance belong to the chassis. Amanda-specific presentation belongs to the Amanda skin. Do not replace operational plumbing to achieve the visual design.

## Amanda concerns that are release blockers
1. Amanda must land in her actual business portal, never a generic EA project page.
2. The owner experience must be coherent, not a confusing set of three unrelated backend portal tabs.
3. Existing login behavior must remain simple and consistent.
4. Owner navigation must include Dashboard, Update Hub, Appointments / Jane, Clients, AesthetiKine Academy, LIFELINE, Documents & Certifications, Marketing, Business Insights, Eva, and Settings.
5. Academy must expose and manage the four canonical courses, students, enrollments, content, completion, and certifications without duplicate records.
6. Student delivery must follow Payment -> Enrollment -> Entitlement -> Login -> My Learning -> Course. A route merely loading is not proof that learning is production-ready.
7. Students waiting for modules make authenticated learning/module delivery a release blocker.
8. Jane appointments, resources, messages, documents/certifications, and Eva must be reachable from the portal.
9. Mobile must preserve the approved visual hierarchy without clipped, overlapping, or horizontally overflowing content.
10. No production-ready/client-ready claim is allowed until visual comparison and functional evidence pass.

## Canonical course display
- Nervous System Reset Training — CAD $997
- Body Sculpt Practitioner Certification — CAD $2,497 promotional / CAD $4,997 regular
- Non-Surgical BBL Training — CAD $1,497
- Tummy Tuck Sculpt with Fat-Dissolving Injection Integration — CAD $2,497

## Evidence gate
Before cutover:
- desktop screenshot against approved V2 reference
- mobile screenshot against approved responsive target
- owner login and redirect
- every owner navigation destination
- Jane handoff
- Academy course/student/enrollment/completion/certification management
- enrollment -> entitlement -> login -> My Learning -> course
- authenticated module access and progress persistence
- resources/messages/Eva access
- no horizontal overflow
- no 4xx/5xx on required portal journeys

Evidence or it is not finished.

# EA Universal Portal — Phase 2A Blueprint  
## People & Relationships Foundation

**Status:** Implementation blueprint only — **do not implement from this chat**  
**Scope:** Universal Person identity, org membership binding, households, relationships, thin object ACL, migration from Client Records  
**Out of scope (this phase):** Tasks Inbox, Novu, RJSF form runtime, OpenFGA deploy, industry vertical portals (church/school/chapter packs as products), Connect lead-capture rewrite, full NBA engine  
**Gap IDs closed by Phase 2A:** **A-007** (People module foundation), **A-003** (guardian / family access model), **A-002** (thin object ACL — People-scoped first; Documents reuse later)  
**Gap IDs explicitly deferred:** A-008 Messaging product, A-009 Tasks, A-011–A-013 Forms/Payments ledger depth, A-014 Search, industry packs A-023–A-026  
**Companions:**  
- [EA-UNIVERSAL-PORTAL-GAP-AUDIT.md](../audits/EA-UNIVERSAL-PORTAL-GAP-AUDIT.md)  
- [EA-UNIVERSAL-PORTAL-OSS-FIT-AUDIT.md](../audits/EA-UNIVERSAL-PORTAL-OSS-FIT-AUDIT.md)  
- [EA-UNIVERSAL-PORTAL-PHASE-1-BLUEPRINT.md](./EA-UNIVERSAL-PORTAL-PHASE-1-BLUEPRINT.md)  
- [EA-UNIVERSAL-PORTAL-PHASE-1-IMPLEMENTATION.md](../reports/EA-UNIVERSAL-PORTAL-PHASE-1-IMPLEMENTATION.md)  
- [EA-UNIVERSAL-PORTAL-PHASE-1-RUNTIME-CERTIFICATION.md](../reports/EA-UNIVERSAL-PORTAL-PHASE-1-RUNTIME-CERTIFICATION.md)  
**Integration Gate:** [INTEGRATION-GATE.md](../INTEGRATION-GATE.md)  

| Field | Value |
|---|---|
| **Branch** | `master` |
| **Commit SHA (blueprint base)** | `c1bbc78260ef7cede436146741c5af1e4a874d6d` |
| **Parent (Phase 1 land)** | `38fa48181389a2f25fa1fba7062fc7087a03974c` (pretix) → Phase 1 commit above |
| **Blueprint date** | 2026-07-26 |
| **Security review** | [EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-SECURITY-REVIEW.md](../reviews/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-SECURITY-REVIEW.md) — **APPROVED WITH CONDITIONS**; P0/P1 controls incorporated below (§25–§26) |
| **Launch impact** | Unlocks multi-persona portal capacity (clients/members/guardians) without rebuilding Connect or Memberships; required before industry packs can ship People UX. |

---

## 1. Objectives and non-goals

### 1.1 Objectives

1. Introduce one **universal Person** model that can represent clients, members, employees, volunteers, students, parents/guardians, donors, participants, providers, advisors, organization leaders, and authorized representatives — via **roles and relationship types**, not separate person tables per industry.
2. Bind every Person to **tenant isolation** through durable `organizationId` (+ portal slug for routing), never cross-org reads.
3. Model **household / family**, **person↔person**, and **person↔program/project/service** relationships with consent-aware visibility.
4. Ship a **thin internal object ACL** sufficient for People (and reusable later by Documents) without adopting OpenFGA now.
5. Preserve and migrate **Client Records**, **Memberships**, portal sessions, entitlements, and RBAC — People **extends**, does not replace.
6. Enable IndustryPack `extensions.people` only behind a **new feature flag** (default OFF), while keeping Phase 1 `UNIVERSAL_NAV_PACKS` behavior intact.
7. Provide a clear **OpenFGA extension point** (tuple projection interface) with zero runtime OpenFGA dependency in 2A.

### 1.2 Non-goals

| Explicitly excluded | Notes |
|---|---|
| Tasks Inbox | Gap A-009 — Phase 2B+ |
| Novu / notification prefs product | Pack extension remains data-only |
| RJSF form runtime | `formSchemaRefs` stay opaque |
| OpenFGA install / service | STUDY ONLY per OSS fit audit |
| Twenty / NocoBase CRM | REJECT as product; schema inspiration only |
| Industry-specific portals | No church/school/chapter People UX skins beyond label maps |
| Rewriting Connect capture funnel | Connect stays lead-capture; optional *link* to Person later |
| Replacing Airtable Client Records in one cutover | Dual-read / migrate-forward |

### 1.3 Architecture gate check

| Question | Answer |
|---|---|
| Increases platform capacity? | Yes — universal directory + guardian scoping |
| Increases simplicity? | Yes vs bolting Twenty/OpenFGA now |
| Reusable? | Person + ACL reused by Documents, Messages, Tasks later |
| Rebuild? | **No** — extend Organizations, Memberships, Client Records, Phase 1 packs |

---

## 2. Repository evidence (cite before design)

### 2.1 Phase 1 People placeholder (shipped, disabled)

| Evidence | Path / symbol |
|---|---|
| Universal id `people` with **empty** module map | `lib/portal-universal/capability-ids.ts` — `UNIVERSAL_TO_MODULES.people: []` |
| Pack extension slot | `lib/portal-universal/industry-pack.ts` — `extensions.people?: { enabled: false } \| { enabled: true; schemaVersion }` |
| Nav items `visibility: { kind: 'never' }` | `lib/portal-universal/packs/ea-executive.ts`, `ctp-client.ts`, `sample-placeholder.ts` |
| Phase 1 strict validate rejects `people.enabled === true` | `lib/portal-universal/validate-pack.ts` |
| Flag for nav packs (separate from People) | `lib/portal-universal/flags.ts` — `UNIVERSAL_NAV_PACKS` default OFF |
| Cert: no People runtime | `docs/reports/EA-UNIVERSAL-PORTAL-PHASE-1-RUNTIME-CERTIFICATION.md` — `NO-LATER-PHASE-RUNTIME` PASS |

### 2.2 Existing identity / tenancy surfaces

| Concern | Evidence |
|---|---|
| Organization | `lib/organizations.ts` — `Organization` (`id`, `slug`, `portalSlug?`, `clientRecordId?`, `platformClientId?`, **`industryPackId?`**) |
| Membership (email ↔ org + PlatformRole) | `lib/memberships.ts` — `Membership`, `ensureOwnerMembership` |
| Client Records (commerce / portal access) | `lib/airtable.ts` — `PortalClientRecord`, `getClientByPortalSlug`, table `Client Records` |
| Connect relationships (staff CRM leads by **orgSlug**) | `lib/connect-store.ts` — `ConnectRelationship`, `RelationshipStatus` |
| RBAC ranks | `lib/rbac.ts` — `PLATFORM_ROLES`, `roleAtLeast` |
| Session isolation | `lib/auth/resolve-portal-session.ts`, `lib/ea-portal-auth.ts`, `lib/modules/portal-modules.ts` (`session.slug !== slug` deny), `lib/api/portal-route.ts` |
| Entitlements | `lib/entitlements.ts` + `resolvePortalModuleAccess` in `lib/modules/portal-modules.ts` |
| Profile API (client summary only) | `app/api/portal/profile/route.ts` → `getClientSuccessProfile` |
| Document hub (no object ACL yet) | `lib/portal-document-hub.ts` — gap **A-002** |
| Provisioning | `lib/fulfill-paid-client.ts`, `lib/org-provision.ts` |
| Demo fixtures | `lib/demo-client.ts`, `lib/demo-local-fallback.ts` |

### 2.3 Audit mandates

| Gap | Mandate |
|---|---|
| **A-007** | People + Relationship + Household schemas + UI |
| **A-003** | Authorized-representative role + scope (guardian/family) |
| **A-002** | Object ACL model + checks (People first) |
| OSS fit | BUILD People internally; **REJECT Twenty**; **STUDY OpenFGA** after thin ACL |
| Gap U2 | “No households, family/authorized-rep links… multi-party people graph” |

---

## 3. Domain model

### 3.1 Design principle

> One **Person** record. Many **memberships**, **roles**, and **relationships**.  
> Industry language is a **label** over universal role codes — never a separate schema per industry.

```
Organization (existing)
    │
    ├── PersonDirectoryMembership[]  (Person ↔ Org + universal directory role codes)
    ├── Household[]                  (org-scoped)
    │       └── HouseholdMember[]    (Person + household role)
    ├── PersonRelationship[]         (Person ↔ Person, typed — required for guardian ACL)
    ├── PersonProgramLink[]          (Person ↔ program/project/service)
    ├── PersonConsent[]
    ├── PersonAclGrant[]             (thin object ACL)
    └── PeopleAuditEvent[]           (append-only; no update/delete API)
```

Client Records and portal `Membership` rows remain **sources of truth for commerce and portal login**. People become the **directory / relationship graph** only. Directory roles **never** create or elevate `PlatformRole`.

---

### 3.2 Person identity model

**Type:** `Person` (new)  
**Proposed module path:** `lib/people/types.ts`, persistence `lib/people/store.ts`

```ts
/** Phase 2A — canonical person identity (org-scoped primary key is composite via memberships) */
export type PersonId = string; // platform store record id

export type PersonLifecycleStatus =
  | 'active'
  | 'inactive'
  | 'archived'
  | 'deceased';

export type Person = {
  id: PersonId;
  /**
   * Owning tenant — REQUIRED. Never null in production.
   * IMMUTABLE after create (INV-2). Writers must not accept organizationId from clients.
   */
  organizationId: string;
  /**
   * Portal routing hint. When set, MUST equal Organization.portalSlug / slug for organizationId.
   * Verified on write; never used alone for authz (INV-1).
   */
  portalSlug?: string;

  // Identity
  displayName: string;
  legalName?: string;
  preferredName?: string;
  emails: PersonEmail[];
  phones: PersonPhone[];
  dateOfBirth?: string; // ISO date; field-ACL protected
  /** Explicit minor flag; if unset, minority derived from dateOfBirth + PEOPLE_MAJORITY_AGE */
  isMinor?: boolean;
  externalIds?: PersonExternalId[]; // Client Record id, Stripe customer, etc.

  lifecycleStatus: PersonLifecycleStatus;
  deceasedAt?: string;

  // Soft duplicate / merge
  mergedIntoPersonId?: PersonId; // if set, record is alias; reads redirect
  duplicateOfPersonId?: PersonId; // suspected, not merged

  // Ownership
  createdByUserEmail?: string;
  ownerUserEmail?: string; // staff owner for CRM-style assignment
  source:
    | 'manual'
    | 'client-record-migration'
    | 'membership-bootstrap'
    | 'connect-link'
    | 'import'
    | 'provisioning';

  createdAt: string;
  updatedAt: string;
};

export type PersonEmail = {
  value: string; // normalized lowercase
  kind: 'primary' | 'work' | 'personal' | 'other';
  verified?: boolean;
};

export type PersonPhone = {
  value: string;
  kind: 'mobile' | 'work' | 'home' | 'other';
};

export type PersonExternalId = {
  system:
    | 'client-record'
    | 'membership-email'
    | 'connect-relationship'
    | 'stripe-customer'
    | 'other';
  value: string;
};
```

**Rules:**

- A Person is **always** scoped by `organizationId`. Global people across tenants are forbidden (**INV-1**).
- `organizationId` is **immutable** after create (**INV-2**). Wrong-org attachment is a create-time bug; fix by archive + recreate in correct org — never `UPDATE` org id.
- Same human in two orgs ⇒ **two Person rows** (email may repeat across orgs) (**INV-3**).
- Emails are unique **within an organization** (case-insensitive) among persons where `lifecycleStatus ∈ {active, inactive}` and `mergedIntoPersonId` is unset. Archived/deceased/merged may reuse email for remigration.
- **Unique constraint:** `(organizationId, externalIds.system, externalIds.value)` for each external id (**INV-11**) — upsert key for Client Record / provisioning.
- `mergedIntoPersonId` records are read-only aliases; writers must target the survivor.

---

### 3.3 Directory membership (Person ↔ Org roles)

Distinct from existing portal `Membership` (`lib/memberships.ts`), which binds **login email → PlatformRole** for portal RBAC.

| Layer | Purpose | Keep? |
|---|---|---|
| `Membership` (existing) | Portal session RBAC / entitlements actor | **Yes — unchanged contract** |
| `PersonDirectoryMembership` (new) | Directory role(s) of a Person in the org | **New** — never elevates PlatformRole (**INV-4**, **INV-8**) |

```ts
export type UniversalPersonRoleCode =
  | 'client'
  | 'member'
  | 'employee'
  | 'volunteer'
  | 'student'
  | 'parent_guardian'
  | 'donor'
  | 'participant'
  | 'provider'
  | 'advisor'
  | 'org_leader' // directory label only — NOT PlatformRole owner/admin
  | 'authorized_representative'
  | 'staff_contact' // directory peer — NOT PlatformRole staff
  | 'other';

export type PersonDirectoryMembership = {
  id: string;
  organizationId: string;
  personId: PersonId;
  roles: UniversalPersonRoleCode[]; // multi-role allowed
  status: 'active' | 'inactive' | 'invited' | 'ended';
  title?: string; // free-text job/title
  /** Link to portal login Membership when this person can sign in */
  portalMembershipId?: string;
  /** Link to Client Record when this person is the billing/client principal */
  clientRecordId?: string;
  startedAt?: string;
  endedAt?: string;
};
```

**Bridge rule:** On login / provision, if `Membership.userEmail` matches a Person primary email in the same org, attach `portalMembershipId`. Do not auto-create portal `Membership` from every Person (volunteers/students may not log in).

**Offboarding (former employee / staff) — INV-7:**

1. Portal login access is controlled **only** by `Membership.status` (+ session). Ending `PersonDirectoryMembership` alone does **not** revoke login — operators must suspend/remove `Membership`.
2. Ending directory membership (`status: 'ended'`) immediately removes directory editor/viewer derived from directory roles.
3. People APIs must not set `Membership.role` to `staff|manager|admin|owner` based on directory roles (`volunteer`, `staff_contact`, `org_leader`, etc.).

---

### 3.4 Universal roles vs IndustryPack labels

| Layer | Example | Authority |
|---|---|---|
| `UniversalPersonRoleCode` | `parent_guardian` | Code — stable, queryable, ACL |
| IndustryPack terminology | `"Parents & Guardians"`, `"Caregivers"` | Label only via pack `branding.terminology` / people label map |
| `PlatformRole` | `owner`, `staff`, `guest` | Portal module RBAC — **orthogonal** |

**Pack extension (Phase 2A enables schema):**

```ts
// IndustryPackExtensions.people when enabled
{
  enabled: true,
  schemaVersion: '2A.1.0',
  roleLabels?: Partial<Record<UniversalPersonRoleCode, string>>,
  defaultDirectoryRoles?: UniversalPersonRoleCode[],
  hideRoleCodes?: UniversalPersonRoleCode[],
}
```

Phase 1 `validate-pack.ts` today **rejects** `people.enabled === true`. Phase 2A must:

1. Introduce pack validate mode `phase2aPeople` (or bump strictness flags).
2. Keep shipped packs at `enabled: false` until flag ON **and** org entitlement includes `people` module.
3. Never enable People nav without module entitlement ∩ ACL.

---

### 3.5 Household and family relationships

```ts
export type Household = {
  id: string;
  organizationId: string;
  displayName: string; // e.g. "Nguyen Household"
  status: 'active' | 'archived';
  primaryContactPersonId?: PersonId;
};

export type HouseholdMemberRole =
  | 'head'
  | 'spouse_partner'
  | 'child'
  | 'dependent'
  | 'guardian'
  | 'other';

export type HouseholdMember = {
  id: string;
  organizationId: string;
  householdId: string;
  personId: PersonId;
  role: HouseholdMemberRole;
  /**
   * Marks this member as eligible to be an authorized rep — NOT a blanket grant.
   * Guardian ACL still requires a subject-specific relationship to the child (INV-guardian).
   */
  isAuthorizedRepresentative?: boolean;
  authzExpiresAt?: string; // optional window; checked at eval time
};
```

**Guardian access (A-003) — fail closed, subject-specific:**

- **Minor determination (check-time):** `isMinor === true` **or** `dateOfBirth` implies age &lt; `PEOPLE_MAJORITY_AGE` (default 18). If majority reached → person is **not** a minor; derived guardian access **ends** even if edges remain (`status` may stay for history) (**INV-6**).
- Actor may access minor **M** only if **all** hold:
  1. Same `organizationId` as M (**INV-1**).
  2. Active `PersonRelationship` with `type ∈ {guardian_of, authorized_rep_for}`, `fromPersonId = actor`, `toPersonId = M`, `status = 'active'`, and not expired (`expiresAt` unset or `> now`) — **OR** both actor and M are members of the same active household **and** a `guardian_of`/`authorized_rep_for` edge to **M** exists (household alone is **insufficient**).
  3. Actor directory roles include `parent_guardian` or `authorized_representative` (or explicit ACL grant `guardian` on M).
  4. Active non-expired consent on M with purpose `share_with_guardian` or `portal_access` allowing guardian proxy.
  5. No lifecycle block on M for this actor (see §5 / **INV-9**).

**Forbidden:** Treating `HouseholdMember.isAuthorizedRepresentative` as access to **all** children in the household.

---

### 3.6 Person-to-person relationships

```ts
export type PersonRelationshipType =
  | 'guardian_of'
  | 'child_of'
  | 'spouse_partner_of'
  | 'authorized_rep_for'
  | 'emergency_contact_for'
  | 'referred_by'
  | 'reports_to'
  | 'advisor_for'
  | 'provider_for'
  | 'other';

export type PersonRelationship = {
  id: string;
  organizationId: string;
  fromPersonId: PersonId;
  toPersonId: PersonId;
  type: PersonRelationshipType;
  status: 'active' | 'ended';
  expiresAt?: string; // INV-5 — required check at ACL eval
  bidirectionalMirrorId?: string; // optional inverse edge id
  notes?: string; // field-ACL
};
```

Guardian ACL **requires** subject-specific edges. Households are convenience groupings, not a substitute for `guardian_of`.

---

### 3.7 Person ↔ program / project / service

```ts
export type PersonProgramLinkKind =
  | 'ctp_opportunity'
  | 'ctp_workspace'
  | 'simplifi_opportunity'
  | 'connect_engagement'
  | 'event_registration'
  | 'member_program'
  | 'service_case'
  | 'other';

export type PersonProgramLink = {
  id: string;
  organizationId: string;
  personId: PersonId;
  kind: PersonProgramLinkKind;
  /** Opaque external id in existing system (opportunity id, submission id, etc.) */
  externalRef: string;
  label?: string;
  status: 'active' | 'completed' | 'withdrawn' | 'archived';
  roleInProgram?: string; // pack-labeled: "Participant", "Donor", …
};
```

**2A rule:** Links are **pointers**, not duplicated CTP/Simplifi state. CTP Guide remains system of record for stage; People only indexes “who is on this journey.”

---

## 4. Consent, communication preferences, minors

```ts
export type ConsentPurpose =
  | 'portal_access'
  | 'email_transactional'
  | 'email_marketing'
  | 'sms'
  | 'directory_visible_to_members'
  | 'directory_visible_to_staff'
  | 'share_with_guardian'
  | 'data_processing';

export type PersonConsent = {
  id: string;
  organizationId: string;
  personId: PersonId;
  purpose: ConsentPurpose;
  status: 'granted' | 'denied' | 'withdrawn' | 'expired';
  capturedAt: string;
  expiresAt?: string;
  source: 'registration' | 'import' | 'staff' | 'guardian_proxy' | 'legacy-client-record';
  /** If captured by guardian, record acting person id */
  actorPersonId?: PersonId;
};
```

**Communication preferences** store as consent rows + optional `Person.notificationChannels` later (do **not** wire Novu in 2A).

**Minor rules:**

- Marketing email/SMS to minors → default **denied**.
- Guardian may grant `portal_access` / `share_with_guardian` on behalf of minor with audit.
- Deceased / archived persons → all outbound marketing treated as denied.
- **Majority transition (INV-6):** At every ACL check, recompute minority from DOB/`isMinor`. When no longer a minor, derived `guardian` relation fails closed. Staff may end edges for hygiene; not required for security if check-time majority is enforced.
- Consent with `expiresAt <= now` or `status ∈ {expired, withdrawn, denied}` grants **nothing** (**INV-5**).

---

## 5. Statuses

| Status | Meaning | Member directory | Staff directory | Login bind |
|---|---|---|---|---|
| `active` | Current | ACL permitting | ACL permitting | If Membership active |
| `inactive` | Soft off | Hidden | Staff with ACL | Membership may be suspended |
| `archived` | Historical | **404 / hidden** | `owner\|admin` only (**INV-9**) | No new login bind |
| `deceased` | Special archived | **404 / hidden** | `owner\|admin` only; marketing denied (**INV-10**) | Block login bind |
| merged alias | `mergedIntoPersonId` set | Redirect to survivor for staff; else 404 | Follow survivor | N/A |

Transitions emit audit events. `deceased` cannot return to `active` without owner + audit.

**Deceased / destroy rules (INV-10):**

- **No cascade delete** of relationships, program links, consents, or audit when marking deceased.
- Hard delete still blocked if Client Record / open CTP links exist; prefer anonymize PII + retain stubs.
- Exports including deceased PII require `owner` PlatformRole and `people.export_deceased` capability (same as owner).

---

## 6. Duplicate detection and safe merging

### 6.1 Detection (non-destructive)

Signals (org-scoped):

1. Exact primary email match  
2. Normalized phone match + similar displayName (Levenshtein / token)  
3. Shared `externalIds.client-record`  
4. Staff-flagged `duplicateOfPersonId`

API: `POST /api/portal/[slug]/people/duplicates/scan` (staff+) returns candidates — **never auto-merge**.

### 6.2 Safe merge

```ts
export type PersonMergeRequest = {
  organizationId: string;
  survivorPersonId: PersonId;
  absorbedPersonId: PersonId;
  actorEmail: string;
};
```

**Algorithm:**

1. Resolve `sessionOrgId` from `session.slug` (never from body).  
2. Load both persons; require `survivor.organizationId === absorbed.organizationId === sessionOrgId` (**INV-1**). Else reject.  
3. Require `roleAtLeast(actor, 'manager')` + ACL merge permission.  
4. Move directory memberships, household links, relationships, program links, consents onto survivor (dedupe).  
5. Set absorbed.`mergedIntoPersonId = survivor`; status `archived`.  
6. Rewrite external id maps; if Client Record linked, keep single `clientRecordId` on survivor.  
7. Append audit `people.merge` with before/after id lists + field hashes.  
8. Idempotent: re-merge of already-merged absorbed → no-op success.

**Forbidden:** cross-org merge; merge involving `deceased` without owner override; trusting body `organizationId`.

---

## 7. Import and export

| Capability | 2A scope |
|---|---|
| Export | JSON/CSV via `redactPersonForActor` only (**INV-14**) — same redaction as GET |
| Import | CSV: displayName, email, phone, roles[], householdName, guardianEmail |
| Limits | Max rows per job (e.g. 500); dry-run validation default |
| Mapping | Role codes must be `UniversalPersonRoleCode`; pack labels via label→code map only |

**Import privilege rules (INV-8):**

- Import **cannot** create/update portal `Membership` or set `PlatformRole`.
- Importable directory roles are capped by actor PlatformRole:

| Actor PlatformRole | Max directory roles assignable via import |
|---|---|
| `owner` / `admin` | Full `UniversalPersonRoleCode` set |
| `manager` | All except cannot grant `org_leader` unless already present on actor’s Person |
| `staff` | `client`, `member`, `volunteer`, `participant`, `donor`, `student`, `other` only |
| below `staff` | Import forbidden |

- Malicious CSV rows requesting `staff`/`admin` PlatformRole strings are **rejected** (unknown columns ignored; known elevation columns fail the row).
- `source: 'import'`. Never overwrite Client Record payment fields.

**Export rules (INV-14):**

- No raw `platformQuery` dump endpoints.
- Every exported row passes `redactPersonForActor(actor, person)`.
- Field denies (e.g. DOB) apply identically to CSV/JSON.
- Cross-org ids in job payload → reject entire job.

---

## 8. Activity and audit history

```ts
export type PeopleAuditAction =
  | 'people.create'
  | 'people.update'
  | 'people.status_change'
  | 'people.merge'
  | 'people.export'
  | 'people.import'
  | 'people.acl_grant'
  | 'people.consent_change'
  | 'people.relationship_change'
  | 'people.view_sensitive'; // DOB, etc.

export type PeopleAuditEvent = {
  id: string;
  organizationId: string;
  actorEmail: string;
  actorPersonId?: PersonId;
  action: PeopleAuditAction;
  subjectPersonId?: PersonId;
  at: string;
  meta?: Record<string, string | number | boolean | null>;
};
```

**Immutability (INV-15):** Store exposes `appendPeopleAudit` only. No `update` / `delete` / `patch` functions. HTTP layer has no audit mutation routes. Tests assert module exports exclude mutators.

---

## 9. Data retention and deletion

| Case | Behavior |
|---|---|
| Soft delete | Prefer `archived` / `inactive` |
| Hard delete | Owner-only; blocked if linked Client Record with active portal access or open CTP workspace — must detach first |
| GDPR-style export | Use export API |
| Right to erasure | Anonymize PII fields; retain audit stubs with hashed subject id; honor deceased retention |
| Retention default | Configurable `PEOPLE_RETENTION_DAYS` (default retain archived 2555 days ≈ 7y for financial-adjacent orgs) — document only in 2A; cron optional |

Account deletion for Simplifi (`lib/simplifi-account-deletion.ts`) remains product-specific; People hard-delete must not silently wipe Client Records.

---

## 10. Thin internal ACL (A-002 / A-003)

### 10.1 Why thin ACL now

OSS fit audit: OpenFGA is **STUDY ONLY**; build internal ACL first. Document hub has **no** object ACL today (`lib/portal-document-hub.ts`).

### 10.2 Model

```ts
export type AclResourceType = 'person' | 'household' | 'people_export_job';
// Future: 'document' | 'message_thread' — same table

export type AclRelation =
  | 'org_admin'      // derived from PlatformRole admin+
  | 'owner'          // Person.ownerUserEmail
  | 'viewer'
  | 'editor'
  | 'guardian'       // scoped to subject minor
  | 'self';          // subject's own portal login

export type PersonAclGrant = {
  id: string;
  organizationId: string;
  resourceType: AclResourceType;
  resourceId: string;
  /** Subject who receives the relation */
  grantee:
    | { kind: 'user_email'; email: string }
    | { kind: 'person'; personId: PersonId }
    | { kind: 'platform_role'; role: PlatformRole }; // e.g. all staff
  relation: AclRelation;
  /** Optional field allowlist for field-level visibility */
  fieldsAllow?: string[]; // e.g. ['displayName','emails'] — empty = relation default
  fieldsDeny?: string[];  // e.g. ['dateOfBirth']
  expiresAt?: string;
};
```

### 10.3 Check API

```ts
// lib/people/acl.ts
export async function assertPeopleAccess(input: {
  /** MUST be resolved server-side from session.slug → Organization.id — never from request body (INV-1). */
  organizationId: string;
  portalSlug: string; // must equal session.slug
  actor: { email?: string; role: PlatformRole; personId?: PersonId };
  resourceType: AclResourceType;
  resourceId: string;
  relationNeeded: AclRelation | AclRelation[];
  field?: string;
}): Promise<{ ok: true } | { ok: false; code: 'forbidden' | 'not_found' | 'cross_tenant' }>;

/** Shared redaction used by GET and export (INV-14). */
export function redactPersonForActor(
  actor: { email?: string; role: PlatformRole; personId?: PersonId },
  person: Person,
  access: { relation: AclRelation },
): Partial<Person>;
```

**Evaluation order (fail closed):**

0. **Flag gate:** if `!isUniversalPeopleEnabled()` → treat as not_found (**INV-17**).  
1. **Tenant bind:** `organizationId` from session slug resolution; `resource.organizationId` must match; else `cross_tenant` / `not_found` (**INV-1**). Reject synthetic `org_*` writes in production.  
2. **Expiry (INV-5):** ignore ACL grants, consents, relationships, household auth windows with `expiresAt <= now` or inactive status.  
3. **Lifecycle (INV-9):** if person `archived|deceased` or merged alias → only `owner|admin` may access (member/staff → `not_found`).  
4. **Majority (INV-6):** derived guardian fails if subject is not a minor at check time.  
5. PlatformRole short-circuit: `owner|admin` → org_admin on active/inactive people in tenant (still field-deny DOB of unrelated minors unless guardian).  
6. Explicit non-expired grants.  
7. Derived: `self` if actor email matches person primary email and lifecycle allows.  
8. Derived: `guardian` per §3.5 subject-specific rules.  
9. Else deny.

Pack cannot widen ACL — only tighten labels/hide roles.

### 10.4 Field-level visibility

| Field class | Default viewer | Default staff | Guardian | Self |
|---|---|---|---|---|
| `displayName`, role labels | Directory policy | Yes | Yes | Yes |
| `emails`, `phones` | Staff / self / guardian | Yes | Yes | Yes |
| `dateOfBirth` | Deny | Manager+ or guardian | Yes | Yes |
| Consents | Staff / self | Yes | Limited | Yes |
| Audit | Manager+ | — | No | No |

---

## 11. OpenFGA extension point (no adopt)

```ts
// lib/people/authz-port.ts — Phase 2A stub
export type AuthzTuple = {
  user: string;      // `user:email:` or `person:`
  relation: string;  // mirrors AclRelation
  object: string;    // `person:id` / `household:id`
};

export interface AuthzProjector {
  /** Project current ACL + relationships into tuples (for future OpenFGA sync). */
  projectOrg(organizationId: string): Promise<AuthzTuple[]>;
}

export class InternalAclAuthzProjector implements AuthzProjector {
  // 2A: reads PersonAclGrant + derived edges; no network calls
}

/** Future: OpenFgaAuthzProjector implements AuthzProjector — not shipped in 2A */
```

**Rules (INV-16):**

- Product authorization calls **`assertPeopleAccess` only** — never `AuthzProjector`, never OpenFGA SDK.  
- `lib/people/acl.ts` must **not** import `authz-port.ts` (enforced by contract test).  
- Projector is for **export/sync tooling** only; it is never authoritative for allow/deny.  
- No `openfga` / `@openfga/*` dependency in Phase 2A `package.json`.

---

## 12. Integration with existing systems

### 12.1 Organizations

- All People rows require durable `organizationId` (reject `org_*` synthetic in production — align with `ensureOrganizationForPortal` / tenant-context posture from gap **A-001**).  
- `organization.industryPackId` drives role labels when `UNIVERSAL_NAV_PACKS` and People flags allow.

### 12.2 Client Records

| Client Record field | People mapping |
|---|---|
| `id` | `PersonExternalId.system = 'client-record'` |
| `clientName` | `displayName` / `legalName` |
| `email` | primary email |
| `portalSlug` | `portalSlug` + org bind |
| `portalAccessStatus` | remains on Client Record; Person `lifecycleStatus` synced loosely |

**Dual-read period:** Portal profile continues to use Client Record; People directory is additive.

### 12.3 Portal sessions & RBAC

- Unchanged: `requirePortalSession` / `requirePortalModule` / slug match (`session.slug !== slug` deny).  
- **Every** People route checklist (**INV-13**):  
  1. `isUniversalPeopleEnabled()` else **404**  
  2. `guardPortalApi` / session verify  
  3. URL `slug === session.slug`  
  4. Resolve `organizationId` via `findOrganizationByPortalSlug(slug)` — **ignore** body `organizationId` (**INV-1**)  
  5. `requirePortalModule(slug, 'people')` (entitlement ∩ PlatformRole)  
  6. `assertPeopleAccess` / `redactPersonForActor`  
- Guardian views use Membership `PlatformRole` **plus** People ACL — Membership alone is insufficient for minor data.

### 12.4 Entitlements

- Add `ModuleId` **`people`** to `lib/modules/registry.ts`.  
- `UNIVERSAL_TO_MODULES.people = ['people']`.  
- Package defaults: include `people` only for packages that should see directory (executive / staff packages); **exclude** from pure CTP Client Experience package defaults unless pack says otherwise.  
- CX (`ctp-client`) keeps People nav `never` unless a future pack revision enables a limited “Your household” surface (not in 2A UI requirement).

### 12.5 Connect

- Do **not** migrate Connect relationships wholesale into People in 2A.  
- Optional: `PersonExternalId.system = 'connect-relationship'` when staff links a lead to a Person.  
- Connect `orgSlug` isolation remains; linking requires org id resolution via `findOrganizationByPortalSlug`.

---

## 13. CTP and provisioning implications

| Flow | 2A change |
|---|---|
| `fulfillPaidClient` | Flag-gated call to **single** `ensurePersonForClientRecord` (**INV-12**) |
| `org-provision` / `ensureOwnerMembership` | Same `ensurePersonForClientRecord` upsert — never a second create path |
| CTP workspace bind | Upsert `PersonProgramLink` kind `ctp_workspace` on **existing** person from ensure; do not create a second Person |
| Website + Portal | Same — no CTP intake URL changes |
| Demo | Local demo seeds only |

**`ensurePersonForClientRecord` upsert key (INV-12):**

1. Find by `(organizationId, external system=client-record, value=clientRecordId)`.  
2. Else find by `(organizationId, primary email)` among active/inactive.  
3. Else create once with `source: 'provisioning' | 'client-record-migration'`.  
4. Concurrent retries must be idempotent (unique constraint + catch duplicate).

**Must not:** change CTP Guide stage engine, opportunity emails, or Client Experience five-nav destinations. Flag OFF ⇒ zero calls into People from fulfill (**INV-17**).

---

## 14. Migration strategy for existing Client Records

### 14.1 Phases

1. **Shadow write (flag ON, read OFF):** provision/migrate creates Person rows; UI still Client Record.  
2. **Dual read:** directory UI reads People; profile still Client Record.  
3. **Attach:** backfill job links historical Client Records → Persons (idempotent by external id).  
4. **Stabilize:** People becomes directory SoR; Client Record remains commerce SoR.

### 14.2 Backfill job

`scripts/migrate-client-records-to-people.mts`

- Input: `organizationId` or `portalSlug`  
- Skip synthetic orgs  
- Dry-run default  
- Batch size capped  
- Emit audit create events  
- Never delete Client Records  
- **Preserve relationships (INV-11):** when CTP workspace / opportunity ids are known for the client, create `PersonProgramLink` rows; do not drop existing Guide state  
- Retry uses same upsert key as §13 — **no duplicate Persons**

### 14.3 Rollback of migration (**INV-18**)

- Flag OFF → People APIs/UI **404**; data **retained** (relationships included).  
- **No automatic purge** of Persons, households, edges, ACL, or audit on rollback.  
- Re-enable resumes on existing rows.  
- Manual purge is a separate, owner-approved ops procedure (out of 2A auto path).

---

## 15. Backward compatibility

| Surface | Compatibility requirement |
|---|---|
| Phase 1 IndustryPacks | Remain valid; `people.enabled: false` until explicitly revised |
| `UNIVERSAL_NAV_PACKS` | Independent; People has its own flag |
| Client Experience nav | Unchanged five destinations |
| `Membership` / `PlatformRole` | Unchanged semantics; directory roles never elevate |
| Connect store | Unchanged APIs |
| Profile API | Additive fields only when flag ON |
| Fulfill | **Byte-stable** when People flag OFF (**INV-17**) |

---

## 16. Feature-flag and rollback

| Flag | Default | Effect |
|---|---|---|
| `UNIVERSAL_PEOPLE` | **OFF** (`unset`/`0`) | All `/people` page + API routes **404**; nav stays `never`; fulfill/org-provision People hooks **no-op**; no auto entitlement insert; packs `people.enabled` ignored |
| `UNIVERSAL_PEOPLE=1` | Opt-in | Module entitlement honored; APIs live; ensurePerson allowed |
| `UNIVERSAL_PEOPLE_READ_CLIENT_FALLBACK` | ON when People ON | Profile dual-read safety |

**Rollback:** unset `UNIVERSAL_PEOPLE`. Retain data (**INV-18**). No entitlement row deletion required.

Env documentation in `.env.example` only at implementation time.

---

## 17. Exact files, types, schemas, routes affected

### 17.1 New (proposed)

| Path | Purpose |
|---|---|
| `lib/people/types.ts` | Person, Household, Relationship, Consent, ACL, Audit types |
| `lib/people/store.ts` | Platform-store / Airtable persistence (one client) |
| `lib/people/acl.ts` | `assertPeopleAccess`, field redaction |
| `lib/people/authz-port.ts` | `AuthzProjector` stub |
| `lib/people/duplicate.ts` | Scan + merge |
| `lib/people/migrate-from-client.ts` | Client Record → Person |
| `lib/people/flags.ts` | `isUniversalPeopleEnabled` |
| `lib/people/index.ts` | Public exports |
| `app/api/portal/[slug]/people/route.ts` | List/create |
| `app/api/portal/[slug]/people/[personId]/route.ts` | Get/update/status |
| `app/api/portal/[slug]/people/[personId]/relationships/route.ts` | |
| `app/api/portal/[slug]/people/households/route.ts` | |
| `app/api/portal/[slug]/people/merge/route.ts` | |
| `app/api/portal/[slug]/people/import/route.ts` | |
| `app/api/portal/[slug]/people/export/route.ts` | |
| `app/portal/[slug]/people/page.tsx` | Staff directory shell (minimal) |
| `scripts/test-people-unit.mts` | |
| `scripts/test-people-acl-isolation.mts` | |
| `scripts/test-people-migration.mts` | |
| `scripts/test-people-provisioning-regression.mjs` | Fulfill untouched when flag OFF |
| `scripts/migrate-client-records-to-people.mts` | Dry-run backfill |

### 17.2 Modified (proposed)

| Path | Change |
|---|---|
| `lib/modules/registry.ts` | Add `people` module id, path `/portal/{slug}/people`, `requiredRole: 'staff'` (or `viewer` for limited self — decide at impl: default **staff** for directory) |
| `lib/portal-universal/capability-ids.ts` | `UNIVERSAL_TO_MODULES.people = ['people']` |
| `lib/portal-universal/validate-pack.ts` | Allow `extensions.people.enabled` when schemaVersion semver and flag context |
| `lib/portal-universal/packs/*.ts` | Keep `enabled: false` in 2A ship; optionally set roleLabels in comments/docs |
| `lib/experience-registry.ts` | Add CapabilityId entry for People directory (displayLabel from pack later) |
| `lib/organizations.ts` | No break; already has `industryPackId` |
| `lib/fulfill-paid-client.ts` | **Flag-gated** optional person ensure only |
| `lib/org-provision.ts` | Flag-gated person upsert |
| `.env.example` | `UNIVERSAL_PEOPLE=` |
| Platform store table constants | `lib/platform-store.ts` — new table name constants |

### 17.3 Explicitly untouched

`lib/notify-dispatch.ts`, Novu, RJSF, Tasks stores, pretix, Trust/e-sign, CTP Guide stage engine, Client Experience five-nav legacy path, OpenFGA packages.

### 17.4 Persistence schema (platform store / Airtable)

Proposed tables (names illustrative):

| Table | Key fields |
|---|---|
| `People` | Organization Id, Display Name, Emails (JSON), Phones (JSON), Lifecycle Status, External Ids (JSON), Owner Email, Merged Into, Portal Slug |
| `People Households` | Organization Id, Display Name, Primary Contact Person Id, Status |
| `People Household Members` | Organization Id, Household Id, Person Id, Role, Authorized Rep |
| `People Relationships` | Organization Id, From Person Id, To Person Id, Type, Status |
| `People Program Links` | Organization Id, Person Id, Kind, External Ref, Status |
| `People Consents` | Organization Id, Person Id, Purpose, Status, Actor Person Id |
| `People ACL Grants` | Organization Id, Resource Type, Resource Id, Grantee JSON, Relation, Fields Allow/Deny |
| `People Audit` | Organization Id, Actor Email, Action, Subject Person Id, Meta JSON, At |
| `People Org Memberships` | Organization Id, Person Id, Roles JSON, Status, Client Record Id, Portal Membership Id |

> Table title may remain “People Org Memberships” in Airtable; TypeScript type is **`PersonDirectoryMembership`** to avoid collision with portal `Membership`.

Use existing `platformCreate` / `platformQuery` patterns from `lib/memberships.ts` — **one** platform client, no fourth Airtable SDK.

Also add to proposed scripts: `scripts/test-people-adversarial.mts`.

---

## 18. Security and cross-organization leakage tests

Baseline isolation cases (automated) — **plus** full adversarial matrix in **§26**:

| ID | Case | Expect |
|---|---|---|
| S1 | List people with session slug A against org B ids | 403 / empty; no B rows |
| S2 | Get personId of org B with session org A | `not_found` (no existence leak) |
| S3 | Merge across orgs | Reject |
| S4 | Guardian of minor in org A cannot read org B child | Deny |
| S5 | Export job cannot include other org | Deny |
| S6 | ACL grant forged with other `organizationId` | Reject on write |
| S7 | Synthetic `org_*` in production | No people writes |
| S8 | Guest PlatformRole without grant | No directory list |
| S9 | Field ACL: staff viewer cannot read DOB without allow | Redacted on GET **and** export |
| S10 | Deceased excluded from member-facing directory | Hidden / 404 |

Reuse patterns from Phase 1 cert `CROSS-ORG-ISOLATION` and portal `session.slug !== slug` checks.

---

## 19. Test plan

### 19.1 Unit

- Role code validation; lifecycle transitions  
- Duplicate email within org (not across orgs)  
- Merge idempotency + cross-org reject  
- Guardian subject-specific derivation + expiry + majority  
- Field redaction matrix shared by GET/export  
- Flag OFF ⇒ routes/helpers disabled  
- Audit store has no update/delete exports  
- `acl.ts` does not import `authz-port.ts`

### 19.2 Integration

- API list/create/get with full INV-13 checklist  
- Body `organizationId` ignored / rejected  
- Entitlement: without `people` module ⇒ 403 when flag ON  
- Demo slug local fixtures  

### 19.3 Migration

- Dry-run Client Record → Person  
- Idempotent second run (no duplicate)  
- Program links preserved when known  
- Client Record preserved  

### 19.4 Provisioning regression

- `UNIVERSAL_PEOPLE` unset ⇒ `fulfill-paid-client` unchanged  
- Flag ON ⇒ single Person across fulfill + org-provision + CTP bind retries  

### 19.5 ACL / leakage / adversarial

- `scripts/test-people-acl-isolation.mts` — S1–S10  
- `scripts/test-people-adversarial.mts` — ADV-1…ADV-22 (§26)

---

## 20. Acceptance criteria

Phase 2A is **done** when:

1. `Person` / Household / Relationship / Consent / ACL / Audit types exist and persist org-scoped.  
2. Universal role codes cover all listed personas via roles (not separate tables).  
3. `ModuleId` `people` registered; `UNIVERSAL_TO_MODULES.people = ['people']`.  
4. Feature flag default **OFF**; rollback by unset with **no data purge**.  
5. Thin ACL enforces tenant + subject-specific guardian + field rules + expiry + majority; OpenFGA not installed; projector non-authoritative.  
6. Client Record migration dry-run + idempotent attach + program-link preservation on demo fixtures.  
7. Fulfill/CTP unchanged when flag OFF; single `ensurePersonForClientRecord` when ON.  
8. No Tasks / Novu / RJSF / industry portal code paths activated.  
9. Tests S1–S10 and ADV-1…ADV-22 pass.  
10. Minimal staff directory route renders behind entitlement without breaking CX.  
11. IndustryPack `extensions.people` validatable with `schemaVersion`; shipped packs remain disabled until deliberate enable.  
12. **All §25 security invariants** implemented and tested.  
13. Security review conditions in `docs/reviews/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-SECURITY-REVIEW.md` satisfied.

---

## 21. Ordered implementation sequence

1. **Types + flags** — `lib/people/types.ts`, `flags.ts` (default OFF).  
2. **Store + audit** — platform tables + CRUD with org checks.  
3. **ACL** — `assertPeopleAccess` + field redaction + tests S1–S10 skeleton.  
4. **Module registry** — add `people`; map universal capability; experience-registry entry.  
5. **APIs** — list/get/create/update behind `guardPortalApi` + module entitlement.  
6. **Households + relationships + consents** — APIs + guardian derivation.  
7. **Duplicates + merge** — staff tools.  
8. **Import/export** — CSV + redaction.  
9. **Migration** — Client Record attach + script dry-run.  
10. **Provisioning hooks** — flag-gated fulfill/org-provision.  
11. **Minimal UI** — `/portal/[slug]/people` staff directory.  
12. **Pack validate relax** — allow `extensions.people.enabled` with schemaVersion; keep packs disabled.  
13. **AuthzProjector stub** — documentation + empty projector.  
14. **Certification** — unit/integration/migration/provisioning/ACL; write Phase 2A cert report (later).  
15. **Stop** — do not enable flag in production without cert + explicit cutover.  

---

## 22. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Dual SoR drift (Client vs Person) | External ids + dual-read flag; commerce stays on Client Record |
| Guardian overshare | Fail-closed ACL; consent required; field denies |
| Connect vs People confusion | Document Connect = capture; People = directory; link optional |
| Premature OpenFGA | Stub only; OSS audit gate |
| Scope creep into Tasks/Forms | Explicit non-goals; Architecture Gate |
| Synthetic org leakage | Block people writes for `org_*` in production |

---

## 23. What “done” does *not* include

- Member-facing social directory for chapters/churches  
- SIS / donor CRM feature parity  
- Automatic Connect→People sync of all leads  
- OpenFGA production tuples  
- Tasks inbox, Novu topics, RJSF renderers  
- Enabling `UNIVERSAL_PEOPLE` on production by default  

---

## 24. Verdict for implementers

**Phase 2A is a foundation blueprint**, security-hardened after adversarial review (**APPROVED WITH CONDITIONS**). Implement only after launch priority confirms People unblocks near-term EA launch capacity. Prefer the sequence in §21; keep flags OFF; cite this document, the security review, and commit `c1bbc78260ef7cede436146741c5af1e4a874d6d` as the Phase 1 baseline.

**Do not begin implementation from this chat.**

---

## 25. Security invariants (non-negotiable)

| ID | Invariant |
|---|---|
| **INV-1** | Tenant identity is resolved only from authenticated `session.slug` → Organization. Request body `organizationId` is ignored. Person/`resource.organizationId` must match. |
| **INV-2** | `Person.organizationId` is immutable after create. |
| **INV-3** | Same email may exist in multiple orgs as separate Person rows; uniqueness is per-org. |
| **INV-4** | `UniversalPersonRoleCode` / `PersonDirectoryMembership` never creates or elevates portal `Membership` / `PlatformRole`. |
| **INV-5** | Expired consents, relationships, ACL grants, and household auth windows grant nothing at check time. |
| **INV-6** | Guardian derived access requires subject is a minor at check time (`PEOPLE_MAJORITY_AGE` / `isMinor`). |
| **INV-7** | Ending employment/directory roles does not by itself revoke login; operators must suspend `Membership`. Directory rights end when directory membership ends. |
| **INV-8** | Import cannot assign PlatformRoles; directory role allowlist is capped by actor PlatformRole. |
| **INV-9** | `archived` / `deceased` / merged aliases are invisible to non-`owner\|admin` (prefer `not_found`). |
| **INV-10** | Deceased never cascade-deletes relationships/audit; marketing suppressed; hard delete blocked while commerce/CTP links remain. |
| **INV-11** | Unique `(organizationId, external.system, external.value)`; migration preserves known program links; no Client Record deletion. |
| **INV-12** | Single `ensurePersonForClientRecord` upsert for fulfill, org-provision, and CTP bind. |
| **INV-13** | Every People HTTP route runs flag → session → slug match → org resolve → module entitlement → ACL. |
| **INV-14** | Export uses `redactPersonForActor` only — identical field rules to GET. |
| **INV-15** | People audit is append-only; no update/delete store or HTTP APIs. |
| **INV-16** | `assertPeopleAccess` does not import or call `AuthzProjector`; OpenFGA not shipped. |
| **INV-17** | `UNIVERSAL_PEOPLE` default OFF: People routes 404; fulfill hooks no-op; no entitlement auto-add; no behavior change to CX/CTP/Membership. |
| **INV-18** | Flag rollback retains People data; no automatic purge. |

Guardian corollary: household membership alone never grants access to an unrelated child — subject-specific `guardian_of` / `authorized_rep_for` required (§3.5).

---

## 26. Mandatory adversarial test matrix

Implement as `scripts/test-people-adversarial.mts` (plus ACL isolation script). All must **PASS** before enabling `UNIVERSAL_PEOPLE` outside local/dev.

| ID | Scenario | Expect |
|---|---|---|
| ADV-1 | Create/update Person with body `organizationId` for another org | Ignored/rejected; row stays in session org |
| ADV-2 | Same email in org A and org B | Two Persons; session A cannot read B’s row |
| ADV-3 | Email has `client` in A and `volunteer` in B | Roles isolated; no cross-org role bleed |
| ADV-4 | Parent household with child X; attempt read child Y (no edge) | Deny |
| ADV-5 | Guardian edge/consent/ACL `expiresAt` in the past | Deny |
| ADV-6 | Subject DOB implies adult; guardian edge still active | Deny derived guardian |
| ADV-7 | Directory membership `ended`; Membership still active | No directory editor; login still Membership-controlled |
| ADV-8 | Import CSV with `org_leader` as staff actor / PlatformRole columns | Row rejected or role capped; Membership unchanged |
| ADV-9 | GET archived person as staff (non-admin) | `not_found` |
| ADV-10 | Mark deceased; confirm links/audit retained; marketing denied; member list hidden | Retain + hide |
| ADV-11 | Merge persons from two orgs / mismatched session org | Reject |
| ADV-12 | Import attempts to set Membership role admin | Reject |
| ADV-13 | Migrate Client Record with CTP workspace ref | Person + `PersonProgramLink`; Client Record intact |
| ADV-14 | Run migration twice | One Person; stable id |
| ADV-15 | fulfill + org-provision + CTP bind retries | One Person |
| ADV-16 | Session slug A, person org B | Deny / not_found |
| ADV-17 | Call People API with valid cookie but flag OFF / without nav | 404 / no data |
| ADV-18 | Export as viewer without DOB allow | DOB absent in CSV/JSON |
| ADV-19 | Attempt PATCH/DELETE audit via store/API | Unsupported / rejected |
| ADV-20 | Contract: `acl.ts` must not import `authz-port` | Assert on source |
| ADV-21 | Flag OFF: fulfill regression + CX nav unchanged | Pass |
| ADV-22 | Write relationships; set flag OFF; confirm data remains and APIs 404 | Retain + 404 |

---

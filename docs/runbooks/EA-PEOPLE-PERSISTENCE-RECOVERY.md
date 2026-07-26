# EA People Persistence — Recovery & Monitoring Runbook (Phase 2C)

**Audience:** Platform ops / founder  
**SoR:** Supabase Postgres schema `people`  
**Flags default:** OFF (`UNIVERSAL_PEOPLE`, `UNIVERSAL_PEOPLE_PERSIST`, `UNIVERSAL_PEOPLE_MIGRATE_CLIENTS`)  
**Local cert status:** Phase 2C **CERTIFIED** on isolated Docker Supabase (2026-07-26). Production still OFF.

---

## Local cert reproduction

```bash
npx supabase start
npx supabase migration up
node scripts/run-people-phase2c-local-cert.mjs
npx supabase stop --no-backup
```

Never point the cert harness at production.

---

## Immediate disable

1. Unset / leave empty: `UNIVERSAL_PEOPLE`, `UNIVERSAL_PEOPLE_PERSIST`, `UNIVERSAL_PEOPLE_MIGRATE_CLIENTS`.  
2. Redeploy or restart so env clears.  
3. Confirm People routes 404 / guard deny.  
4. **Do not** delete Client Records or People rows as rollback (INV-18).

---

## Incident: uniqueness / deadlock spike

1. Disable People flags.  
2. Inspect `people.person_email_keys` / `people.persons` for org+email duplicates.  
3. Page on elevated `unique_violation` / deadlock metrics.  
4. Re-enable only after ADV-P-1 re-cert on an isolated project.

---

## Incident: Persist unavailable (503)

1. Check People project health, pooler, JWT expiry for `people_app`.  
2. Confirm no memory/Airtable fallback (adapter must throw).  
3. Do not point People at Simplifi `service_role`.

---

## Incident: suspected service_role access to people.*

1. Treat as **INV-29 breach**.  
2. Disable People.  
3. REVOKE ALL on `people` from `service_role` / `anon` / `authenticated`.  
4. Rotate keys; re-run ADV-P-12.  
5. Split to a dedicated Supabase project if needed (blueprint §18).

---

## Merge / import recovery

- Finalize only through `people.merge_finalize`.  
- Import replay by idempotency key.  
- Checkpoints: resume from `last_client_record_id`; never write Client Records back.

---

## Monitoring (before prod enable)

| Signal | Action |
|---|---|
| Persist 503 rate | Page; disable if sustained |
| `unique_violation` on people keys | Page; ADV-P-1 regression |
| Deadlocks on people RPCs | Retry budget; page if terminals rise |
| Pool exhaustion | Scale or split People project |
| Audit UPDATE/DELETE attempts | Alert — append-only violation |

---

## Prod enablement checklist (not done)

- [ ] Prod role/secret separation ≠ Simplifi service_role  
- [ ] PITR restore drill  
- [ ] Monitors live  
- [ ] Owner approval  
- [ ] Flags stay OFF until explicit turn-on  

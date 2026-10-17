# Amanda V3.1 — Isolated Frappe Learning setup

**Status: instructions verified against official source; runtime NOT STARTED.** Do not use production credentials, domains, client data, or Square payments.

## Exact upstream files
- https://github.com/frappe/lms/blob/develop/docker/docker-compose.yml
- https://github.com/frappe/lms/blob/develop/docker/init.sh
- https://github.com/frappe/lms/blob/develop/README.md

The official developer Compose contains MariaDB 10.8, Redis and frappe/bench, port 8000, and sets fixed development passwords `123` / `admin`. **Never expose that stock stack externally.** The upstream init script also installs `payments` but that does not authorize payment testing. GitHub repository access verified via connector, but container runtime lacks Docker and local GitHub DNS resolution.

## Local-only instructions (developer machine)
1. Install Docker Engine/Compose and Git, ensuring adequate disk and RAM.
2. Clone `frappe/lms` into a private scratch location outside EA production checkout, pin to an approved SHA.
3. Read upstream `docker/docker-compose.yml` and `docker/init.sh`. Make a development-only copy named `docker-compose.frappe.yml` **outside tracked production files**.
4. Keep services bound to loopback `127.0.0.1` and behind private network authentication if accessed remotely. Replace development passwords before exposing even a Preview. Back up local state.
5. Run from cloned upstream project: `docker compose -f docker/docker-compose.yml up -d` only on an isolated local machine; upstream binds port 8000 globally, so firewall it or override binding to `127.0.0.1:8000:8000`. Validate `http://lms.localhost:8000/lms`.
6. Create synthetic course “Wood Therapy Test” with one harmless placeholder video, PDF and quiz. Create synthetic instructor and learner accounts, not actual Amanda/students.
7. Verify server-side learner entitlement and private file URL authorization, not only navigation controls.
8. Shut down stack when tests finish and retain isolated logs/screenshots.

## Identity bridge design gate
Do **not** turn an EA session email directly into an OIDC token. A secure solution needs a trusted issuer (or proven broker), signed ID tokens with verified `iss`, `aud`, nonce, `exp`, state and single-use code, server-side session validation and user mapping. Frappe's OAuth/OIDC social-login support must be tested against that issuer. Rewriting EA core auth is outside this PoC; if it is required, stop and research CourseLit.

### Test plan
1. Authorized synthetic student can access placeholder lesson and private resources.
2. Unauthorized student gets server-side 403 from Frappe resource/course endpoints.
3. Synthetic instructor can upload video and PDF, persisted to private storage.
4. Frappe progress persists and can be read securely by EA Preview.
5. No Frappe branding visible in student shell on mobile and desktop.

All five are **NOT RUN**. No evidence screenshots may be labeled passing until executed.

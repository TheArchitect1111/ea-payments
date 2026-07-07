# Launch Changelog and Known Limitations

## Current Launch State

Status: controlled paid launch ready.

Ready:

- Simplifi capture pipeline.
- Magnifi story generation from captures.
- Amplifi share path through Consider/Magnifi links.
- Capture Records schema.
- Pulse Events schema.
- Assessment schema.
- Proposal schema.
- Revenue and delivery readiness checks.
- Client Delivery Board.
- 7-day onboarding SOP.
- Repository readiness report.

Not full public launch ready until:

- Sentry DSN is set.
- Uptime dashboard URL is set.
- Backup destination is set.
- Live payment/onboarding is confirmed manually.
- Setup key is removed.

## Known Limitations

See **`docs/SIMPLIFI-EARLY-ACCESS-TESTER-GUIDE.md`** for the full Early Access tester matrix (2026-07-07).

### Simplifi

- Large files may fail and should be retried with a smaller asset.
- Guest capture can create useful first-run experiences but signed-in portal use is better for long-term workspace history.
- Async captures may show processing before links are ready.

### Magnifi

- `/magnifi/{id}` returns 404 if the capture record is missing.
- Classic report exists, but polished PDF export is not yet a first-class server feature.
- Template quality should be reviewed across all 10 template families before public campaign scale.

### Amplifi

- Amplifi depends on the Simplifi capture pipeline; it is not a separate analysis engine.
- Native share behavior varies by device/browser.
- Social draft quality should be reviewed before broad public use.

### Access

- Consider links are intended to be public-by-link.
- Magnifi and Simplifi Guidance are public-by-link for now; do not share sensitive captures externally.
- Admin routes remain internal only.

## Operator Notes

- Use `/api/health/launch` for current readiness.
- Use `npm run launch:check` for the full command-center check.
- Use `npm run test:assessment-pathway` to verify assessment-to-proposal path.
- Use `npm run test:capture-e2e` to verify capture-to-share path.

## Next Changelog Entry Template

```text
Date:
Changed:
Why:
Routes affected:
Validation:
Manual follow-up:
```

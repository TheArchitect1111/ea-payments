# Branch Protection Checklist (protected release branch)

There is **no separate `production` branch** today. For this repo, the protected release branch is **`master`** (GitHub default). Apply settings to **`master`** until a dedicated production-branch strategy is approved.

Apply these settings in GitHub repository settings:

- Require a pull request before merging.
- Require at least 1 approval.
- Dismiss stale approvals when new commits are pushed.
- Require status checks to pass before merging.
- Set required check: `lint-build-smoke`.
- Require branches to be up to date before merging.
- Include administrators in restrictions.
- Restrict force pushes and deletions.

## Release Checklist

- CI green on PR (`lint-build-smoke`).
- Environment variables reviewed for release (Vercel Production vs Preview).
- Critical flows manually spot-checked after deploy:
  - Login and admin pages
  - Payment initialization and callback
  - Airtable/automation paths (if touched)
  - Proposal and reporting pages affected by changes

## Account-level reliability (still pending)

- Sentry DSN configured for production ([Sentry React](https://docs.sentry.io/platforms/javascript/guides/react/))
- Uptime monitors on canonical URLs ([Uptime Kuma](https://github.com/louislam/uptime-kuma))
- Backup destination documented for env/registry exports

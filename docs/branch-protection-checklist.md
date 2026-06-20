# Branch Protection Checklist (`main`)

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
- Environment variables reviewed for release.
- Critical flows manually spot-checked after deploy:
  - Login and admin pages
  - Payment initialization and callback
  - Airtable/automation paths (if touched)
  - Proposal and reporting pages affected by changes

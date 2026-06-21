# EA client portal bindings

- `ea-portal.ts` — HMAC session env keys + cookie name
- `PortalShell.tsx` — `HeaderPortalShell` tabs for `/portal/[slug]`

After chassis changes in `ea-operating-system/portal-core`:

```bash
npm run sync-chassis
npm install
```

Webhooks use `@ea/portal-chassis/webhooks` via `lib/make-webhooks.ts`.

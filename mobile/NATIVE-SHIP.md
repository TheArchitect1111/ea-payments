# Simplifi native (Expo)

Brief-first tabs match web IA: **Brief · Capture · Inbox · Settings**.

- `mobile/app/(app)/home.tsx` — Today's Brief
- `mobile/app/(app)/capture.tsx` — quick capture
- `mobile/app/(app)/workspace.tsx` — inbox / workspace list
- `mobile/app/(app)/settings.tsx` — settings

## Ship readiness

When EAS credentials and Apple/Google accounts are ready:

```bash
cd mobile
npx eas build --profile preview --platform ios
```

Web PWA (Add to Home Screen) remains the Early Access install path until TestFlight ships.

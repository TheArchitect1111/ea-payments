# Simplifi native (Expo)

Brief-first tabs match web IA: **Brief · Capture · Inbox · Settings**.

- `mobile/app/(app)/home.tsx` — Today's Brief
- `mobile/app/(app)/capture.tsx` — quick capture
- `mobile/app/(app)/workspace.tsx` — inbox / workspace list
- `mobile/app/(app)/settings.tsx` — settings + legal links
- `mobile/app/legal-accept.tsx` — first-launch EULA / privacy acceptance

## Google Play

See **[GOOGLE-PLAY-RELEASE.md](./GOOGLE-PLAY-RELEASE.md)** for AAB build, submit, Internal Testing, and rollback.

```bash
cd mobile
eas login && eas init          # once — set EXPO_PUBLIC_EAS_PROJECT_ID
npm run build:production:android
npm run submit:production:android
```

## Orb loop

Native tabs hit the same Brief / Capture / Workspace APIs as web `GlobalOrb`.
The corner Orb UI stays on web for now.

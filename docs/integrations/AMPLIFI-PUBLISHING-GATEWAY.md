# Amplifi Publishing Gateway

Amplifi now separates content creation from social-network transport.

## User experience

- Clients may use Amplifi research, content creation, approvals, and campaign planning without connecting a social account.
- A social connection is required only when publishing or scheduling to a network.
- In each client portal, **Connect social accounts** starts the gateway authorization flow.
- Clients authorize their normal social accounts. They do not need Meta, LinkedIn, TikTok, or X developer applications.

## Transport order

1. Ayrshare publishing gateway when `AYRSHARE_API_KEY` is configured and the portal has a gateway profile.
2. Existing native Amplifi provider adapters as fallback during migration.
3. Draft/approval mode when no publishing connection exists.

## Multi-tenant isolation

Ayrshare profiles are provisioned per portal slug. Profile keys are stored through the existing encrypted Amplifi connection store, so tenant publishing identities remain isolated. Existing native tokens remain encrypted and tenant-scoped.

## Required platform configuration

Set this server-side in Vercel Production and Preview:

```text
AYRSHARE_API_KEY=<EA publishing gateway API key>
```

Optional migration overrides:

```text
AYRSHARE_PROFILE_KEYS_JSON={"ea":"profile-key"}
AYRSHARE_PROFILE_KEY_EA=<profile-key>
```

Overrides are not required for new portals because Amplifi provisions a profile on first gateway connection.

## Safety rules

- Never expose the Ayrshare API key or profile keys to the browser.
- Never mark a post published unless the provider returns success.
- Partial platform failures remain visible to the client.
- Native publishing remains available as fallback until the gateway migration is certified.
- Draft mode must never create a social post.

# EA Factory — Name-to-Profile

Build #1 turns a name, URL, short note, image, or document into an evidence-backed
prospect dossier. It runs inside the existing Factory Research capability and does
not contact the prospect or publish claims.

## Launch

The existing mobile-first launcher posts to `/api/launch`. A name-only command is
valid:

```text
Launch Amanda Catherine — entrepreneur, radio personality, influencer
```

## Research flow

1. `prospect-profile` searches the public web when `BRAVE_SEARCH_API_KEY` is set.
2. Search candidates are scored against the submitted name and context.
3. The leading public pages are fetched for page and image signals.
4. A `prospect_profile` research artifact stores:
   - identity status and confidence;
   - ranked candidates and reasons;
   - citations and evidence excerpts;
   - public asset inventory;
   - coverage metrics;
   - publishing-safety rules.
5. Discovery carries the identity, citations, evidence, and assets into the
   `organization_profile` and `content_inventory` artifacts.

## Safety

- A name match is not treated as verified when evidence is ambiguous.
- Public images are marked `permission_review_required` or `reference_only`.
- Unsupported claims are not authorized.
- Name-to-Profile never enables automatic production publishing.
- Missing search configuration is explicit as `search_not_configured`; it is not
  silently treated as successful research.

## Production configuration

Set `BRAVE_SEARCH_API_KEY` in the server environment. Never expose this value to
the browser or include it in a launch request.

## Verification

```bash
npm run test:factory-research
npm run test:factory-discovery
npm run build
```

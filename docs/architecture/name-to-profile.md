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

1. `prospect-profile` uses OpenAI Responses API web search through the existing
   EA `OPENAI_API_KEY`.
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
6. Planning converts the evidence-backed profile into a `creative_direction`
   artifact shared by the public website and portal. It includes:
   - the client-specific story and audience;
   - homepage story beats;
   - photography, typography, composition, and motion direction;
   - portal continuity rules;
   - anti-patterns that block generic AI/SaaS layouts;
   - asset permissions and publishing safeguards.
7. Website production embeds that direction in the `website_site` artifact so
   later rendering and review retain the intended visual language.
8. Production emits three distinct, preview-ready `experience_concepts` covering
   both website and portal. The Factory recommends one concept automatically,
   while retaining all three for a client presentation and selection gate.

## Safety

- A name match is not treated as verified when evidence is ambiguous.
- Public images are marked `permission_review_required` or `reference_only`.
- Unsupported claims are not authorized.
- Name-to-Profile never enables automatic production publishing.
- Missing search configuration is explicit as `search_not_configured`; it is not
  silently treated as successful research.

## Production configuration

No separate search account is required. The provider reuses the server-side
`OPENAI_API_KEY` already used by the EA AI Gateway. Never expose this value to
the browser or include it in a launch request. `FACTORY_RESEARCH_MODEL` may
override the default web-search model when required.

## Verification

```bash
npm run test:factory-research
npm run test:factory-discovery
npm run build
```

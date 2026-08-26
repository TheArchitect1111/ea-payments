# EA DESIGN STUDIO v2

Design Studio is one product. Renderers, agents, libraries, and export tools remain invisible implementation details.

## 1. Mission
Produce client-ready creative on the first user-visible render. The user refines strong work; the user does not teach Studio how to design.

## 2. First-render standard
- Target: 90–95% complete.
- Creative quality floor: 9/10.
- Brand integrity floor: 9/10.
- Reference/style match floor: 9/10.
- Any hard-gate failure blocks delivery.

## 3. Artifact-first classification
Before design, classify the artifact. Never use one medium's composition rules for another.

### Promotional flyer/poster
- Exact fixed canvas, phone-first plus print variant.
- Three-second comprehension.
- One dominant visual hero.
- Event identity, date/time, price/format/location immediately visible.
- One dominant action and QR.
- High visual energy; compact copy.
- Never behave like a scrolling landing page.

### Landing page
- Narrative scroll is allowed.
- Progressive disclosure and repeated CTA.
- Hero may be editorial; supporting sections can carry context.

### Website
- Navigation, narrative, conversion journey, responsive composition.

### Portal
- Task-first UI, clear orientation, next-best action.

### Presentation
- One idea per visual beat, executive readability, consistent story arc.

## 4. Internal studio team
1. Creative Director — artifact class, direction, composition, candidate selection.
2. Brand Guardian — approved identity, assets, subject/representation rules.
3. Production — deterministic renderer and output variants.
4. Visual QA — rendered-output inspection, clipping, contrast, visual hierarchy.
5. Conversion — three-second comprehension, CTA, audience clarity.

The user never selects these agents.

## 5. Required preflight
Before a renderer runs, Studio must lock:
- audience and viewing context;
- verified facts;
- approved assets;
- visual reference signals;
- explicit non-negotiables;
- target dimensions;
- artifact contract.

## 6. Candidate loop
Studio generates three internal composition plans before user-visible rendering. Candidate plans must be structurally distinct, not minor rearrangements.

Creative Director selects one. Brand Guardian can veto. Visual QA and Conversion can send it back for revision. Maximum internal iterations are configurable, but a weak candidate must never be released merely because iterations are exhausted.

## 7. Quality ratchet
A project stores its highest accepted scores by dimension. Future work cannot regress below the stored floor.

Dimensions:
- visual impact;
- artifact fit;
- brand integrity;
- reference match;
- hierarchy;
- readability;
- conversion clarity;
- technical integrity.

## 8. Rendering philosophy
Use structured content and deterministic renderers wherever possible. AI chooses and critiques composition; it should not rewrite an entire artifact blindly on every revision.

Poster/social graphics: fixed-canvas poster schema -> deterministic React/SVG renderer -> PNG/PDF/SVG export adapter.
Web/landing/portal: structured block schema -> existing EA website/Puck renderer -> responsive preview.
Motion: Remotion.

## 9. Reference interpretation
References are design evidence, not assets to copy. Extract:
- image dominance;
- composition geometry;
- type scale and contrast;
- density;
- texture/depth;
- color behavior;
- emotional energy;
- information hierarchy.

Do not reproduce copyrighted text, logos, layouts, or artwork beyond user-owned/approved assets.

## 10. Anti-patterns
Reject:
- generic SaaS card grids for unrelated artifacts;
- beige minimalism by default;
- giant typography used to hide weak composition;
- arbitrary rounded rectangles;
- long flyer copy;
- random stock subjects that violate audience/brand context;
- images used as detached rectangles instead of integrated art direction;
- responsive webpage layouts masquerading as posters;
- deployment treated as proof of design quality;
- user-visible output before rendered visual QA.

## 11. Twin City acceptance benchmark
Twin City Kappa golf is Acceptance Test 001.

The flyer must:
- read as a promotional sports poster within three seconds;
- feature an African American golfer as dominant sports subject;
- use crimson pants, cream shirt, crimson headwear in the approved art direction;
- use Twin City/Kappa crest and subtle founders heritage;
- clearly show March 12, 8:00 AM, $85/player, 2-man teams, Winston Lake Golf Course, Winston-Salem NC;
- include a fully visible tournament QR;
- contain no invented address or invented tournament benefits;
- feel energetic enough to earn the member request for “pizzazz”;
- score >=9 on creative, brand, reference match, and artifact fit before being shown.

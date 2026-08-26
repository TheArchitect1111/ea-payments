# EA Design Studio v3 — Design-Native Architecture

## Decision
Stop using React/CSS generation as the creative engine. Code is an export target, not the art director.

## Core model
Design Studio remains the only user-facing concept. Underneath it routes work by artifact class.

### 1. Design-native canvas
Primary target: Penpot + official Penpot MCP / penpot-ai-kit workflow.
- Editable structured design files
- Design-to-design, code-to-design, design-to-code
- Tokens, components, layers, shared libraries
- Agent operates on a visual canvas rather than guessing CSS

### 2. Creative-agent layer
Evaluate/adapt Open Creative Agent patterns for brief-first orchestration.
- Research -> design reasoning -> asset generation/editing -> layout -> render -> refinement
- Specialist agents
- Canvas-based inspection
- Posters and web/UI supported

Evaluate Open AI Design Agent only as a model-routing reference, not a hard dependency. Its hosted/model ecosystem can add cost/dependency.

### 3. Poster-specific generation
Evaluate OpenDesign and PosterGen patterns.
- Separate editable text/layers from imagery
- Poster-specific layout/styling agents
- SVG/PNG/PDF/HTML export
- Do not treat a poster as a responsive webpage

### 4. Web/portal generation
Use Penpot design file as visual source of truth. Existing EA web stack implements approved design after visual acceptance.

## Required workflow
1. Intake brief
2. Classify artifact
3. Load client brand kit + approved references
4. Creative Director defines visual thesis
5. Generate 3 visually distinct compositions on design-native canvas
6. Critic compares actual rendered candidates against references and brief
7. Reject weak candidates before user visibility
8. User sees only winner at >= 90% target
9. User revisions happen on editable canvas
10. Export artifact or implement approved design in EA web stack
11. Visual regression check against approved design
12. Deploy/export

## Twin City acceptance test
The current v2 sandbox is REJECTED and must not be used as a quality reference.

A passing flyer must:
- Read as a professionally art-directed sports-event poster in under 3 seconds
- Feature an African American golfer as the dominant sports subject
- Use crimson pants, cream shirt, crimson/matching headwear in the approved art direction
- Integrate Kappa heritage/founders imagery as atmosphere, not clutter
- Preserve Kappa crimson/cream/gold identity
- Make March 12, 8:00 AM, $85/player, 2-man teams, Winston Lake Golf Course immediately legible
- Keep QR fully visible/scannable
- Contain no invented address
- Avoid webpage cards, dashboard grids, accidental overlaps, tiny legal copy, and generic template aesthetics
- Be designed at a fixed print/social canvas before any responsive adaptation

## Release gate
No artifact is labeled complete merely because it builds or deploys. Completion requires rendered visual acceptance.

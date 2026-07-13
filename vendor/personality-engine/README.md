# @ea/personality-engine

Workspace personalities for the EA Platform — tone, density, terminology, dashboard sections, and AI instructions.

## Personalities

- `executive` — EA Command Center
- `operations`
- `creative`
- `compliance` — 3HC
- `athletics` — CPR
- `financial-coaching` — ETFM
- `training-learning` — Bob Rumball

## Usage

```ts
import {
  getWorkspacePersonality,
  buildAiContextEnvelope,
} from '@ea/personality-engine';

const p = getWorkspacePersonality('athletics');
const ai = buildAiContextEnvelope('athletics', ['List overdue eligibility items']);
```

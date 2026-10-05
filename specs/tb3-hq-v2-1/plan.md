# Implementation Plan
Constitution: source/authorization/protected invariants/rollback verified.
Architecture: scoped client context with validated local preview records, separate Calendar/Eva UI, page wiring to existing storytelling sections; no new backend writes or privileged access.
Sequence: kitchen/vault/nav; calendar/store/forms; derived dashboard/pipeline; Eva context/commands/guarded chat; build/lint/types/tenant; browser flows; preview branch publication; verify deployed version.
Risk: false connectivity claims and seeded fake status. Empty initial state and browser-only persistence notice; truthful unavailable responses. Dialog keyboard/focus semantics and reserved Eva layout.

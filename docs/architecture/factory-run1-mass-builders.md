# EA Factory Run 1 — Mass-Production Builders

Date: 2026-09-12

## Objective
Extend the frozen Factory conveyor without creating another orchestration layer. Production remains WorkOrder-driven and the ProductionController remains the sole builder dispatcher.

## Builder wave
- WebsiteBuilder: existing certified builder.
- PortalBuilder: portal WorkOrders → `portal_app` + portal deliverable.
- LearningBuilder: learning WorkOrders → `learning_system` + learning deliverable.
- KnowledgeBuilder: existing content WorkOrders → `knowledge_base` + content deliverable.
- ReportBuilder: report WorkOrders → `report_pack` + report deliverable.

Every builder is wrapped by the existing mandatory Execution Contract and therefore emits execution, asset-integrity and visual-fidelity gates in addition to its structural review gate.

## Mass-production rules
1. No builder calls another builder.
2. No builder mutates prior artifacts or WorkOrders.
3. Completed WorkOrders are appended as new snapshots.
4. Planning evidence and original Discovery lineage are preserved.
5. Production can drain every registered buildable WorkOrder type, not only websites.
6. QA validates the artifact expected by each deliverable type and may auto-resolve only structural gates with complete source evidence.
7. Subjective experience approval remains human.
8. External production publication remains blocked until the existing release gates allow it.

## Acceptance
Run 1 is accepted only when Portal, Learning, Knowledge and Report builders all register, resolve by WorkOrder type, generate valid append-only artifacts, create review-ready deliverables, complete their WorkOrders, inherit mandatory Execution Contracts, pass the dedicated Run 1 certification, and leave all existing CI/security/recovery/browser checks green.

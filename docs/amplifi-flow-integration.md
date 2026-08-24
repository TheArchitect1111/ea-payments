# Amplifi FLOW Integration

Amplifi Idea Box now uses a Find, Leverage, Optimize, Win analysis before ranking content opportunities.

## FLOW stages

- Find: identify source-supported themes, audience needs, questions, proof, and missing context.
- Leverage: surface distinct content angles, formats, sequences, and repurposing opportunities.
- Optimize: sharpen each idea with a clear job, hook, audience takeaway, and next step.
- Win: rank opportunities by usefulness, specificity, source support, audience value, and readiness.

## Compatibility

The API keeps the existing `title`, `format`, `angle`, `reason`, and `campaignBrief` fields used by the Idea Box. It adds `hook`, `callToAction`, `score`, and `readiness`, plus a top-level `flowSummary`.

The selected opportunity carries its FLOW hook, reason, readiness, and call to action into the existing Amplifi campaign builder.

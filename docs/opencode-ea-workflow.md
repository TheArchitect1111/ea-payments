# OpenCode for the EA repository

OpenCode is an optional developer interface for this repository. It is not part of the client product and it is not authorized to publish or deploy EA code.

## Repository defaults

- Sessions begin in the read-only `plan` agent.
- Conversation sharing is disabled.
- External-directory access is denied.
- File edits and unapproved shell commands require confirmation.
- Destructive Git commands, file deletion, and Git pushes are denied.
- Nested subagents are disabled.
- `AGENTS.md` remains the repository instruction source.

## Model connection

Use OpenCode's `/connect` and `/models` commands to select an approved provider and model. No model is committed in this repository because availability, pricing, data handling, and model identifiers can change.

Do not treat a social-media claim that a model is “free” as approval to send EA or client data to it. Confirm the provider, retention terms, cost, and data policy first.

## EA commands

- `/ea-review <files or feature>` performs a read-only review.
- `/ea-verify <change>` runs a narrowly scoped verification without publishing or deploying.

Use the built-in `build` agent only after the requested scope is explicit and the proposed edit is approved.

# Implementation Plan
Constitution: user authorized the single test flow; changes restricted to verified Wood Therapy test metadata. Existing payment routes remain authenticated.
Architecture: dedicated unauthenticated test checkout and server verification; existing fulfillment consumes verified metadata and grants learner access, sends emails; new accounts use existing hashed password setup tokens.
Sequence: inspect, implement, targeted tests/build, isolated preview, stage production, verify both identity workflows, assign Amanda domain, verify live.
Risk: shared deployment, inaccessible environment settings, email provider delivery. Fail closed on non-test keys; no fallback to live credentials.

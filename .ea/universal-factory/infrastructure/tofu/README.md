# EA Infrastructure Factory OpenTofu Chassis

Run 5 standardizes infrastructure as declarative, versioned, reproducible code.

## Contract
- Discover existing infrastructure before creating anything.
- Classify each resource as create, adopt, or reference.
- Preserve existing resources by default.
- Keep state isolated by tenant and environment.
- Pin provider and module versions.
- Generate and retain a plan before any apply.
- Production apply requires explicit authorization and the exact approved plan hash.
- Never commit secret values. Infrastructure source contains references only.
- Never silently repoint domains, replace production resources, or mutate shared infrastructure.

## Intended structure
`projects/<tenant>/<project>/<environment>/` contains generated OpenTofu configuration derived from the approved Universal Manifest and Run 4 candidate. Reusable modules belong under the certified EA infrastructure module registry. Generated state is never stored in source control.

This chassis is deliberately provider-neutral. Vercel remains the normal delivery target for current EA web workloads; future hospital/on-prem/cloud resources can use additional pinned OpenTofu providers without changing the Universal Factory contract.

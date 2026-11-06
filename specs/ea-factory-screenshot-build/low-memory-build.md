# Opt-in local low-memory build evidence

Date: 2026-11-06. Branch: `work/ayf-chassis-20261103`; base HEAD: `24fb517900c084e9e587dc38b03ca4f4e69ea7e5`. No commit, deployment, publishing or payment actions.

## Configuration

`next.config.ts` enables `experimental.cpus: 1` and `experimental.turbopackMemoryLimit: 2 * 1024 ** 3` only when `EA_LOCAL_LOW_MEMORY_BUILD=1`, phase is `PHASE_PRODUCTION_BUILD`, and `CI`, `VERCEL`, and `VERCEL_ENV` are absent/empty. Existing configuration remains the default. Development and production serving are unchanged. The Turbopack memory value is a target, not a hard total-process cap.

For a local PowerShell build, set `$env:EA_LOCAL_LOW_MEMORY_BUILD='1'` before the existing build command. This verification used the existing safety wrapper instead, suppressing service credentials and blocking outbound Node service calls.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Configuration validation before build | PASS | Node/tsx assertions checked exact opt-in, both numeric settings, inactive development/production-server phases, CI/Vercel guards, rejection of `true` instead of `1`, and deep equality of remaining config. No build executed during validation. |
| Installed Next configuration loader | PASS | Loaded normal build config without building; existing `authInterrupts` retained. |
| Development server stopped | PASS | Preflight found no repository Next dev/server/build or existing build-launcher process before starting the one attempt. |
| Full native Turbopack build | PASS | One attempt; command `node node_modules/next/dist/bin/next build`, with explicit local flag. Started `2026-11-06T22:13:20.375Z`, finished `2026-11-06T22:15:32.031Z`, exit **0**. Compiled in **93s**; static generation **171/171**, one worker, **2.7s**. |
| Prior prerender failures | PASS on this attempt | `/studio/create` emitted as static, `/api/amanda/checkout` emitted as dynamic. No prerender or memory-allocation failure logged. Route code was not changed. This successful run does not prove the precise cause of the older filesystem errors. |
| Peak sampled Node process-tree resident RAM | RECORDED | **1,660,227,584 bytes (1.55 GiB)** aggregate working set. |
| Peak sampled Node process-tree private memory | RECORDED | **4,015,542,272 bytes (3.74 GiB)**. Includes launcher, Next and Node workers, not unrelated processes. 53 samples, nominal interval 2 seconds plus collection overhead; instantaneous peaks may be higher. |
| Patch whitespace validation | PASS | `git diff --check -- next.config.ts`. |
| Strict repository types | EXISTING FAIL, not rerun | Saved baseline remains 413 diagnostics. Existing `ignoreBuildErrors` setting is unchanged; successful packaging does not certify strict types. |
| Promotion / real AYF | BLOCKED, not attempted | Missing authentic promotion preview URL and the four previously documented AYF external dependencies remain unresolved. Local packaging is not production or real AYF verification. |

## Raw evidence

- Build log and authoritative Next exit status: `C:/Users/brick/AppData/Local/Temp/ea-factory-build-1794003200369/build.log` and `result.json`.
- Process-tree samples: `C:/Users/brick/AppData/Local/Temp/ea-low-memory-1794003199861/memory.jsonl` and `result.json`.
- The PowerShell monitor's launcher exit field is null (monitoring limitation); build success is established by the separate Node runner's `exitCode: 0`, finalized output and `.next/BUILD_ID` (`UGe-P2aSCCAnsNce0i6pD`).

Only `next.config.ts` and this evidence file were changed in this task. All prior modified/untracked files were preserved. No repeated build or unrelated test campaign was run.

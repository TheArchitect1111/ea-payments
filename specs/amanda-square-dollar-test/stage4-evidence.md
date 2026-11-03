# Stage 4 preview verification — November 3, 2026

Deployed Square implementation: 09c115cb99831131a949093750a1c2b4831ff9a8.
Vercel deployment dpl_4iCVHmLStYdHoNzqe5E5j3SZSM5q is READY.
Preview: https://ea-payments-p49y0kl3w-the-architects-projects-cc813778.vercel.app/amanda-catherine

HTTP inspection confirms Wood Therapy displays CAD $997, the original normal Square Register URL and exactly one TEST — $1 Full Workflow option. Browser opens the own-name/email form correctly. Submitted a reserved example.invalid test identity; actual UI and API both returned HTTP 503 with `Square sandbox checkout is not configured.` No provider checkout was created and no payment was attempted.

This proves at least one of SQUARE_SANDBOX_ACCESS_TOKEN or SQUARE_SANDBOX_LOCATION_ID is missing. It does not establish which one. Do not fall back to live Square credentials. Sandbox payment, email delivery and student login remain blocked pending configuration.

Restored prior middleware from 8cc2c4cf to repair the baseline unconditional pass-through. Tenant-safety checks and existing Amanda dollar tests now pass, plus the new Square tests. Production remains unchanged. Rebuild and deploy this corrective commit to preview before final certification.

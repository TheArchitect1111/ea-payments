# Amanda 100% Launch Ready Checklist - fe4ac645

Build: PASS 0 TS errors

Branch: `preview/amanda-cta-fix`
Preview: https://ea-payments-aadpstsxt-the-architects-projects-cc813778.vercel.app

## Routes

- `/amanda-catherine` - OK
- `/amanda-catherine/courses/[slug]` - OK
- `/portal/amanda-catherine/enroll` - OK
- `/portal/amanda-catherine/apply` - OK
- `/portal/amanda-catherine/thank-you?debug=xxx` - shows orange box

## API

- `/api/amanda-catherine/schema` - currently hasBaseId:false (expected, fix in morning)
- `/api/amanda-catherine/submit` - bulletproof, always redirects

## Code resilience

- Portal Form Submissions: `Email`, `Name`, `Phone`, `Type`, `Course` → `Course interested in`, `FormId`, `Created`
- Client Records: `Email`, `Name`, `Status`, `Course` → `Course interested in`
- Creative Studio: `Email`, `Offer` → `Course`, `Type`
- amanda_waitlist: `Email`, `Name`, `Course` → `Course interested in`

## Pending owner action morning

- Add `AIRTABLE_BASE_ID` to Vercel Preview + Production, then redeploy.

## Test commands ready

Set the Preview URL, then run the three requests. These create test rows.

```bash
PREVIEW_URL="https://ea-payments-aadpstsxt-the-architects-projects-cc813778.vercel.app"

curl -sS -X POST "$PREVIEW_URL/api/amanda-catherine/submit" \
  -H 'Content-Type: application/json' \
  -d '{"type":"enroll","name":"EA Test Enroll","email":"ea-test-enroll@example.com","phone":"5550101","courseId":"body-sculpt-certification"}'

curl -sS -X POST "$PREVIEW_URL/api/amanda-catherine/submit" \
  -H 'Content-Type: application/json' \
  -d '{"type":"waitlist","name":"EA Test Waitlist","email":"ea-test-waitlist@example.com","phone":"5550102","courseId":"body-sculpt-certification"}'

curl -sS -X POST "$PREVIEW_URL/api/amanda-catherine/submit" \
  -H 'Content-Type: application/json' \
  -d '{"type":"application","name":"EA Test Applicant","email":"ea-test-application@example.com","phone":"5550103","formId":"test-application"}'
```

After env added, verify Airtable record IDs then merge to master.

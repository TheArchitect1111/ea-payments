# Verified RLS checks: Subportal v1

On 2026-10-16, the connected Supabase project reported all 7 Subportal tables with RLS enabled and 13 transaction-scoped PostgreSQL checks passed. Test transactions were rolled back; no fake student/organization data persists. The tester used actual SQL \`SET LOCAL ROLE authenticated\` and temporary JWT claim subjects, not application mocks.

Tests performed:
1. Student A can only read enrollment A.
2. Student A can only read progress A.
3. Student A only sees their identity.
4. Student A cannot see organization B.
5. Owner A sees only organization A enrollments.
6. Owner A sees only organization A progress.
7. Unbound principal sees no enrollments.
8. Unbound principal sees no progress.
9. Student A cannot update student B progress.
10. One immutable student can hold entitlements in two organizations.
11. Student can update an authorized progress row.
12. That progress update does not alter another organization's course.
13. Attempted duplicate provider/payment idempotency key gets unique constraint violation.

This is not end-to-end Clerk-to-Supabase JWT proof and not payment proof. Gate 14 and the payment and email gates remain PENDING.

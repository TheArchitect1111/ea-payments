# People Supabase production credential split

Production People access requires separate credentials:

- `PEOPLE_SUPABASE_API_KEY`: Supabase publishable key (or legacy anon key) used by the Data API gateway as `apikey`.
- `PEOPLE_SUPABASE_JWT_SECRET`: server-only legacy signing secret used to mint five-minute `people_app` bearer JWTs automatically.
- `PEOPLE_SUPABASE_KEY`: legacy fallback custom `people_app` JWT; retained only for rollback while automatic short-lived tokens are verified.

Never expose the signing secret through a `NEXT_PUBLIC_` variable, client component, response body, or log.

The `UNIVERSAL_PEOPLE`, `UNIVERSAL_PEOPLE_PERSIST`, and `UNIVERSAL_PEOPLE_MIGRATE_CLIENTS` flags remain disabled until production probes and pilot testing pass.

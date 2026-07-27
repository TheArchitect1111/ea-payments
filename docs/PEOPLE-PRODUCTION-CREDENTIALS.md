# People Supabase production credential split

Production People access requires separate credentials:

- `PEOPLE_SUPABASE_API_KEY`: Supabase server-only Secret API key (`sb_secret_...`) used by the Data API gateway as `apikey`. A publishable key is insufficient for the custom `people_app` role.
- `PEOPLE_SUPABASE_JWT_SECRET`: server-only legacy signing secret used to mint five-minute `people_app` bearer JWTs automatically.
- `PEOPLE_SUPABASE_KEY`: legacy fallback custom `people_app` JWT; retained only for rollback while automatic short-lived tokens are verified.

Never expose either server credential through a `NEXT_PUBLIC_` variable, client component, response body, or log. Database requests still use the separate `people_app` bearer role so People RLS remains in force.

The `UNIVERSAL_PEOPLE`, `UNIVERSAL_PEOPLE_PERSIST`, and `UNIVERSAL_PEOPLE_MIGRATE_CLIENTS` flags remain disabled until production probes and pilot testing pass.

# People Supabase production credential split

Production People access requires separate credentials:

- `PEOPLE_SUPABASE_API_KEY`: Supabase publishable key (or legacy anon key) used by the Data API gateway as `apikey`.
- `PEOPLE_SUPABASE_KEY`: custom `people_app` JWT used as the `Authorization: Bearer` credential.

The `UNIVERSAL_PEOPLE`, `UNIVERSAL_PEOPLE_PERSIST`, and `UNIVERSAL_PEOPLE_MIGRATE_CLIENTS` flags remain disabled until production probes and pilot testing pass.

# CreatorChat Step 249.5.29 — Production Hardening

This release keeps the single `api/[...path].js` catch-all and additionally provides explicit Vercel routes for `/api/health/app` and `/api/health/db`, preventing edge-level misses observed in production.

## Fixes
- Explicit Vercel health routes.
- `/api/health/app` is independent of PostgreSQL; `/api/health/db` is the DB probe.
- Fixed `chat-sync` variable shadowing that caused a runtime 500 when charging paid chat messages.
- `chat-sync` now reads creator chat pricing from `creator_profiles`.
- `chat-sync` is idempotent for an already-saved message ID and updates chat activity.
- Gift wallet spends are serialized per fan to prevent concurrent overspending.
- Post unlock now locks the post row to prevent concurrent double-unlock races.
- Malformed session cookies no longer cause a server error.
- Admin fan updates validate email/mobile and never attempt to write NULL into NOT NULL user fields.
- Release/version/readiness metadata updated to 249.5.29.

## Deployment requirement
The application still requires the production environment variables documented in `.env.example`; this release does not add or expose secrets and does not create a database provider automatically.

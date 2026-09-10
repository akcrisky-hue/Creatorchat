# CreatorChat Step 249.5.28 — Vercel Catch-All Routing Fix

This release hardens `api/[...path].js` route resolution for Vercel Node runtimes.

The dispatcher now accepts catch-all values exposed as `health/db`, `/health/db`, `api/health/db`, `/api/health/db`, or an array of segments, and validates the normalized path against the registered route map before dispatch. It also checks the request URL and Vercel routing headers as fallbacks.

No database credentials or secrets are included.

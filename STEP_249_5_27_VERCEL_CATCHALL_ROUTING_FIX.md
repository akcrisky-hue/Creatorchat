# CreatorChat Step 249.5.27 — Vercel Catch-All Routing Fix

## Issue
Production deployment contained `api/[...path].js` and all route registrations, but API URLs returned 404.

## Fix
`api/[...path].js` now resolves the catch-all path in this order:
1. Vercel `req.query.path` catch-all parameter (authoritative).
2. `req.url`.
3. `x-invoke-path`.
4. `x-matched-path`.

Placeholder catch-all values such as `/api/[...path]` are ignored. Trailing slashes are normalized.

This preserves the single API catch-all rule and does not add any alternate catch-all file.

## Release
Version: `249.5.27`

## Important
This is a routing fix only. PostgreSQL/Razorpay/R2 production credentials are not included or changed.

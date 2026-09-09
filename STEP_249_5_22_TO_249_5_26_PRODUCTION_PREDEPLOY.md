# CreatorChat 249.5.22–249.5.26 Pre-Deployment Bundle

## 249.5.22 — R2 production readiness
- Private R2 bucket expected.
- Direct browser upload requires CORS allowing only the production origin.
- Added `backend/storage/r2-cors.example.json`.
- Presigned PUT/GET URLs remain short-lived.

## 249.5.23 — PostgreSQL migration readiness
- Added `backend/db/migrate-production.mjs`.
- Migration uses the idempotent `backend/db/schema.sql`.
- Run with production `DATABASE_URL`, then run `verify-schema.mjs`.

## 249.5.24 — LIVE Razorpay readiness
- Existing server verification requires signature validation and provider-side payment lookup.
- Production must use `rzp_live_...` credentials.
- Never commit Razorpay secrets.

## 249.5.25 — Security/config readiness
- Deployment verifier requires DB, session, admin, Razorpay and R2 settings.
- Session secret must be at least 32 characters.
- Database URL must require SSL.
- APP_ORIGIN, when supplied, must be HTTPS.

## 249.5.26 — Final release candidate
- Added `backend/db/verify-production-readiness.mjs`.
- Release version is 249.5.26.
- No GitHub push or Vercel deployment is performed by this bundle.

## Live blockers
Actual production DB migration, R2 upload/download, and LIVE Razorpay payment cannot be truthfully marked PASS until real production credentials/accounts are available. These are runtime checks, not static-code checks.

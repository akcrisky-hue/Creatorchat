# CreatorChat Step 249.5.16 — Production DB Migration & Verification

## Completed in this package
- Production schema source is `backend/db/schema.sql`.
- Schema is idempotent for the current CreatorChat tables/columns/indexes.
- Added `backend/db/verify-schema.mjs` to verify required production tables, columns, and indexes after migration.
- Updated `backend/API_MANIFEST.json` version to `249.5.15` to match the final package.

## Production action required
This environment does not have the production PostgreSQL credentials, so the actual production database was **not modified**.

After setting `DATABASE_URL`, apply `backend/db/schema.sql` once, then run:

`node backend/db/verify-schema.mjs`

Expected result: JSON with `ok: true` and the checked table/column/index counts.

Do not delete or recreate existing production data. The schema uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and guarded column additions for the current migration path.

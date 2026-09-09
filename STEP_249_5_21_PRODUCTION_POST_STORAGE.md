# CreatorChat Step 249.5.21 — Production Post Storage

Post media now uses Cloudflare R2 (S3-compatible object storage) with direct browser uploads through short-lived presigned PUT URLs. PostgreSQL stores media metadata and the storage key; authorized readers receive short-lived presigned GET URLs.

Required production environment variables:
- R2_ACCOUNT_ID
- R2_BUCKET
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY

Limits: images up to 25 MB; videos up to 500 MB. Allowed types: JPEG, PNG, WebP, GIF, MP4, WebM, MOV.

The app does not embed large media files in PostgreSQL. Upload URLs expire after 10 minutes and download URLs after 5 minutes. Media keys are creator-scoped and authorization is checked before presigning downloads. Removed/archived post media is deleted from R2 on a best-effort basis.

Production setup also requires R2 bucket CORS allowing PUT from APP_ORIGIN with Content-Type and allowing GET from the deployed app. Do not commit R2 credentials.

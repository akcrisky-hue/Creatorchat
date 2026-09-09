# CreatorChat Step 249.5.6 — Server-Backed Posts & Content

## Completed
- Extended `posts` with title, access type, price, subscription plan, blur and media metadata.
- Added `post_unlocks` with a unique `(post_id, fan_id)` guard.
- Creator/admin post create, draft, publish, edit and archive operations are server-backed.
- Fan post reads are server-authoritative. Locked post content is withheld by the API.
- Paid post unlocks debit the fan wallet and credit the creator in one database transaction.
- Subscription post access is checked against an active server subscription and does not create a permanent unlock, so access expires correctly with the subscription.
- Existing local/demo fallback remains for offline/file-mode behavior.
- Root and `frontend/index.html` remain synchronized.
- Only `api/[...path].js` remains as the API catch-all.

## Important limitation
The current post UI stores media **metadata** (file name/type/size) on the server; actual photo/video binary upload storage is not introduced in this step.

## Validation
- Backend posts module syntax: PASS
- Frontend inline JavaScript syntax: PASS
- Root/frontend HTML synchronized: PASS
- API catch-all count: 1
- Duplicate HTML IDs: 0
- ZIP integrity: PASS
- No GitHub push or Vercel deployment.

# CreatorChat 249.5.43 — Renown-inspired consolidated feature release

This release folds the useful, non-duplicative product concepts reviewed from RenownApp into CreatorChat in one consolidated update.

## Added
- Live event scheduling/management: free, paid, subscription access, schedule, status, optional stream URL.
- 1-to-1/custom interaction requests: fan request creation, amount, due date, and admin status workflow.
- Digital products/services: creator/admin publishing, category, price, description, delivery reference, fan wallet purchase with idempotent purchase protection.
- Brand collaboration records: brand, campaign, brief, budget, deliverables, due date, status workflow.
- Moderation reports: target, reason, details, admin review/resolution status.
- Refund requests: reference, amount, reason, admin workflow; completed refunds credit the requester wallet once using a unique refund reference.
- Fan/admin navigation and dashboard entry points for the new modules.
- Server-backed PostgreSQL schema and `/api/features` endpoint.

## Production safeguards
- Server role/session authorization for all feature APIs.
- Same-origin protection for mutations.
- Rate limiting.
- Parameterized SQL.
- Wallet balance locked/rechecked during digital-product purchase.
- Refund credit idempotency constraint.
- Root and frontend HTML kept byte-identical.
- Exactly one Vercel API catch-all.
- No legacy demo fan/support placeholders or dangerous DOM APIs detected in audit scan.

## Important scope
Live streaming includes the event/data/control layer; an actual video transport provider (WebRTC/RTMP/live vendor) still needs to be connected before real video broadcasting is advertised. Brand collaboration and 1-to-1 requests are workflow/data features; external brand onboarding, settlement, and escrow are not fabricated.

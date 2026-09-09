# CreatorChat Step 249.5.17 — Razorpay LIVE Payment Hardening

## Goal
Finalise the wallet recharge payment path for production without exposing secrets or trusting browser-only payment data.

## Changes
- `/api/payments/verify` now performs Razorpay server-side payment lookup after signature validation.
- Verification requires the provider payment to:
  - belong to the submitted Razorpay order;
  - use INR;
  - have `captured` status;
  - have an amount exactly matching the server-created order.
- Existing order ownership, allowed recharge range, idempotency and wallet-credit uniqueness remain enforced.
- Added `backend/db/verify-production-config.mjs` to report whether required production environment variables are configured without printing their values.
- No real credentials are bundled.

## Production checklist
1. Set `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` in the deployment environment.
2. Use Razorpay LIVE keys only for production.
3. Keep `APP_ORIGIN` set to the exact HTTPS production origin when same-origin protection is enabled.
4. If UPI account validation is used, also set `RAZORPAYX_SOURCE_ACCOUNT_NUMBER`.
5. Run `node backend/db/verify-production-config.mjs` in the deployment environment.
6. Perform one small real/test-mode recharge in the appropriate Razorpay environment and verify that the wallet is credited exactly once.

## Important
This package does not deploy, push GitHub, or run a real Razorpay charge. Actual provider/database smoke testing requires the production environment and its credentials.

# CreatorChat Vercel deployment fix 249.4.4

The Hobby deployment was failing after `Build Completed` during `Deploying outputs...`.

Root cause found in the deployed source: the project exposed 23 Node.js functions under the top-level `api/` directory. Vercel's current runtime documentation states that non-framework projects on the Hobby plan are limited to 12 Vercel Functions per deployment.

This build keeps the existing API handlers under `backend/api/` and exposes them through one catch-all Vercel Function at `api/[[...path]].mjs`. The catch-all dispatches the original `/api/...` path to the existing handler, preserving the API surface while reducing the deployed function count from 23 to 1.

No database or billing logic was removed. The existing backend handlers, including authoritative chat wallet billing, remain intact.

# CreatorChat v249.5.44 — Creator Fan Link + Direct Chat

## Changes
- Admin Creator Profile now provides both **Copy Fan Link** and **Share Link**.
- Share Link uses the native device share sheet when available and falls back to copy.
- Public creator entry remains Fan-only.
- Fan signup/login from a creator-specific public URL now attempts to create/reuse the authenticated server-side chat for that exact creator.
- After successful authentication, the fan is routed directly to the Chat page instead of stopping at the generic profile page.
- Existing server-side chat authorization remains authoritative; no fan password/OTP is exposed to admin/creator.
- Root and frontend HTML remain byte-identical.

## Public URL format
`/?creator=<creator-slug>`

The creator slug is derived from the creator's public display name by the existing public creator endpoint.

## Audit
- Root/frontend identical: PASS
- HTML IDs unique: PASS (483/483)
- Inline JS syntax: PASS
- Backend MJS syntax: PASS
- Exactly one Vercel catch-all: PASS
- No `[[...path]].js`: PASS
- No eval/new Function/document.write/insertAdjacentHTML/javascript: PASS

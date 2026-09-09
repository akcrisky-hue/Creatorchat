# CreatorChat STEP 249.5.7 — Server-Backed Gifts

- Gift catalog stored per creator in PostgreSQL.
- Admin/creator add, edit, hide/show gifts server-side.
- Fan receives active gifts from `/api/gifts`.
- Sending a gift uses a transaction: fan wallet debit + creator wallet credit + gift transaction.
- Server-authoritative wallet balance and active gift price.
- LocalStorage is fallback only for file/offline/demo mode.
- No GitHub push or Vercel deploy.

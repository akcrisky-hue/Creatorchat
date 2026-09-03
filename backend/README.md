# CreatorChat backend — Step 247

Vercel serverless API + PostgreSQL foundation.

Implemented routes:
- auth: login, logout, session
- users: me
- chats: list/create
- messages: list/create
- chat-sync: authenticated batch sync/ack/cursor
- payments: Razorpay order/verification
- upi: RazorpayX VPA validation
- posts: list/create/update/archive
- subscriptions: list/create/update/cancel
- notifications: list/read/read-all
- health: database health check

Required environment variables remain documented in `.env.example`.

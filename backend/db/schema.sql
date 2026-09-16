BEGIN;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin','creator','fan')),
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  mobile TEXT NOT NULL DEFAULT '',
  support_email TEXT NOT NULL DEFAULT '',
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','suspended','deleted')),
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_role_status_idx ON users(role,status);

CREATE TABLE IF NOT EXISTS creator_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  chat_price_paise INTEGER NOT NULL DEFAULT 0 CHECK (chat_price_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS fans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  fan_id TEXT NOT NULL REFERENCES users(id),
  creator_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fan_id, creator_id),
  CHECK (fan_id <> creator_id)
);
CREATE INDEX IF NOT EXISTS chats_fan_updated_idx ON chats(fan_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS chats_creator_updated_idx ON chats(creator_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','delivered','read','deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_chat_created_idx ON messages(chat_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('credit','debit','refund','adjustment')),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  reference_type TEXT NOT NULL DEFAULT '',
  reference_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wallet_tx_user_created_idx ON wallet_transactions(user_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS wallet_payment_credit_ref_uq ON wallet_transactions(reference_type,reference_id,type) WHERE reference_type='payment_order' AND type='credit';
CREATE UNIQUE INDEX IF NOT EXISTS wallet_chat_message_ref_uq ON wallet_transactions(reference_type,reference_id,type) WHERE reference_type='chat_message';

CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  provider_order_id TEXT UNIQUE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed','cancelled')),
  provider_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_orders_user_idx ON payment_orders(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_provider_payment_id_uq ON payment_orders(provider_payment_id) WHERE provider_payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months BETWEEN 1 AND 120),
  price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscription_plans_creator_idx ON subscription_plans(creator_id,active,updated_at DESC);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  fan_id TEXT NOT NULL REFERENCES users(id),
  creator_id TEXT NOT NULL REFERENCES users(id),
  plan_id TEXT REFERENCES subscription_plans(id),
  amount_paise INTEGER NOT NULL DEFAULT 0 CHECK (amount_paise >= 0),
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(fan_id,creator_id)
);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES subscription_plans(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS amount_paise INTEGER NOT NULL DEFAULT 0 CHECK (amount_paise >= 0);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS support_email TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS subscriptions_fan_status_idx ON subscriptions(fan_id,status,expires_at);
CREATE INDEX IF NOT EXISTS subscriptions_creator_status_idx ON subscriptions(creator_id,status,expires_at);
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  access_type TEXT NOT NULL DEFAULT 'paid' CHECK (access_type IN ('free','paid','subscription')),
  price_paise INTEGER NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
  plan_id TEXT REFERENCES subscription_plans(id),
  blur INTEGER NOT NULL DEFAULT 12 CHECK (blur BETWEEN 0 AND 30),
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived','removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS access_type TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS price_paise INTEGER NOT NULL DEFAULT 0 CHECK (price_paise >= 0);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES subscription_plans(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS blur INTEGER NOT NULL DEFAULT 12 CHECK (blur BETWEEN 0 AND 30);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS posts_creator_created_idx ON posts(creator_id,created_at DESC);
CREATE INDEX IF NOT EXISTS posts_creator_status_idx ON posts(creator_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS post_unlocks (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  fan_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL DEFAULT 0 CHECK (amount_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id,fan_id)
);
CREATE INDEX IF NOT EXISTS post_unlocks_fan_idx ON post_unlocks(fan_id,created_at DESC);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications(user_id,created_at DESC);


CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT '',
  target_id TEXT NOT NULL DEFAULT '',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx ON admin_audit_log(target_type,target_id,created_at DESC);



CREATE TABLE IF NOT EXISTS live_streams (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free','paid','subscription')),
  price_paise INTEGER NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended','cancelled')),
  stream_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS live_streams_creator_status_idx ON live_streams(creator_id,status,scheduled_at DESC);

CREATE TABLE IF NOT EXISTS interaction_requests (
  id TEXT PRIMARY KEY,
  fan_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'one_to_one' CHECK (type IN ('one_to_one','custom_request')),
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  amount_paise INTEGER NOT NULL DEFAULT 0 CHECK (amount_paise >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','in_progress','completed','cancelled','rejected')),
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS interaction_requests_fan_idx ON interaction_requests(fan_id,created_at DESC);
CREATE INDEX IF NOT EXISTS interaction_requests_creator_idx ON interaction_requests(creator_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS digital_products (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'digital',
  price_paise INTEGER NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
  delivery_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS digital_products_creator_idx ON digital_products(creator_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS product_purchases (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  fan_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','refunded','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_purchases_fan_idx ON product_purchases(fan_id,created_at DESC);
CREATE INDEX IF NOT EXISTS product_purchases_product_fan_status_idx ON product_purchases(product_id,fan_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS collaborations (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  title TEXT NOT NULL,
  brief TEXT NOT NULL DEFAULT '',
  budget_paise INTEGER NOT NULL DEFAULT 0 CHECK (budget_paise >= 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','applied','accepted','in_progress','submitted','completed','cancelled')),
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS collaborations_creator_idx ON collaborations(creator_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS moderation_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  resolution TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS moderation_reports_status_idx ON moderation_reports(status,created_at DESC);

CREATE TABLE IF NOT EXISTS refund_requests (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','refunded')),
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refund_requests_status_idx ON refund_requests(status,created_at DESC);
CREATE INDEX IF NOT EXISTS refund_requests_requester_idx ON refund_requests(requester_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS wallet_refund_request_ref_uq ON wallet_transactions(reference_type,reference_id,type) WHERE reference_type='refund_request' AND type='refund';

ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS profile_pic_url TEXT NOT NULL DEFAULT '';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS cover_url TEXT NOT NULL DEFAULT '';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS public_email TEXT NOT NULL DEFAULT '';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS profile_pic_key TEXT NOT NULL DEFAULT '';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS cover_key TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS live_access (
  id TEXT PRIMARY KEY, live_id TEXT NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  fan_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL DEFAULT 0 CHECK(amount_paise>=0),
  status TEXT NOT NULL DEFAULT 'paid' CHECK(status IN ('paid','refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(live_id,fan_id)
);
CREATE INDEX IF NOT EXISTS live_access_fan_idx ON live_access(fan_id,created_at DESC);
CREATE TABLE IF NOT EXISTS creator_earnings (
  id TEXT PRIMARY KEY, creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, source_id TEXT NOT NULL, gross_paise INTEGER NOT NULL CHECK(gross_paise>=0),
  fee_paise INTEGER NOT NULL DEFAULT 0 CHECK(fee_paise>=0), net_paise INTEGER NOT NULL CHECK(net_paise>=0),
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('pending','available','paid','reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(source_type,source_id)
);
CREATE INDEX IF NOT EXISTS creator_earnings_creator_idx ON creator_earnings(creator_id,created_at DESC);

COMMIT;

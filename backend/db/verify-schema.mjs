import pg from 'pg';

const { Client } = pg;
const requiredTables = [
  'users','creator_profiles','fans','chats','messages','wallet_transactions',
  'payment_orders','subscription_plans','subscriptions','posts','post_unlocks','notifications','admin_audit_log','live_streams','interaction_requests','digital_products','product_purchases','collaborations','moderation_reports','refund_requests','live_access','creator_earnings'
];
const requiredColumns = {
  users: ['support_email','preferences'],
  subscriptions: ['plan_id','amount_paise','expires_at'],
  posts: ['title','access_type','price_paise','plan_id','blur','media'],
  creator_profiles: ['profile_pic_url','cover_url','public_email','profile_pic_key','cover_key']
};
const requiredIndexes = [
  'users_role_status_idx','wallet_tx_user_created_idx','payment_orders_user_idx',
  'subscription_plans_creator_idx','subscriptions_fan_status_idx',
  'subscriptions_creator_status_idx','posts_creator_created_idx','posts_creator_status_idx',
  'post_unlocks_fan_idx','notifications_user_created_idx','admin_audit_log_created_idx','live_streams_creator_status_idx','interaction_requests_creator_idx','interaction_requests_fan_idx','digital_products_creator_idx','product_purchases_fan_idx','collaborations_creator_idx','moderation_reports_status_idx','refund_requests_status_idx','wallet_refund_request_ref_uq','live_access_fan_idx','creator_earnings_creator_idx'
];

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(2);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  const tables = new Set((await client.query(`SELECT tablename FROM pg_tables WHERE schemaname='public'`)).rows.map(r => r.tablename));
  const missingTables = requiredTables.filter(t => !tables.has(t));
  const missingColumns = [];
  for (const [table, cols] of Object.entries(requiredColumns)) {
    const rows = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`, [table]);
    const present = new Set(rows.rows.map(r => r.column_name));
    for (const col of cols) if (!present.has(col)) missingColumns.push(`${table}.${col}`);
  }
  const indexes = new Set((await client.query(`SELECT indexname FROM pg_indexes WHERE schemaname='public'`)).rows.map(r => r.indexname));
  const missingIndexes = requiredIndexes.filter(i => !indexes.has(i));
  if (missingTables.length || missingColumns.length || missingIndexes.length) {
    console.error(JSON.stringify({ ok:false, missingTables, missingColumns, missingIndexes }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok:true, checkedTables:requiredTables.length, checkedColumns:Object.values(requiredColumns).flat().length, checkedIndexes:requiredIndexes.length }, null, 2));
} finally {
  await client.end().catch(() => {});
}

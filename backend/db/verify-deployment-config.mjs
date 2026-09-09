const required = ['DATABASE_URL','SESSION_SECRET','ADMIN_EMAIL','ADMIN_PASSWORD','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY'];
const optional = ['RAZORPAYX_SOURCE_ACCOUNT_NUMBER','APP_ORIGIN'];
const value = k => String(process.env[k] || '').trim();
const looksPlaceholder = v => /^(replace|your-|example|USER:|PASSWORD:|HOST:|DBNAME|rzp_test_replace_me|replace_me)/i.test(v) || /your-domain\.example/i.test(v);
const checks = [];
for (const key of required) checks.push({ key, configured: Boolean(value(key)), placeholder: looksPlaceholder(value(key)) });
const origin = value('APP_ORIGIN');
const dbUrl = value('DATABASE_URL');
const session = value('SESSION_SECRET');
const adminEmail = value('ADMIN_EMAIL');
const adminPassword = value('ADMIN_PASSWORD');
const razorpayId = value('RAZORPAY_KEY_ID');
checks.push({ key:'SESSION_SECRET_MIN_LENGTH', ok: session.length >= 32 });
checks.push({ key:'DATABASE_SSLMODE_REQUIRE', ok: !dbUrl || /[?&]sslmode=require\b/i.test(dbUrl) });
checks.push({ key:'APP_ORIGIN_HTTPS', ok: !origin || /^https:\/\//i.test(origin) });
checks.push({ key:'ADMIN_PASSWORD_NOT_EMAIL', ok: !adminEmail || !adminPassword || adminPassword.toLowerCase() !== adminEmail.toLowerCase() });
checks.push({ key:'RAZORPAY_KEY_MODE', ok: !razorpayId || /^rzp_live_/i.test(razorpayId), note:'Production deployment must use an rzp_live_ key.' });
const badRequired = checks.filter(x => x.key && required.includes(x.key) && (!x.configured || x.placeholder));
const badChecks = checks.filter(x => x.ok === false);
const report = {
  required: checks.filter(x => required.includes(x.key)).map(x => ({key:x.key, configured:x.configured, placeholder:x.placeholder})),
  optional: optional.map(key => ({key, configured:Boolean(value(key))})),
  checks: checks.filter(x => x.ok !== undefined),
  ok: badRequired.length === 0 && badChecks.length === 0,
  warnings: razorpayId && /^rzp_test_/i.test(razorpayId) ? ['RAZORPAY_KEY_ID is a test key; do not use it for production.'] : []
};
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 2;

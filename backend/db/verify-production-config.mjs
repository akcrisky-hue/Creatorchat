const required=['DATABASE_URL','SESSION_SECRET','ADMIN_EMAIL','ADMIN_PASSWORD','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY'];
const optional=['RAZORPAYX_SOURCE_ACCOUNT_NUMBER','APP_ORIGIN'];
const missing=required.filter(k=>!process.env[k]||/replace-with|replace_me|replace-with-a-long|USER:|PASSWORD:|HOST:|DBNAME|your-domain\.example/i.test(String(process.env[k])));
const report={required:required.map(k=>({key:k,configured:Boolean(process.env[k])})),optional:optional.map(k=>({key:k,configured:Boolean(process.env[k])})),ok:missing.length===0,missing};
console.log(JSON.stringify(report,null,2));
if(missing.length)process.exitCode=2;

import { db, json, body, requireSession, requestId, rateLimit, requireSameOrigin, id } from '../../lib.mjs';

async function ensureSchema(){
  await db().query(`CREATE TABLE IF NOT EXISTS live_streams (id TEXT PRIMARY KEY,creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',access_type TEXT NOT NULL DEFAULT 'free' CHECK(access_type IN ('free','paid','subscription')),price_paise INTEGER NOT NULL DEFAULT 0 CHECK(price_paise>=0),scheduled_at TIMESTAMPTZ,started_at TIMESTAMPTZ,ended_at TIMESTAMPTZ,status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','live','ended','cancelled')),stream_url TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS interaction_requests (id TEXT PRIMARY KEY,fan_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,type TEXT NOT NULL DEFAULT 'one_to_one',title TEXT NOT NULL,details TEXT NOT NULL DEFAULT '',amount_paise INTEGER NOT NULL DEFAULT 0 CHECK(amount_paise>=0),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','in_progress','completed','cancelled','rejected')),due_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS digital_products (id TEXT PRIMARY KEY,creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',category TEXT NOT NULL DEFAULT 'digital',price_paise INTEGER NOT NULL DEFAULT 0 CHECK(price_paise>=0),delivery_url TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published','archived')),created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS product_purchases (id TEXT PRIMARY KEY,product_id TEXT NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,fan_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,amount_paise INTEGER NOT NULL CHECK(amount_paise>=0),status TEXT NOT NULL DEFAULT 'paid' CHECK(status IN ('paid','refunded','cancelled')),created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE product_purchases DROP CONSTRAINT IF EXISTS product_purchases_product_id_fan_id_key;
CREATE TABLE IF NOT EXISTS collaborations (id TEXT PRIMARY KEY,creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,brand_name TEXT NOT NULL,title TEXT NOT NULL,brief TEXT NOT NULL DEFAULT '',budget_paise INTEGER NOT NULL DEFAULT 0 CHECK(budget_paise>=0),status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','applied','accepted','in_progress','submitted','completed','cancelled')),deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,due_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS moderation_reports (id TEXT PRIMARY KEY,reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,target_type TEXT NOT NULL,target_id TEXT NOT NULL,reason TEXT NOT NULL,details TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewing','resolved','dismissed')),resolution TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS refund_requests (id TEXT PRIMARY KEY,requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,reference_type TEXT NOT NULL,reference_id TEXT NOT NULL,amount_paise INTEGER NOT NULL CHECK(amount_paise>0),reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','refunded')),admin_note TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());\nCREATE TABLE IF NOT EXISTS live_access (id TEXT PRIMARY KEY,live_id TEXT NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,fan_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,amount_paise INTEGER NOT NULL DEFAULT 0 CHECK(amount_paise>=0),status TEXT NOT NULL DEFAULT 'paid' CHECK(status IN ('paid','refunded')),created_at TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE(live_id,fan_id));
CREATE TABLE IF NOT EXISTS creator_earnings (id TEXT PRIMARY KEY,creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,source_type TEXT NOT NULL,source_id TEXT NOT NULL,gross_paise INTEGER NOT NULL CHECK(gross_paise>=0),fee_paise INTEGER NOT NULL DEFAULT 0 CHECK(fee_paise>=0),net_paise INTEGER NOT NULL CHECK(net_paise>=0),status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('pending','available','paid','reversed')),created_at TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE(source_type,source_id));`);
  await db().query('CREATE INDEX IF NOT EXISTS live_streams_creator_idx ON live_streams(creator_id,status,scheduled_at DESC)');
  await db().query('CREATE INDEX IF NOT EXISTS interaction_requests_creator_idx ON interaction_requests(creator_id,status,created_at DESC)');
  await db().query('CREATE INDEX IF NOT EXISTS interaction_requests_fan_idx ON interaction_requests(fan_id,created_at DESC)');
  await db().query('CREATE INDEX IF NOT EXISTS digital_products_creator_idx ON digital_products(creator_id,status,created_at DESC)');
  await db().query('CREATE INDEX IF NOT EXISTS product_purchases_fan_idx ON product_purchases(fan_id,created_at DESC); CREATE INDEX IF NOT EXISTS product_purchases_product_fan_status_idx ON product_purchases(product_id,fan_id,status,created_at DESC)');
  await db().query('CREATE INDEX IF NOT EXISTS collaborations_creator_idx ON collaborations(creator_id,status,created_at DESC)');
  await db().query('CREATE INDEX IF NOT EXISTS moderation_reports_status_idx ON moderation_reports(status,created_at DESC)');
  await db().query('CREATE INDEX IF NOT EXISTS refund_requests_status_idx ON refund_requests(status,created_at DESC)');
  await db().query('CREATE INDEX IF NOT EXISTS live_access_fan_idx ON live_access(fan_id,created_at DESC)');
  await db().query('CREATE INDEX IF NOT EXISTS creator_earnings_creator_idx ON creator_earnings(creator_id,created_at DESC)');
  await db().query("CREATE UNIQUE INDEX IF NOT EXISTS wallet_refund_request_ref_uq ON wallet_transactions(reference_type,reference_id,type) WHERE reference_type='refund_request' AND type='refund'");
}
const str=(v,n=500)=>String(v??'').trim().slice(0,n);
const money=(v)=>{const n=Number(v);return Number.isFinite(n)&&n>=0?Math.round(n*100):0};

export default async function handler(req,res){
 const rid=requestId(req);
 try{
  const s=requireSession(req,res,['admin','creator','fan'],rid); if(!s)return;
  if(!rateLimit(req,'features',60,60000))return json(res,429,{error:'Too many requests'},rid);
  if(['POST','PATCH','DELETE'].includes(req.method)&&!requireSameOrigin(req,res,rid))return;
  await ensureSchema();
  const q=req.query||{}; const feature=str(q.feature,40).toLowerCase();
  if(!['live','request','product','collaboration','report','refund'].includes(feature))return json(res,400,{error:'Invalid feature'},rid);

  if(req.method==='GET'){
   if(feature==='live' && String(q.action||'').toLowerCase()==='access'){
    if(s.role!=='fan')return json(res,403,{error:'Fan access required'},rid);
    const liveId=str(q.liveId,160); if(!liveId)return json(res,400,{error:'Live event is required'},rid);
    const r=await db().query("SELECT l.*,CASE WHEN l.access_type='free' THEN true WHEN l.access_type='subscription' THEN EXISTS(SELECT 1 FROM subscriptions s2 WHERE s2.fan_id=$2 AND s2.creator_id=l.creator_id AND s2.status='active' AND (s2.expires_at IS NULL OR s2.expires_at>now())) ELSE EXISTS(SELECT 1 FROM live_access a WHERE a.live_id=l.id AND a.fan_id=$2 AND a.status='paid') END has_access FROM live_streams l WHERE l.id=$1 AND l.status IN ('scheduled','live')",[liveId,s.id]);
    if(!r.rowCount)return json(res,404,{error:'Live event not found'},rid); return json(res,200,{access:!!r.rows[0].has_access,streamUrl:r.rows[0].has_access?r.rows[0].stream_url:'',event:r.rows[0]},rid);
   }
   if(feature==='live'){
    const r=await db().query(`SELECT l.*,u.name creator_name FROM live_streams l JOIN users u ON u.id=l.creator_id WHERE l.status<>'cancelled' AND ($1='admin' OR l.creator_id=$2 OR l.status='live') ORDER BY COALESCE(l.scheduled_at,l.created_at) DESC LIMIT 100`,[s.role,s.id]);
    return json(res,200,{items:r.rows},rid);
   }
   if(feature==='request'){
    const r=await db().query(`SELECT r.*,f.name fan_name,c.name creator_name FROM interaction_requests r JOIN users f ON f.id=r.fan_id JOIN users c ON c.id=r.creator_id WHERE ($1='admin' OR r.fan_id=$2 OR r.creator_id=$2) ORDER BY r.created_at DESC LIMIT 100`,[s.role,s.id]);
    return json(res,200,{items:r.rows},rid);
   }
   if(feature==='product'){
    const r=await db().query(`SELECT p.id,p.creator_id,p.title,p.description,p.category,p.price_paise,p.status,p.created_at,p.updated_at,u.name creator_name,(SELECT COUNT(*) FROM product_purchases pp WHERE pp.product_id=p.id AND pp.status='paid') purchases,CASE WHEN $1 IN ('admin','creator') OR EXISTS(SELECT 1 FROM product_purchases px WHERE px.product_id=p.id AND px.fan_id=$2 AND px.status='paid') THEN p.delivery_url ELSE '' END delivery_url FROM digital_products p JOIN users u ON u.id=p.creator_id WHERE ($1='admin' OR p.creator_id=$2 OR p.status='published') ORDER BY p.created_at DESC LIMIT 100`,[s.role,s.id]);
    return json(res,200,{items:r.rows},rid);
   }
   if(feature==='collaboration'){
    const r=await db().query(`SELECT * FROM collaborations WHERE $1='admin' OR creator_id=$2 ORDER BY created_at DESC LIMIT 100`,[s.role,s.id]);
    return json(res,200,{items:r.rows},rid);
   }
   if(feature==='report'){
    const r=await db().query(`SELECT r.*,u.name reporter_name FROM moderation_reports r JOIN users u ON u.id=r.reporter_id WHERE $1='admin' OR r.reporter_id=$2 ORDER BY r.created_at DESC LIMIT 100`,[s.role,s.id]);
    return json(res,200,{items:r.rows},rid);
   }
   const r=await db().query(`SELECT * FROM refund_requests WHERE $1='admin' OR requester_id=$2 ORDER BY created_at DESC LIMIT 100`,[s.role,s.id]);
   return json(res,200,{items:r.rows},rid);
  }

  const b=await body(req);
  if(req.method==='POST'){
   if(feature==='product' && String(b.action||'').toLowerCase()==='purchase'){
    if(s.role!=='fan')return json(res,403,{error:'Fan access required'},rid);
    const productId=str(b.productId,160); if(!productId)return json(res,400,{error:'Product is required'},rid);
    const client=await db().connect();
    try{await client.query('BEGIN');
      const pr=await client.query("SELECT id,creator_id,title,price_paise,status FROM digital_products WHERE id=$1 AND status='published' FOR UPDATE",[productId]);
      if(!pr.rowCount){await client.query('ROLLBACK');return json(res,404,{error:'Product not found'},rid);}
      const product=pr.rows[0]; await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[String(s.id)]); const existing=await client.query("SELECT id FROM product_purchases WHERE product_id=$1 AND fan_id=$2 AND status='paid'",[productId,s.id]);
      if(existing.rowCount){await client.query('COMMIT');return json(res,200,{ok:true,alreadyPurchased:true,purchaseId:existing.rows[0].id},rid);}
      const bal=await client.query("SELECT COALESCE(SUM(CASE WHEN type IN ('credit','refund') AND status='completed' THEN amount_paise WHEN type='debit' AND status='completed' THEN -amount_paise ELSE 0 END),0) balance FROM wallet_transactions WHERE user_id=$1",[s.id]);
      const balance=Number(bal.rows[0].balance||0); if(balance<Number(product.price_paise)){await client.query('ROLLBACK');return json(res,402,{error:'Insufficient wallet balance'},rid);}
      const purchaseId=id('purchase'); await client.query("INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'debit',$3,'product_purchase',$4,'completed')",[id('wtx'),s.id,product.price_paise,purchaseId]);
      await client.query("INSERT INTO product_purchases(id,product_id,fan_id,amount_paise,status) VALUES($1,$2,$3,$4,'paid')",[purchaseId,productId,s.id,product.price_paise]);
      if(Number(product.price_paise)>0){
       await client.query("INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'credit',$3,'product_purchase',$4,'completed') ON CONFLICT DO NOTHING",[id('wtx'),product.creator_id,product.price_paise,purchaseId]);
       await client.query("INSERT INTO creator_earnings(id,creator_id,source_type,source_id,gross_paise,fee_paise,net_paise,status) VALUES($1,$2,'product_purchase',$3,$4,0,$4,'available') ON CONFLICT DO NOTHING",[id('earn'),product.creator_id,purchaseId,product.price_paise]);
      }
      await client.query('COMMIT'); return json(res,201,{ok:true,purchaseId},rid);
    }catch(e){try{await client.query('ROLLBACK')}catch{};throw e;}finally{client.release();}
   }

   if(feature==='live' && String(b.action||'').toLowerCase()==='purchase'){
    if(s.role!=='fan')return json(res,403,{error:'Fan access required'},rid);
    const liveId=str(b.liveId,160); if(!liveId)return json(res,400,{error:'Live event is required'},rid);
    const client=await db().connect();
    try{await client.query('BEGIN');
      const lr=await client.query("SELECT * FROM live_streams WHERE id=$1 AND status IN ('scheduled','live') FOR UPDATE",[liveId]);
      if(!lr.rowCount){await client.query('ROLLBACK');return json(res,404,{error:'Live event not found'},rid);}
      const live=lr.rows[0];
      if(live.access_type==='free'){await client.query('COMMIT');return json(res,200,{ok:true,access:true,free:true,streamUrl:live.stream_url},rid);}
      if(live.access_type==='subscription'){
        const sub=await client.query("SELECT 1 FROM subscriptions WHERE fan_id=$1 AND creator_id=$2 AND status='active' AND (expires_at IS NULL OR expires_at>now())",[s.id,live.creator_id]);
        if(!sub.rowCount){await client.query('ROLLBACK');return json(res,402,{error:'Active subscription required'},rid);}
        await client.query('COMMIT');return json(res,200,{ok:true,access:true,subscription:true,streamUrl:live.stream_url},rid);
      }
      const existing=await client.query("SELECT id FROM live_access WHERE live_id=$1 AND fan_id=$2 AND status='paid'",[liveId,s.id]);
      if(existing.rowCount){await client.query('COMMIT');return json(res,200,{ok:true,access:true,alreadyPurchased:true,accessId:existing.rows[0].id,streamUrl:live.stream_url},rid);}
      const price=Number(live.price_paise||0); await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[String(s.id)]); const bal=await client.query("SELECT COALESCE(SUM(CASE WHEN type IN ('credit','refund','adjustment') AND status='completed' THEN amount_paise WHEN type='debit' AND status='completed' THEN -amount_paise ELSE 0 END),0) balance FROM wallet_transactions WHERE user_id=$1 FOR UPDATE",[s.id]);
      if(Number(bal.rows[0].balance||0)<price){await client.query('ROLLBACK');return json(res,402,{error:'Insufficient wallet balance'},rid);}
      const accessId=id('liveaccess'); await client.query("INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'debit',$3,'live_access',$4,'completed')",[id('wtx'),s.id,price,accessId]);
      await client.query("INSERT INTO live_access(id,live_id,fan_id,amount_paise,status) VALUES($1,$2,$3,$4,'paid')",[accessId,liveId,s.id,price]);
      if(price>0){await client.query("INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'credit',$3,'live_access',$4,'completed') ON CONFLICT DO NOTHING",[id('wtx'),live.creator_id,price,accessId]);await client.query("INSERT INTO creator_earnings(id,creator_id,source_type,source_id,gross_paise,fee_paise,net_paise,status) VALUES($1,$2,'live_access',$3,$4,0,$4,'available') ON CONFLICT DO NOTHING",[id('earn'),live.creator_id,accessId,price]);}
      await client.query('COMMIT');return json(res,201,{ok:true,access:true,accessId,streamUrl:live.stream_url},rid);
    }catch(e){try{await client.query('ROLLBACK')}catch{};throw e;}finally{client.release();}
   }
   if(feature==='live'){
    if(!['admin','creator'].includes(s.role))return json(res,403,{error:'Creator or admin access required'},rid);
    const creatorId=s.role==='creator'?s.id:str(b.creatorId,120); if(!creatorId)return json(res,400,{error:'Creator is required'},rid);
    const title=str(b.title,160); if(!title)return json(res,400,{error:'Title is required'},rid);
    const access=['free','paid','subscription'].includes(b.accessType)?b.accessType:'free'; const price=money(b.price); if(access==='paid'&&price<=0)return json(res,400,{error:'Paid live requires a price'},rid);
    const r=await db().query(`INSERT INTO live_streams(id,creator_id,title,description,access_type,price_paise,scheduled_at,stream_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[id('live'),creatorId,title,str(b.description,2000),access,price,b.scheduledAt||null,str(b.streamUrl,1000)]);
    return json(res,201,{item:r.rows[0]},rid);
   }
   if(feature==='request'){
    if(s.role!=='fan')return json(res,403,{error:'Fan access required'},rid); const creatorId=str(b.creatorId,120); const title=str(b.title,160); if(!creatorId||!title)return json(res,400,{error:'Creator and title are required'},rid);
    const own=await db().query("SELECT 1 FROM users WHERE id=$1 AND role='creator' AND status='active'",[creatorId]); if(!own.rowCount)return json(res,404,{error:'Creator not found'},rid);
    const r=await db().query(`INSERT INTO interaction_requests(id,fan_id,creator_id,type,title,details,amount_paise,due_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[id('req'),s.id,creatorId,['one_to_one','custom_request'].includes(b.type)?b.type:'one_to_one',title,str(b.details,4000),money(b.amount),b.dueAt||null]);
    return json(res,201,{item:r.rows[0]},rid);
   }
   if(feature==='product'){
    if(!['admin','creator'].includes(s.role))return json(res,403,{error:'Creator or admin access required'},rid); const creatorId=s.role==='creator'?s.id:str(b.creatorId,120); const title=str(b.title,160); if(!creatorId||!title)return json(res,400,{error:'Creator and title are required'},rid);
    const owner=await db().query("SELECT 1 FROM users WHERE id=$1 AND role='creator'",[creatorId]); if(!owner.rowCount)return json(res,404,{error:'Creator not found'},rid);
    const r=await db().query(`INSERT INTO digital_products(id,creator_id,title,description,category,price_paise,delivery_url,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[id('prod'),creatorId,title,str(b.description,4000),str(b.category,80)||'digital',money(b.price),str(b.deliveryUrl,2000),['draft','published','archived'].includes(b.status)?b.status:'published']);
    return json(res,201,{item:r.rows[0]},rid);
   }
   if(feature==='collaboration'){
    if(!['admin','creator'].includes(s.role))return json(res,403,{error:'Creator or admin access required'},rid); const creatorId=s.role==='creator'?s.id:str(b.creatorId,120); const brand=str(b.brandName,160),title=str(b.title,200); if(!creatorId||!brand||!title)return json(res,400,{error:'Creator, brand and title are required'},rid);
    const r=await db().query(`INSERT INTO collaborations(id,creator_id,brand_name,title,brief,budget_paise,status,deliverables,due_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) RETURNING *`,[id('collab'),creatorId,brand,title,str(b.brief,5000),money(b.budget),['open','applied','accepted','in_progress','submitted','completed','cancelled'].includes(b.status)?b.status:'open',JSON.stringify(Array.isArray(b.deliverables)?b.deliverables:[]),b.dueAt||null]);
    return json(res,201,{item:r.rows[0]},rid);
   }
   if(feature==='report'){
    const targetType=str(b.targetType,80),targetId=str(b.targetId,160),reason=str(b.reason,300); if(!targetType||!targetId||!reason)return json(res,400,{error:'Target and reason are required'},rid);
    const r=await db().query(`INSERT INTO moderation_reports(id,reporter_id,target_type,target_id,reason,details) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[id('report'),s.id,targetType,targetId,reason,str(b.details,3000)]); return json(res,201,{item:r.rows[0]},rid);
   }
   if(feature==='refund'){
    if(s.role!=='fan'&&s.role!=='admin')return json(res,403,{error:'Fan or admin access required'},rid);
    const amount=money(b.amount); if(amount<=0)return json(res,400,{error:'Valid amount is required'},rid);
    const refType=str(b.referenceType,80).toLowerCase(),refId=str(b.referenceId,160),reason=str(b.reason,1000);
    const supported=['product_purchase','live_access','interaction_request','subscription','post_unlock','gift','chat_message'];
    if(!supported.includes(refType)||!refId||!reason)return json(res,400,{error:'Supported reference and reason are required'},rid);
    const ownerId=s.role==='admin'&&b.requesterId?String(b.requesterId):s.id;
    const client=await db().connect();
    try{await client.query('BEGIN');
      const original=await client.query(`SELECT COALESCE(SUM(amount_paise),0) total FROM wallet_transactions WHERE user_id=$1 AND reference_type=$2 AND reference_id=$3 AND type='debit' AND status='completed' FOR UPDATE`,[ownerId,refType,refId]);
      const originalPaise=Number(original.rows[0]?.total||0); if(originalPaise<=0){await client.query('ROLLBACK');return json(res,404,{error:'Original paid transaction not found'},rid);}
      if(amount>originalPaise){await client.query('ROLLBACK');return json(res,400,{error:'Refund exceeds original paid amount'},rid);}
      const used=await client.query(`SELECT COALESCE(SUM(amount_paise),0) total FROM refund_requests WHERE requester_id=$1 AND reference_type=$2 AND reference_id=$3 AND status IN ('pending','approved','refunded')`,[ownerId,refType,refId]);
      if(Number(used.rows[0]?.total||0)+amount>originalPaise){await client.query('ROLLBACK');return json(res,400,{error:'Total requested refunds exceed original paid amount'},rid);}
      const dup=await client.query(`SELECT id FROM refund_requests WHERE requester_id=$1 AND reference_type=$2 AND reference_id=$3 AND status IN ('pending','approved') LIMIT 1`,[ownerId,refType,refId]);
      if(dup.rowCount){await client.query('ROLLBACK');return json(res,409,{error:'A refund request is already pending for this purchase'},rid);}
      const r=await client.query(`INSERT INTO refund_requests(id,requester_id,reference_type,reference_id,amount_paise,reason) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[id('refund'),ownerId,refType,refId,amount,reason]);
      await client.query('COMMIT'); return json(res,201,{item:r.rows[0]},rid);
    }catch(e){try{await client.query('ROLLBACK')}catch{};throw e}finally{client.release();}
   }
  }

  if(req.method==='PATCH'){
   if(s.role!=='admin' && !(feature==='request' && s.role==='creator'))return json(res,403,{error:'Admin or request creator access required'},rid); const itemId=str(b.id,160),status=str(b.status,40); if(!itemId)return json(res,400,{error:'id is required'},rid);
   const maps={live:['scheduled','live','ended','cancelled'],request:['pending','accepted','in_progress','completed','cancelled','rejected'],product:['draft','published','archived'],collaboration:['open','applied','accepted','in_progress','submitted','completed','cancelled'],report:['open','reviewing','resolved','dismissed'],refund:['pending','approved','rejected','refunded']}; if(!maps[feature].includes(status))return json(res,400,{error:'Invalid status'},rid);
   const tables={live:'live_streams',request:'interaction_requests',product:'digital_products',collaboration:'collaborations',report:'moderation_reports',refund:'refund_requests'};
   const client=await db().connect();
   try{await client.query('BEGIN');
    let current;
    if(feature==='request' && (s.role==='creator' || s.role==='admin')){
      const rr=await client.query(s.role==='creator'?'SELECT * FROM interaction_requests WHERE id=$1 AND creator_id=$2 FOR UPDATE':'SELECT * FROM interaction_requests WHERE id=$1 FOR UPDATE',[itemId,...(s.role==='creator'?[s.id]:[])]); if(!rr.rowCount){await client.query('ROLLBACK');return json(res,404,{error:'Request not found'},rid);} current=rr.rows[0];
      if(status==='accepted' && current.status==='pending' && Number(current.amount_paise)>0){
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[String(current.fan_id)]);
        const bal=await client.query("SELECT COALESCE(SUM(CASE WHEN type IN ('credit','refund','adjustment') AND status='completed' THEN amount_paise WHEN type='debit' AND status='completed' THEN -amount_paise ELSE 0 END),0) balance FROM wallet_transactions WHERE user_id=$1",[current.fan_id]);
        if(Number(bal.rows[0].balance||0)<Number(current.amount_paise)){await client.query('ROLLBACK');return json(res,402,{error:'Fan has insufficient wallet balance'},rid);}
        await client.query("INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'debit',$3,'interaction_request',$4,'completed') ON CONFLICT DO NOTHING",[id('wtx'),current.fan_id,current.amount_paise,current.id]);
        await client.query("INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'credit',$3,'interaction_request',$4,'completed') ON CONFLICT DO NOTHING",[id('wtx'),current.creator_id,current.amount_paise,current.id]);
        await client.query("INSERT INTO creator_earnings(id,creator_id,source_type,source_id,gross_paise,fee_paise,net_paise,status) VALUES($1,$2,'interaction_request',$3,$4,0,$4,'available') ON CONFLICT DO NOTHING",[id('earn'),current.creator_id,current.id,current.amount_paise]);
      }
    }
    const r=await client.query(`UPDATE ${tables[feature]} SET status=$1,updated_at=now() WHERE id=$2 RETURNING *`,[status,itemId]); if(!r.rowCount){await client.query('ROLLBACK');return json(res,404,{error:'Item not found'},rid);}
    if(feature==='refund'&&status==='refunded'){
      const x=r.rows[0];
      const original=await client.query("SELECT COALESCE(SUM(amount_paise),0) total FROM wallet_transactions WHERE user_id=$1 AND reference_type=$2 AND reference_id=$3 AND type='debit' AND status='completed'",[x.requester_id,x.reference_type,x.reference_id]);
      const already=await client.query("SELECT COALESCE(SUM(amount_paise),0) total FROM wallet_transactions WHERE user_id=$1 AND reference_type='refund_request' AND reference_id IN (SELECT id FROM refund_requests WHERE requester_id=$1 AND reference_type=$2 AND reference_id=$3) AND type='refund' AND status='completed'",[x.requester_id,x.reference_type,x.reference_id]);
      if(Number(x.amount_paise)+Number(already.rows[0]?.total||0)>Number(original.rows[0]?.total||0)){await client.query('ROLLBACK');return json(res,400,{error:'Total refunds exceed original paid amount'},rid);}
      const inserted=await client.query("INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'refund',$3,'refund_request',$4,'completed') ON CONFLICT DO NOTHING RETURNING id",[id('wtx'),x.requester_id,x.amount_paise,x.id]);
      if(inserted.rowCount){
        const source=await client.query(`SELECT creator_id FROM interaction_requests WHERE id=$1 AND $2='interaction_request' UNION ALL SELECT creator_id FROM digital_products p JOIN product_purchases pp ON pp.product_id=p.id WHERE pp.id=$3 AND $4='product_purchase' UNION ALL SELECT creator_id FROM live_streams l JOIN live_access a ON a.live_id=l.id WHERE a.id=$5 AND $6='live_access' UNION ALL SELECT creator_id FROM posts p JOIN post_unlocks pu ON pu.post_id=p.id WHERE pu.id=$7 AND $8='post_unlock' UNION ALL SELECT creator_id FROM gift_transactions WHERE id=$9 AND $10='gift' UNION ALL SELECT c.creator_id FROM messages m JOIN chats c ON c.id=m.chat_id WHERE m.id=$11 AND $12='chat_message' UNION ALL SELECT creator_id FROM subscriptions WHERE id=$13 AND $14='subscription' LIMIT 1`,[x.reference_id,x.reference_type,x.reference_id,x.reference_type,x.reference_id,x.reference_type,x.reference_id,x.reference_type,x.reference_id,x.reference_type,x.reference_id,x.reference_type,x.reference_id,x.reference_type]);
        if(source.rowCount){const creatorId=String(source.rows[0].creator_id); await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[`wallet:${creatorId}`]); await client.query("INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'debit',$3,'refund_reversal',$4,'completed') ON CONFLICT DO NOTHING",[id('wtx'),creatorId,x.amount_paise,x.id]); await client.query("UPDATE creator_earnings SET status='reversed' WHERE source_id=$1 AND creator_id=$2 AND status IN ('available','pending')",[x.reference_id,creatorId]);}
      }
      if(x.reference_type==='product_purchase') await client.query("UPDATE product_purchases SET status='refunded',updated_at=now() WHERE id=$1",[x.reference_id]);
      if(x.reference_type==='live_access') await client.query("UPDATE live_access SET status='refunded' WHERE id=$1",[x.reference_id]);
    }
    await client.query('COMMIT'); return json(res,200,{item:r.rows[0]},rid);
   }catch(e){try{await client.query('ROLLBACK')}catch{};throw e;}finally{client.release();}
  }
  return json(res,405,{error:'Method not allowed'},rid);
 }catch(e){return json(res,e?.statusCode||500,{error:e?.statusCode?e.message:'Server error'},rid);}
}

import { db, json, body, requireSession, requestId, rateLimit, requireSameOrigin, id } from '../../lib.mjs';

const cleanPlan = (x)=>({id:x.id,creatorId:x.creator_id,name:x.name,durationMonths:Number(x.duration_months),pricePaise:Number(x.price_paise),active:x.active!==false,createdAt:x.created_at?new Date(x.created_at).toISOString():null,updatedAt:x.updated_at?new Date(x.updated_at).toISOString():null});
const cleanSub = (x)=>({id:x.id,fanId:x.fan_id,creatorId:x.creator_id,planId:x.plan_id||null,amountPaise:Number(x.amount_paise||0),status:x.status,expiresAt:x.expires_at?new Date(x.expires_at).toISOString():null,createdAt:new Date(x.created_at).toISOString(),updatedAt:new Date(x.updated_at).toISOString()});

export default async function handler(req,res){
 const rid=requestId(req); try{
  const s=requireSession(req,res,[],rid); if(!s)return;
  if(!['GET','POST','PATCH','DELETE'].includes(req.method))return json(res,405,{error:'Method not allowed'},rid);
  if(req.method!=='GET'&&!requireSameOrigin(req,res,rid))return;
  if(!rateLimit(req,'subscriptions',30,60000))return json(res,429,{error:'Too many requests'},rid);
  const b=req.method==='GET'?{}:await body(req); const q=req.query||{};

  await db().query(`CREATE TABLE IF NOT EXISTS subscription_plans (id TEXT PRIMARY KEY,creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,duration_months INTEGER NOT NULL CHECK(duration_months BETWEEN 1 AND 120),price_paise INTEGER NOT NULL CHECK(price_paise>=0),active BOOLEAN NOT NULL DEFAULT true,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await db().query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES subscription_plans(id)`);
  await db().query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS amount_paise INTEGER NOT NULL DEFAULT 0`);
  await db().query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`);

  if(req.method==='GET'){
   const creatorId=String(q.creatorId||'');
   if(q.plans==='1'){
    if(!creatorId)return json(res,400,{error:'Creator id is required'},rid);
    const r=await db().query(`SELECT id,creator_id,name,duration_months,price_paise,active,created_at,updated_at FROM subscription_plans WHERE creator_id=$1 ORDER BY active DESC,updated_at DESC`,[creatorId]);
    return json(res,200,{plans:r.rows.map(cleanPlan)},rid);
   }
   const fanId=s.role==='fan'?s.id:String(q.fanId||'');
   if(s.role==='fan'){
    if(fanId!==s.id)return json(res,403,{error:'Forbidden'},rid);
   }else if(s.role==='creator'){
    if(creatorId && creatorId!==String(s.id))return json(res,403,{error:'Forbidden'},rid);
    if(!creatorId)return json(res,400,{error:'Creator id is required'},rid);
   }
   const params=[]; let where='1=1';
   if(fanId){params.push(fanId);where+=` AND fan_id=$${params.length}`;} if(creatorId){params.push(creatorId);where+=` AND creator_id=$${params.length}`;}
   const r=await db().query(`SELECT id,fan_id,creator_id,plan_id,amount_paise,status,expires_at,created_at,updated_at FROM subscriptions WHERE ${where} ORDER BY updated_at DESC LIMIT 100`,params);
   return json(res,200,{subscriptions:r.rows.map(cleanSub)},rid);
  }

  if(req.method==='POST'){
   const action=String(b.action||'subscribe');
   if(action==='create_plan'||action==='update_plan'||action==='toggle_plan'){
    if(!['admin','creator'].includes(s.role))return json(res,403,{error:'Creator/Admin access required'},rid);
    const creatorId=s.role==='creator'?s.id:String(b.creatorId||''); if(!creatorId)return json(res,400,{error:'Creator id is required'},rid);
    if(action==='create_plan'){
     const name=String(b.name||'').trim().slice(0,120), months=Math.trunc(Number(b.durationMonths)), price=Math.trunc(Number(b.pricePaise));
     if(!name||!Number.isInteger(months)||months<1||months>120||!Number.isInteger(price)||price<0)return json(res,400,{error:'Invalid plan'},rid);
     const r=await db().query(`INSERT INTO subscription_plans(id,creator_id,name,duration_months,price_paise,active) VALUES($1,$2,$3,$4,$5,true) RETURNING *`,[id('plan'),creatorId,name,months,price]);
     return json(res,201,{plan:cleanPlan(r.rows[0])},rid);
    }
    const planId=String(b.planId||''); if(!planId)return json(res,400,{error:'Plan id is required'},rid);
    const own=await db().query(`SELECT * FROM subscription_plans WHERE id=$1 AND creator_id=$2`,[planId,creatorId]); if(!own.rowCount)return json(res,404,{error:'Plan not found'},rid);
    if(action==='toggle_plan'){
     const r=await db().query(`UPDATE subscription_plans SET active=NOT active,updated_at=now() WHERE id=$1 RETURNING *`,[planId]);
     return json(res,200,{plan:cleanPlan(r.rows[0])},rid);
    }
    const name=String(b.name??own.rows[0].name).trim().slice(0,120), months=Math.trunc(Number(b.durationMonths??own.rows[0].duration_months)), price=Math.trunc(Number(b.pricePaise??own.rows[0].price_paise));
    if(!name||!Number.isInteger(months)||months<1||months>120||!Number.isInteger(price)||price<0)return json(res,400,{error:'Invalid plan'},rid);
    const r=await db().query(`UPDATE subscription_plans SET name=$1,duration_months=$2,price_paise=$3,updated_at=now() WHERE id=$4 RETURNING *`,[name,months,price,planId]);
    return json(res,200,{plan:cleanPlan(r.rows[0])},rid);
   }

   if(s.role!=='fan'&&s.role!=='admin')return json(res,403,{error:'Fan access required'},rid);
   const fanId=s.role==='admin'&&b.fanId?String(b.fanId):s.id; const planId=String(b.planId||'');
   if(!planId)return json(res,400,{error:'Plan id is required'},rid);
   const client=await db().connect();
   try{
    await client.query('BEGIN');
    const p=await client.query(`SELECT id,creator_id,name,duration_months,price_paise FROM subscription_plans WHERE id=$1 AND active=true FOR SHARE`,[planId]);
    if(!p.rowCount){await client.query('ROLLBACK');return json(res,404,{error:'Subscription plan is not available'},rid);}
    const plan=p.rows[0];
    const fan=await client.query(`SELECT id FROM users WHERE id=$1 AND role='fan' AND status='active'`,[fanId]);
    if(!fan.rowCount){await client.query('ROLLBACK');return json(res,404,{error:'Fan not found'},rid);}
    const creator=await client.query(`SELECT id FROM users WHERE id=$1 AND role='creator' AND status='active'`,[plan.creator_id]);
    if(!creator.rowCount){await client.query('ROLLBACK');return json(res,404,{error:'Creator not found'},rid);}
    await client.query(`SELECT id FROM users WHERE id=$1 FOR UPDATE`,[fanId]);
    const bal=await client.query(`SELECT COALESCE(SUM(CASE WHEN type IN ('credit','refund','adjustment') AND status='completed' THEN amount_paise ELSE 0 END),0)-COALESCE(SUM(CASE WHEN type='debit' AND status='completed' THEN amount_paise ELSE 0 END),0) AS balance FROM wallet_transactions WHERE user_id=$1`,[fanId]);
    const balance=Number(bal.rows[0]?.balance||0), price=Number(plan.price_paise||0);
    if(balance<price){await client.query('ROLLBACK');return json(res,402,{error:'Insufficient wallet balance',balancePaise:balance,requiredPaise:price},rid);}
    const existing=await client.query(`SELECT id,expires_at FROM subscriptions WHERE fan_id=$1 AND creator_id=$2 FOR UPDATE`,[fanId,plan.creator_id]);
    const now=Date.now(), currentEnd=existing.rows[0]?.expires_at&&new Date(existing.rows[0].expires_at).getTime()>now?new Date(existing.rows[0].expires_at).getTime():now;
    const expires=new Date(currentEnd+Number(plan.duration_months)*30*86400000);
    const subId=existing.rows[0]?.id||id('sub');
    if(existing.rowCount) await client.query(`UPDATE subscriptions SET plan_id=$1,amount_paise=$2,expires_at=$3,status='active',updated_at=now() WHERE id=$4`,[plan.id,price,expires,subId]);
    else await client.query(`INSERT INTO subscriptions(id,fan_id,creator_id,plan_id,amount_paise,expires_at,status) VALUES($1,$2,$3,$4,$5,$6,'active')`,[subId,fanId,plan.creator_id,plan.id,price,expires]);
    if(price>0){
     await client.query(`INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'debit',$3,'subscription',$4,'completed')`,[id('wtx'),fanId,price,subId]);
     await client.query(`INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'credit',$3,'subscription',$4,'completed')`,[id('wtx'),plan.creator_id,price,subId]);
    }
    const r=await client.query(`SELECT id,fan_id,creator_id,plan_id,amount_paise,status,expires_at,created_at,updated_at FROM subscriptions WHERE id=$1`,[subId]);
    await client.query("INSERT INTO notifications(id,user_id,type,payload) VALUES($1,$2,'subscription_event',$3::jsonb)",[id('notif'),plan.creator_id,JSON.stringify({title:'New subscription',text:`A fan subscribed to ${plan.name}.`,icon:'⭐',amountPaise:price,planId:plan.id})]);
    await client.query("INSERT INTO notifications(id,user_id,type,payload) VALUES($1,$2,'subscription_confirmed',$3::jsonb)",[id('notif'),fanId,JSON.stringify({title:'Subscription active',text:`Your ${plan.name} subscription is active.`,icon:'⭐',expiresAt:expires.toISOString(),planId:plan.id})]);
    await client.query('COMMIT');
    return json(res,201,{subscription:cleanSub(r.rows[0]),balancePaise:balance-price},rid);
   }catch(e){try{await client.query('ROLLBACK')}catch{};throw e}finally{client.release()}
  }

  const subId=String(b.id||q.id||''); if(!subId)return json(res,400,{error:'Subscription id is required'},rid);
  const r0=await db().query('SELECT id,fan_id,creator_id,status FROM subscriptions WHERE id=$1',[subId]); if(!r0.rowCount)return json(res,404,{error:'Subscription not found'},rid);
  const row=r0.rows[0]; if(s.role!=='admin'&&row.fan_id!==s.id)return json(res,403,{error:'Forbidden'},rid);
  if(req.method==='DELETE'){await db().query("UPDATE subscriptions SET status='cancelled',updated_at=now() WHERE id=$1",[subId]);return json(res,200,{ok:true},rid);}
  const status=['active','paused','cancelled','expired'].includes(String(b.status))?String(b.status):''; if(!status)return json(res,400,{error:'Invalid status'},rid);
  const r=await db().query(`UPDATE subscriptions SET status=$1,updated_at=now() WHERE id=$2 RETURNING id,fan_id,creator_id,plan_id,amount_paise,status,expires_at,created_at,updated_at`,[status,subId]); return json(res,200,{subscription:cleanSub(r.rows[0])},rid);
 }catch(e){return json(res,e?.statusCode||500,{error:e?.statusCode?e.message:'Server error'},rid);}
}

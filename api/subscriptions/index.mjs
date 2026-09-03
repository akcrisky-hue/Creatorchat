import { db, json, body, requireSession, requestId, rateLimit, requireSameOrigin, id } from '../../lib.mjs';
export default async function handler(req,res){
 const rid=requestId(req); try{
  const s=requireSession(req,res,[],rid); if(!s)return;
  if(!['GET','POST','PATCH','DELETE'].includes(req.method))return json(res,405,{error:'Method not allowed'},rid);
  if(req.method!=='GET'&&!requireSameOrigin(req,res,rid))return;
  if(!rateLimit(req,'subscriptions',30,60000))return json(res,429,{error:'Too many requests'},rid);
  const b=req.method==='GET'?{}:await body(req); const q=req.query||{};
  if(req.method==='GET'){
   const fanId=s.role==='fan'?s.id:String(q.fanId||''); const creatorId=String(q.creatorId||''); const params=[]; let where='1=1';
   if(fanId){params.push(fanId);where+=` AND fan_id=$${params.length}`;} if(creatorId){params.push(creatorId);where+=` AND creator_id=$${params.length}`;}
   if(s.role!=='admin'&&!fanId&&!creatorId)return json(res,403,{error:'Forbidden'},rid);
   const r=await db().query(`SELECT id,fan_id,creator_id,status,created_at,updated_at FROM subscriptions WHERE ${where} ORDER BY updated_at DESC LIMIT 100`,params);
   return json(res,200,{subscriptions:r.rows.map(x=>({id:x.id,fanId:x.fan_id,creatorId:x.creator_id,status:x.status,createdAt:new Date(x.created_at).toISOString(),updatedAt:new Date(x.updated_at).toISOString()}))},rid);
  }
  if(req.method==='POST'){
   if(s.role!=='fan'&&s.role!=='admin')return json(res,403,{error:'Fan access required'},rid);
   const fanId=s.role==='admin'&&b.fanId?String(b.fanId):s.id; const creatorId=String(b.creatorId||''); if(!creatorId)return json(res,400,{error:'Creator id is required'},rid); if(fanId===creatorId)return json(res,400,{error:'Invalid subscription'},rid);
   const fan=await db().query("SELECT id FROM users WHERE id=$1 AND role='fan' AND status='active'",[fanId]); if(!fan.rowCount)return json(res,404,{error:'Fan not found'},rid); const creator=await db().query("SELECT id FROM users WHERE id=$1 AND role='creator' AND status='active'",[creatorId]); if(!creator.rowCount)return json(res,404,{error:'Creator not found'},rid);
   const r=await db().query(`INSERT INTO subscriptions(id,fan_id,creator_id,status) VALUES($1,$2,$3,'active') ON CONFLICT(fan_id,creator_id) DO UPDATE SET status='active',updated_at=now() RETURNING id,fan_id,creator_id,status,created_at,updated_at`,[id('sub'),fanId,creatorId]);
   return json(res,201,{subscription:r.rows[0]},rid);
  }
  const subId=String(b.id||q.id||''); if(!subId)return json(res,400,{error:'Subscription id is required'},rid);
  const r0=await db().query('SELECT id,fan_id,creator_id,status FROM subscriptions WHERE id=$1',[subId]); if(!r0.rowCount)return json(res,404,{error:'Subscription not found'},rid);
  const row=r0.rows[0]; if(s.role!=='admin'&&row.fan_id!==s.id)return json(res,403,{error:'Forbidden'},rid);
  if(req.method==='DELETE'){await db().query("UPDATE subscriptions SET status='cancelled',updated_at=now() WHERE id=$1",[subId]);return json(res,200,{ok:true},rid);}
  const status=['active','paused','cancelled'].includes(String(b.status))?String(b.status):''; if(!status)return json(res,400,{error:'Invalid status'},rid);
  const r=await db().query(`UPDATE subscriptions SET status=$1,updated_at=now() WHERE id=$2 RETURNING id,fan_id,creator_id,status,created_at,updated_at`,[status,subId]); return json(res,200,{subscription:r.rows[0]},rid);
 }catch(e){return json(res,e?.statusCode||500,{error:e?.statusCode?e.message:'Server error'},rid);}
}

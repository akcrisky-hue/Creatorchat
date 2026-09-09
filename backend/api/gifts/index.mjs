import { db, json, body, requireSession, requestId, rateLimit, requireSameOrigin, id } from '../../lib.mjs';

const DEFAULTS=[['❤️','Heart',99],['🌹','Rose',199],['💕','Love',399],['💐','Flowers',599],['💎','Diamond',999],['🧸','Teddy',1499],['💖','Big Heart',2499],['🎁','Love Box',4999],['💝','Premium',7999],['💋','Kiss',9999],['👑','Royal',14999],['💎','Ultimate',19999]];
const clean=(v,n=120)=>String(v??'').replace(/[<>]/g,'').trim().slice(0,n);
const cents=v=>Math.max(0,Math.round(Number(v)||0));
async function ensureSchema(){
 await db().query(`CREATE TABLE IF NOT EXISTS creator_gifts (id TEXT PRIMARY KEY,creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,emoji TEXT NOT NULL DEFAULT '🎁',name TEXT NOT NULL,price_paise INTEGER NOT NULL CHECK(price_paise>=0),active BOOLEAN NOT NULL DEFAULT true,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
 await db().query(`CREATE INDEX IF NOT EXISTS creator_gifts_creator_idx ON creator_gifts(creator_id,active,created_at)`);
 await db().query(`CREATE TABLE IF NOT EXISTS gift_transactions (id TEXT PRIMARY KEY,gift_id TEXT NOT NULL REFERENCES creator_gifts(id),fan_id TEXT NOT NULL REFERENCES users(id),creator_id TEXT NOT NULL REFERENCES users(id),amount_paise INTEGER NOT NULL CHECK(amount_paise>=0),created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
 await db().query(`CREATE INDEX IF NOT EXISTS gift_transactions_fan_idx ON gift_transactions(fan_id,created_at DESC)`);
 await db().query(`CREATE INDEX IF NOT EXISTS gift_transactions_creator_idx ON gift_transactions(creator_id,created_at DESC)`);
}
async function seedCreator(creatorId){
 const c=await db().query("SELECT id FROM users WHERE id=$1 AND role='creator'",[creatorId]); if(!c.rowCount)return;
 const n=await db().query('SELECT COUNT(*)::int n FROM creator_gifts WHERE creator_id=$1',[creatorId]);
 if(Number(n.rows[0]?.n||0)===0){for(const [emoji,name,price] of DEFAULTS)await db().query('INSERT INTO creator_gifts(id,creator_id,emoji,name,price_paise,active) VALUES($1,$2,$3,$4,$5,true)',[id('gift'),creatorId,emoji,name,price]);}
}
function cleanGift(x){return {id:String(x.id),creatorId:String(x.creator_id),emoji:String(x.emoji||'🎁'),name:String(x.name||''),pricePaise:Number(x.price_paise||0),price:Number(x.price_paise||0)/100,active:x.active!==false,createdAt:new Date(x.created_at).toISOString(),updatedAt:new Date(x.updated_at).toISOString()};}

export default async function handler(req,res){
 const rid=requestId(req); try{
  const s=requireSession(req,res,[],rid); if(!s)return;
  if(!['GET','POST','PATCH','DELETE'].includes(req.method))return json(res,405,{error:'Method not allowed'},rid);
  if(req.method!=='GET'&&!requireSameOrigin(req,res,rid))return;
  if(!rateLimit(req,'gifts',60,60000))return json(res,429,{error:'Too many requests'},rid);
  await ensureSchema();
  const b=req.method==='GET'?{}:await body(req),q=req.query||{};
  if(req.method==='GET'){
   const creatorId=String(q.creatorId||'').slice(0,160); if(!creatorId)return json(res,400,{error:'Creator id is required'},rid);
   await seedCreator(creatorId);
   const all=(s.role==='admin'||(s.role==='creator'&&String(s.id)===creatorId));
   const r=await db().query(`SELECT * FROM creator_gifts WHERE creator_id=$1 ${all?'':'AND active=true'} ORDER BY created_at ASC`,[creatorId]);
   return json(res,200,{gifts:r.rows.map(cleanGift)},rid);
  }
  if(req.method==='POST'&&String(b.action||'')==='send'){
   if(s.role!=='fan'&&s.role!=='admin')return json(res,403,{error:'Fan access required'},rid);
   const fanId=s.role==='admin'&&b.fanId?String(b.fanId):String(s.id),giftId=String(b.giftId||''); if(!giftId)return json(res,400,{error:'Gift id is required'},rid);
   const client=await db().connect(); try{await client.query('BEGIN');
    const gr=await client.query("SELECT * FROM creator_gifts WHERE id=$1 AND active=true FOR SHARE",[giftId]); if(!gr.rowCount){await client.query('ROLLBACK');return json(res,404,{error:'Gift not found or unavailable'},rid);} const g=gr.rows[0];
    const fan=await client.query("SELECT id FROM users WHERE id=$1 AND role='fan' AND status='active' FOR UPDATE",[fanId]); if(!fan.rowCount){await client.query('ROLLBACK');return json(res,403,{error:'Fan account is not active'},rid);}
    const bal=await client.query(`SELECT COALESCE(SUM(CASE WHEN type IN ('credit','refund','adjustment') AND status='completed' THEN amount_paise ELSE 0 END),0)-COALESCE(SUM(CASE WHEN type='debit' AND status='completed' THEN amount_paise ELSE 0 END),0) AS balance FROM wallet_transactions WHERE user_id=$1`,[fanId]);
    const balance=Number(bal.rows[0]?.balance||0),price=Number(g.price_paise||0); if(balance<price){await client.query('ROLLBACK');return json(res,402,{error:'Insufficient wallet balance',balancePaise:balance,requiredPaise:price},rid);}
    const txId=id('gift_tx'); await client.query('INSERT INTO gift_transactions(id,gift_id,fan_id,creator_id,amount_paise) VALUES($1,$2,$3,$4,$5)',[txId,g.id,fanId,g.creator_id,price]);
    if(price>0){await client.query(`INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'debit',$3,'gift',$4,'completed')`,[id('wtx'),fanId,price,txId]);await client.query(`INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'credit',$3,'gift',$4,'completed')`,[id('wtx'),g.creator_id,price,txId]);}
    await client.query("INSERT INTO notifications(id,user_id,type,payload) VALUES($1,$2,'gift_received',$3::jsonb)",[id('notif'),g.creator_id,JSON.stringify({title:'New gift received',text:`${String(g.emoji||'🎁')} ${String(g.name||'Gift')} was sent.`,icon:g.emoji||'🎁',amountPaise:price})]); await client.query('COMMIT'); return json(res,200,{ok:true,transactionId:txId,gift:cleanGift(g),balancePaise:balance-price},rid);
   }catch(e){try{await client.query('ROLLBACK')}catch{};throw e}finally{client.release()}
  }
  if(s.role!=='admin'&&s.role!=='creator')return json(res,403,{error:'Creator access required'},rid);
  const creatorId=s.role==='admin'&&b.creatorId?String(b.creatorId):String(s.id);
  if(req.method==='POST'){
   const name=clean(b.name),emoji=clean(b.emoji||'🎁',12),price=cents(b.pricePaise); if(!name)return json(res,400,{error:'Gift name is required'},rid); if(name.length>120)return json(res,400,{error:'Gift name is too long'},rid);
   const cr=await db().query("SELECT id FROM users WHERE id=$1 AND role='creator'",[creatorId]);if(!cr.rowCount)return json(res,404,{error:'Creator not found'},rid);
   const r=await db().query('INSERT INTO creator_gifts(id,creator_id,emoji,name,price_paise,active) VALUES($1,$2,$3,$4,$5,true) RETURNING *',[id('gift'),creatorId,emoji,name,price]); return json(res,201,{gift:cleanGift(r.rows[0])},rid);
  }
  const giftId=String(b.id||q.id||'');if(!giftId)return json(res,400,{error:'Gift id is required'},rid);
  const owner=await db().query('SELECT * FROM creator_gifts WHERE id=$1',[giftId]);if(!owner.rowCount)return json(res,404,{error:'Gift not found'},rid);if(s.role!=='admin'&&String(owner.rows[0].creator_id)!==String(s.id))return json(res,403,{error:'Forbidden'},rid);
  if(req.method==='DELETE'){await db().query('DELETE FROM creator_gifts WHERE id=$1',[giftId]);return json(res,200,{ok:true},rid);}
  if(req.method==='PATCH'){
   const cur=owner.rows[0],name=clean(b.name??cur.name),emoji=clean(b.emoji??cur.emoji,12),price=cents(b.pricePaise??cur.price_paise),active=b.active===undefined?cur.active:!!b.active;if(!name)return json(res,400,{error:'Gift name is required'},rid);
   const r=await db().query('UPDATE creator_gifts SET name=$1,emoji=$2,price_paise=$3,active=$4,updated_at=now() WHERE id=$5 RETURNING *',[name,emoji,price,active,giftId]);return json(res,200,{gift:cleanGift(r.rows[0])},rid);
  }
 }catch(e){return json(res,e?.statusCode||500,{error:e?.statusCode?e.message:'Server error'},rid);}
}

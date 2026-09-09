import { db, json, body, requireSession, requestId, rateLimit, requireSameOrigin, id } from '../../lib.mjs';
import { presignDownload, deleteObject } from '../../storage/r2.mjs';
const MAX_TITLE=200, MAX_CONTENT=10000;
function clean(v,n=MAX_CONTENT){return String(v??'').replace(/[<>]/g,'').trim().slice(0,n);}
function cleanAccess(v){const x=String(v||'paid');return ['free','paid','subscription'].includes(x)?x:'paid';}
function cleanMedia(v){if(!Array.isArray(v))return [];return v.slice(0,20).map(x=>({name:clean(x?.name,180),type:clean(x?.type,120),size:Math.max(0,Math.trunc(Number(x?.size)||0)),storageKey:x?.storageKey?String(x.storageKey).slice(0,500):'',url:''})).filter(x=>x.name);}
function cursorDecode(v){if(!v)return null;try{const x=JSON.parse(Buffer.from(String(v),'base64url').toString());if(!x||typeof x.t!=='string'||typeof x.id!=='string')return null;const d=new Date(x.t);return Number.isNaN(d.getTime())?null:{t:d.toISOString(),id:x.id};}catch{return null;}}
function cursorEncode(r){return Buffer.from(JSON.stringify({t:new Date(r.created_at).toISOString(),id:String(r.id)})).toString('base64url');}
async function cleanPost(x,granted=false){
 const media=cleanMedia(x.media);
 if(granted){for(const m of media){if(m.storageKey){try{m.url=presignDownload(m.storageKey);}catch{m.url='';}}}} else {for(const m of media)m.storageKey='';}
 return {id:String(x.id),creatorId:String(x.creator_id),creatorName:x.creator_name||'',title:String(x.title||''),content:granted?String(x.content||''):null,text:granted?String(x.content||''):'',access:cleanAccess(x.access_type),pricePaise:Number(x.price_paise||0),price:Number(x.price_paise||0)/100,planId:x.plan_id?String(x.plan_id):null,blur:Number(x.blur??12),media,status:x.status,unlocked:!!granted,accessGranted:!!granted,createdAt:new Date(x.created_at).toISOString(),updatedAt:new Date(x.updated_at).toISOString()};}
async function viewerAccess(client,post,session){
 if(session.role==='admin'||(session.role==='creator'&&String(post.creator_id)===String(session.id)))return true;
 if(session.role!=='fan')return false;
 if(post.access_type==='free')return true;
 if(post.access_type==='subscription'&&post.plan_id){
  const sub=await client.query(`SELECT 1 FROM subscriptions s WHERE s.fan_id=$1 AND s.creator_id=$2 AND s.plan_id=$3 AND s.status='active' AND (s.expires_at IS NULL OR s.expires_at>now()) LIMIT 1`,[session.id,post.creator_id,post.plan_id]);
  if(sub.rowCount)return true;
  return false;
 }
 const u=await client.query('SELECT 1 FROM post_unlocks WHERE post_id=$1 AND fan_id=$2 LIMIT 1',[post.id,session.id]);
 return !!u.rowCount;
}
export default async function handler(req,res){
 const rid=requestId(req); try{
  const s=requireSession(req,res,[],rid); if(!s)return;
  if(!['GET','POST','PATCH','DELETE'].includes(req.method))return json(res,405,{error:'Method not allowed'},rid);
  if(req.method!=='GET'&&!requireSameOrigin(req,res,rid))return;
  if(!rateLimit(req,'posts',60,60000))return json(res,429,{error:'Too many requests'},rid);
  const b=req.method==='GET'?{}:await body(req); const q=req.query||{};
  if(req.method==='GET'){
   const creatorId=String(q.creatorId||'').slice(0,160); const cursor=cursorDecode(q.cursor); const includeDrafts=String(q.includeDrafts||'')==='1'&&(s.role==='admin'||(s.role==='creator'&&creatorId===String(s.id)));
   const params=[]; let where=includeDrafts?'p.status IN (\'draft\',\'published\')':"p.status='published'";
   if(creatorId){params.push(creatorId);where+=` AND p.creator_id=$${params.length}`;}
   if(cursor){params.push(cursor.t,cursor.id);where+=` AND (p.created_at,p.id)<($${params.length-1}::timestamptz,$${params.length})`;}
   params.push(25); const r=await db().query(`SELECT p.id,p.creator_id,p.title,p.content,p.access_type,p.price_paise,p.plan_id,p.blur,p.media,p.status,p.created_at,p.updated_at,u.name creator_name FROM posts p JOIN users u ON u.id=p.creator_id WHERE ${where} ORDER BY p.created_at DESC,p.id DESC LIMIT $${params.length}`,params);
   const posts=[]; for(const x of r.rows){const granted=await viewerAccess(db(),x,s);posts.push(await cleanPost(x,granted));}
   return json(res,200,{posts,cursor:r.rows.length?cursorEncode(r.rows[r.rows.length-1]):null},rid);
  }
  if(s.role!=='creator'&&s.role!=='admin'&&!(req.method==='POST'&&String(b.action||'')==='unlock'))return json(res,403,{error:'Creator access required'},rid);
  if(req.method==='POST'&&String(b.action||'')==='unlock'){
   if(s.role!=='fan'&&s.role!=='admin')return json(res,403,{error:'Fan access required'},rid);
   const fanId=s.role==='admin'&&b.fanId?String(b.fanId):String(s.id),postId=String(b.postId||''); if(!postId)return json(res,400,{error:'Post id is required'},rid);
   const client=await db().connect();
   try{
    await client.query('BEGIN');
    const pr=await client.query(`SELECT id,creator_id,title,content,access_type,price_paise,plan_id,blur,media,status,created_at,updated_at FROM posts WHERE id=$1 AND status='published' FOR SHARE`,[postId]);
    if(!pr.rowCount){await client.query('ROLLBACK');return json(res,404,{error:'Post not found'},rid);} const post=pr.rows[0];
    if(post.access_type==='free'){await client.query('COMMIT');return json(res,200,{post:await cleanPost(post,true),balancePaise:null},rid);}
    if(post.access_type==='subscription'){
      const sub=await client.query(`SELECT id FROM subscriptions WHERE fan_id=$1 AND creator_id=$2 AND plan_id=$3 AND status='active' AND (expires_at IS NULL OR expires_at>now()) FOR SHARE`,[fanId,post.creator_id,post.plan_id]);
      if(!sub.rowCount){await client.query('ROLLBACK');return json(res,402,{error:'Active subscription required'},rid);}
      await client.query('COMMIT');return json(res,200,{post:await cleanPost(post,true),balancePaise:null},rid);
    }
    const existing=await client.query('SELECT id FROM post_unlocks WHERE post_id=$1 AND fan_id=$2',[postId,fanId]);
    if(existing.rowCount){await client.query('COMMIT');return json(res,200,{post:await cleanPost(post,true),balancePaise:null,alreadyUnlocked:true},rid);}
    await client.query(`SELECT id FROM users WHERE id=$1 AND role='fan' AND status='active' FOR UPDATE`,[fanId]);
    const bal=await client.query(`SELECT COALESCE(SUM(CASE WHEN type IN ('credit','refund','adjustment') AND status='completed' THEN amount_paise ELSE 0 END),0)-COALESCE(SUM(CASE WHEN type='debit' AND status='completed' THEN amount_paise ELSE 0 END),0) AS balance FROM wallet_transactions WHERE user_id=$1`,[fanId]);
    const balance=Number(bal.rows[0]?.balance||0),price=Number(post.price_paise||0); if(balance<price){await client.query('ROLLBACK');return json(res,402,{error:'Insufficient wallet balance',balancePaise:balance,requiredPaise:price},rid);}
    await client.query('INSERT INTO post_unlocks(id,post_id,fan_id,amount_paise) VALUES($1,$2,$3,$4)',[id('punlock'),postId,fanId,price]);
    if(price>0){await client.query(`INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'debit',$3,'post_unlock',$4,'completed')`,[id('wtx'),fanId,price,postId]);await client.query(`INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'credit',$3,'post_unlock',$4,'completed')`,[id('wtx'),post.creator_id,price,postId]);}
    await client.query("INSERT INTO notifications(id,user_id,type,payload) VALUES($1,$2,'post_unlocked',$3::jsonb)",[id('notif'),post.creator_id,JSON.stringify({title:'Post unlocked',text:`A fan unlocked ${post.title||'your post'}.`,icon:'🔓',amountPaise:price,postId})]);
    await client.query('COMMIT'); return json(res,200,{post:await cleanPost(post,true),balancePaise:balance-price},rid);
   }catch(e){try{await client.query('ROLLBACK')}catch{};throw e}finally{client.release()}
  }
  if(req.method==='POST'){
   const content=clean(b.content),title=clean(b.title,MAX_TITLE),access=cleanAccess(b.accessType),price=Math.max(0,Math.trunc(Number(b.pricePaise)||0)),planId=b.planId?String(b.planId):null,blur=Math.min(30,Math.max(0,Math.trunc(Number(b.blur??12)||0))),media=cleanMedia(b.media),status=['draft','published'].includes(String(b.status))?String(b.status):'published';
  if(!title)return json(res,400,{error:'Post title is required'},rid); if(!content&&status==='published')return json(res,400,{error:'Content is required'},rid); if(access==='subscription'&&!planId)return json(res,400,{error:'Subscription plan is required'},rid); if(access!=='paid'&&price!==0)return json(res,400,{error:'Only paid posts can have a price'},rid);
   const creatorId=s.role==='admin'&&b.creatorId?String(b.creatorId):String(s.id);
   for(const m of media){if(m.storageKey&&!String(m.storageKey).startsWith(`creators/${String(creatorId).replace(/[^a-zA-Z0-9_-]/g,'_')}/posts/`))return json(res,400,{error:'Invalid media storage key'},rid);} const creator=await db().query("SELECT id FROM users WHERE id=$1 AND role='creator' AND status IN ('active','suspended')",[creatorId]); if(!creator.rowCount)return json(res,404,{error:'Creator not found'},rid);
   if(planId){const plan=await db().query('SELECT id FROM subscription_plans WHERE id=$1 AND creator_id=$2 AND active=true',[planId,creatorId]);if(!plan.rowCount)return json(res,400,{error:'Subscription plan is not active'} ,rid);}
   const r=await db().query(`INSERT INTO posts(id,creator_id,title,content,access_type,price_paise,plan_id,blur,media,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) RETURNING *`,[id('post'),creatorId,title,content,access,price,planId,blur,JSON.stringify(media),status]);
   return json(res,201,{post:await cleanPost(r.rows[0],true)},rid);
  }
  const postId=String(b.id||q.id||''); if(!postId)return json(res,400,{error:'Post id is required'},rid);
  const owner=await db().query('SELECT * FROM posts WHERE id=$1',[postId]); if(!owner.rowCount)return json(res,404,{error:'Post not found'},rid); if(s.role!=='admin'&&owner.rows[0].creator_id!==s.id)return json(res,403,{error:'Forbidden'},rid);
  if(req.method==='DELETE'){const oldMedia=cleanMedia(owner.rows[0].media);await db().query("UPDATE posts SET status='archived',updated_at=now() WHERE id=$1",[postId]);for(const m of oldMedia)if(m.storageKey){try{await deleteObject(m.storageKey)}catch{}}return json(res,200,{ok:true},rid);}
  const cur=owner.rows[0],oldMedia=cleanMedia(cur.media),content=clean(b.content??cur.content),title=clean(b.title??cur.title,MAX_TITLE),access=cleanAccess(b.accessType??cur.access_type),price=Math.max(0,Math.trunc(Number(b.pricePaise??cur.price_paise)||0)),planId=(b.planId??cur.plan_id)?String(b.planId??cur.plan_id):null,blur=Math.min(30,Math.max(0,Math.trunc(Number(b.blur??cur.blur)||0))),media=b.media===undefined?cleanMedia(cur.media):cleanMedia(b.media),status=['draft','published','archived','removed'].includes(String(b.status))?String(b.status):cur.status;
  if(!title)return json(res,400,{error:'Post title is required'},rid); if(!content&&status==='published')return json(res,400,{error:'Content is required'},rid); if(access==='subscription'&&!planId)return json(res,400,{error:'Subscription plan is required'},rid); if(access!=='paid'&&price!==0)return json(res,400,{error:'Only paid posts can have a price'},rid); if(planId){const plan=await db().query('SELECT id FROM subscription_plans WHERE id=$1 AND creator_id=$2 AND active=true',[planId,creatorId]);if(!plan.rowCount)return json(res,400,{error:'Subscription plan is not active'},rid);}
  const r=await db().query(`UPDATE posts SET title=$1,content=$2,access_type=$3,price_paise=$4,plan_id=$5,blur=$6,media=$7::jsonb,status=$8,updated_at=now() WHERE id=$9 RETURNING *`,[title,content,access,price,planId,blur,JSON.stringify(media),status,postId]);
  const newKeys=new Set(media.map(m=>m.storageKey).filter(Boolean)); for(const m of oldMedia)if(m.storageKey&&!newKeys.has(m.storageKey)){try{await deleteObject(m.storageKey)}catch{}}
  return json(res,200,{post:await cleanPost(r.rows[0],true)},rid);
 }catch(e){return json(res,e?.statusCode||500,{error:e?.statusCode?e.message:'Server error'},rid);}
}

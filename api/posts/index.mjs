import { db, json, body, requireSession, requestId, rateLimit, requireSameOrigin, id } from '../../lib.mjs';
const MAX_CONTENT=10000;
function clean(v){return String(v??'').replace(/[<>]/g,'').trim().slice(0,MAX_CONTENT);}
function cursorDecode(v){if(!v)return null;try{const x=JSON.parse(Buffer.from(String(v),'base64url').toString());if(!x||typeof x.t!=='string'||typeof x.id!=='string')return null;const d=new Date(x.t);return Number.isNaN(d.getTime())?null:{t:d.toISOString(),id:x.id};}catch{return null;}}
function cursorEncode(r){return Buffer.from(JSON.stringify({t:new Date(r.created_at).toISOString(),id:String(r.id)})).toString('base64url');}
export default async function handler(req,res){
 const rid=requestId(req); try{
  const s=requireSession(req,res,[],rid); if(!s)return;
  if(!['GET','POST','PATCH','DELETE'].includes(req.method))return json(res,405,{error:'Method not allowed'},rid);
  if(req.method!=='GET'&&!requireSameOrigin(req,res,rid))return;
  if(!rateLimit(req,'posts',60,60000))return json(res,429,{error:'Too many requests'},rid);
  const b=req.method==='GET'?{}:await body(req); const q=req.query||{};
  if(req.method==='GET'){
   const creatorId=String(q.creatorId||'').slice(0,160); const cursor=cursorDecode(q.cursor); const params=[]; let where="p.status='published'";
   if(creatorId){params.push(creatorId);where+=` AND p.creator_id=$${params.length}`;}
   if(cursor){params.push(cursor.t,cursor.id);where+=` AND (p.created_at,p.id)<($${params.length-1}::timestamptz,$${params.length})`;}
   params.push(25); const r=await db().query(`SELECT p.id,p.creator_id,p.content,p.status,p.created_at,p.updated_at,u.name creator_name FROM posts p JOIN users u ON u.id=p.creator_id WHERE ${where} ORDER BY p.created_at DESC,p.id DESC LIMIT $${params.length}`,params);
   return json(res,200,{posts:r.rows.map(x=>({id:x.id,creatorId:x.creator_id,creatorName:x.creator_name,content:x.content,status:x.status,createdAt:new Date(x.created_at).toISOString(),updatedAt:new Date(x.updated_at).toISOString()})),cursor:r.rows.length?cursorEncode(r.rows[r.rows.length-1]):null},rid);
  }
  if(s.role!=='creator'&&s.role!=='admin')return json(res,403,{error:'Creator access required'},rid);
  if(req.method==='POST'){
   const content=clean(b.content); if(!content)return json(res,400,{error:'Content is required'},rid);
   const creatorId=s.role==='admin'&&b.creatorId?String(b.creatorId):s.id; const creator=await db().query("SELECT id FROM users WHERE id=$1 AND role='creator' AND status IN ('active','suspended')",[creatorId]); if(!creator.rowCount)return json(res,404,{error:'Creator not found'},rid); const status=['draft','published'].includes(String(b.status))?String(b.status):'published';
   const r=await db().query(`INSERT INTO posts(id,creator_id,content,status) VALUES($1,$2,$3,$4) RETURNING id,creator_id,content,status,created_at,updated_at`,[id('post'),creatorId,content,status]);
   return json(res,201,{post:r.rows[0]},rid);
  }
  const postId=String(b.id||q.id||''); if(!postId)return json(res,400,{error:'Post id is required'},rid);
  const owner=await db().query('SELECT id,creator_id,status FROM posts WHERE id=$1',[postId]); if(!owner.rowCount)return json(res,404,{error:'Post not found'},rid);
  if(s.role!=='admin'&&owner.rows[0].creator_id!==s.id)return json(res,403,{error:'Forbidden'},rid);
  if(req.method==='DELETE'){await db().query("UPDATE posts SET status='archived',updated_at=now() WHERE id=$1",[postId]);return json(res,200,{ok:true},rid);}
  const content=clean(b.content); if(!content)return json(res,400,{error:'Content is required'},rid); const status=['draft','published','archived','removed'].includes(String(b.status))?String(b.status):owner.rows[0].status;
  const r=await db().query(`UPDATE posts SET content=$1,status=$2,updated_at=now() WHERE id=$3 RETURNING id,creator_id,content,status,created_at,updated_at`,[content,status,postId]);
  return json(res,200,{post:r.rows[0]},rid);
 }catch(e){return json(res,e?.statusCode||500,{error:e?.statusCode?e.message:'Server error'},rid);}
}

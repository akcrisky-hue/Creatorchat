import { db, json, body, requireSession, requestId, rateLimit, requireSameOrigin, id } from '../../lib.mjs';
import { validateMedia, mediaKey, presignUpload, presignDownload, deleteObject, isConfigured, limits } from '../../storage/r2.mjs';

function ownedKey(key, creatorId){return String(key||'').startsWith(`creators/${String(creatorId).replace(/[^a-zA-Z0-9_-]/g,'_')}/posts/`);}
export default async function handler(req,res){
 const rid=requestId(req); try{
  const s=requireSession(req,res,['creator','admin','fan'],rid); if(!s)return;
  if(!['POST','DELETE'].includes(req.method))return json(res,405,{error:'Method not allowed'},rid);
  if(!requireSameOrigin(req,res,rid))return;
  if(!rateLimit(req,'storage',30,60000))return json(res,429,{error:'Too many requests'},rid);
  if(!isConfigured())return json(res,503,{error:'Post storage is not configured yet'},rid);
  const b=await body(req), action=String(b.action||'');
  if(req.method==='POST'&&action==='presign-upload'){
   if(s.role!=='creator'&&s.role!=='admin')return json(res,403,{error:'Creator access required'},rid);
   const creatorId=s.role==='admin'&&b.creatorId?String(b.creatorId):String(s.id), meta=validateMedia(b), mediaId=id('media'), key=mediaKey(creatorId,mediaId,meta.name);
   return json(res,200,{uploadUrl:presignUpload(key,meta.type),media:{id:mediaId,name:meta.name,type:meta.type,size:meta.size,storageKey:key}},rid);
  }
  if(req.method==='POST'&&action==='presign-download'){
   const key=String(b.storageKey||''); if(!key)return json(res,400,{error:'Storage key is required'},rid);
   let creatorId=s.role==='creator'?String(s.id):String(b.creatorId||'');
   if(s.role==='fan'){
    const postId=String(b.postId||''); if(!postId)return json(res,400,{error:'Post id is required'},rid);
    const p=await db().query(`SELECT id,creator_id,access_type,plan_id,status FROM posts WHERE id=$1`,[postId]); if(!p.rowCount||p.rows[0].status!=='published')return json(res,404,{error:'Post not found'},rid);
    const post=p.rows[0]; creatorId=String(post.creator_id); let allowed=post.access_type==='free';
    if(post.access_type==='subscription'&&post.plan_id){const q=await db().query(`SELECT 1 FROM subscriptions WHERE fan_id=$1 AND creator_id=$2 AND plan_id=$3 AND status='active' AND (expires_at IS NULL OR expires_at>now()) LIMIT 1`,[s.id,post.creator_id,post.plan_id]);allowed=!!q.rowCount;}
    if(post.access_type==='paid'){const q=await db().query('SELECT 1 FROM post_unlocks WHERE post_id=$1 AND fan_id=$2 LIMIT 1',[postId,s.id]);allowed=!!q.rowCount;}
    if(!allowed||!ownedKey(key,String(post.creator_id)))return json(res,403,{error:'Post media access denied'},rid);
    const mediaMatch=await db().query(`SELECT 1 FROM posts WHERE id=$1 AND EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(media,'[]'::jsonb)) AS m WHERE m->>'storageKey'=$2) LIMIT 1`,[postId,key]);
    if(!mediaMatch.rowCount||!ownedKey(key,String(post.creator_id)))return json(res,403,{error:'Post media access denied'},rid);
    if(!ownedKey(key,creatorId))return json(res,403,{error:'Post media access denied'},rid);
   }
   if(s.role!=='admin'&&!ownedKey(key,creatorId))return json(res,403,{error:'Forbidden'},rid);
   return json(res,200,{url:presignDownload(key)},rid);
  }
  if(req.method==='DELETE'){
   if(s.role!=='creator'&&s.role!=='admin')return json(res,403,{error:'Creator access required'},rid);
   const key=String(b.storageKey||''); if(!key)return json(res,400,{error:'Storage key is required'},rid);
   if(s.role!=='admin'&&!ownedKey(key,s.id))return json(res,403,{error:'Forbidden'},rid);
   await deleteObject(key); return json(res,200,{ok:true},rid);
  }
  return json(res,400,{error:'Unknown storage action',limits},rid);
 }catch(e){return json(res,e?.statusCode||500,{error:e?.statusCode?e.message:'Server error'},rid);}
}

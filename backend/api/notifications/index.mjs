import { db, json, body, requireSession, requestId, rateLimit, requireSameOrigin, id } from '../../lib.mjs';
export default async function handler(req,res){
 const rid=requestId(req); try{
  const s=requireSession(req,res,[],rid); if(!s)return;
  if(!['GET','PATCH'].includes(req.method))return json(res,405,{error:'Method not allowed'},rid);
  if(req.method==='PATCH'&&!requireSameOrigin(req,res,rid))return;
  if(!rateLimit(req,'notifications',60,60000))return json(res,429,{error:'Too many requests'},rid);
  if(req.method==='GET'){
   const q=req.query||{}; const unread=String(q.unread||'')==='true'; const limit=Math.min(Math.max(Number(q.limit)||25,1),100); const r=await db().query(`SELECT id,type,payload,read,created_at FROM notifications WHERE user_id=$1 ${unread?'AND read=false':''} ORDER BY created_at DESC LIMIT $2`,[s.id,limit]);
   return json(res,200,{notifications:r.rows.map(x=>({id:x.id,type:x.type,payload:x.payload,read:x.read,createdAt:new Date(x.created_at).toISOString()}))},rid);
  }
  const b=await body(req); const notificationId=String(b.id||''); if(notificationId){const r=await db().query('UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2 RETURNING id',[notificationId,s.id]);return json(res,200,{ok:true,updated:r.rowCount},rid);}
  if(b.allRead===true){const r=await db().query('UPDATE notifications SET read=true WHERE user_id=$1 AND read=false',[s.id]);return json(res,200,{ok:true,updated:r.rowCount},rid);}
  return json(res,400,{error:'Notification id or allRead is required'},rid);
 }catch(e){return json(res,e?.statusCode||500,{error:e?.statusCode?e.message:'Server error'},rid);}
}
export async function createNotification(userId,type,payload={}){const r=await db().query('INSERT INTO notifications(id,user_id,type,payload) VALUES($1,$2,$3,$4) RETURNING id,type,payload,read,created_at',[id('notif'),userId,String(type).slice(0,120),JSON.stringify(payload)]);return r.rows[0];}

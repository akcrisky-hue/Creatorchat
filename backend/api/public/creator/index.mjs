import { db, json, requestId, rateLimit } from '../../../lib.mjs';
function slugify(v){return String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70);}
export default async function handler(req,res){
  const rid=requestId(req);
  try{
    if(req.method!=='GET')return json(res,405,{error:'Method not allowed'},rid);
    if(!rateLimit(req,'public-creator',60,60000))return json(res,429,{error:'Too many requests'},rid);
    const slug=String(req.query?.slug||'').trim().toLowerCase();
    if(!slug||slug.length>100)return json(res,400,{error:'slug is required'},rid);
    const r=await db().query(`SELECT u.id,u.name,u.status,p.display_name,p.bio,p.chat_price_paise
      FROM users u LEFT JOIN creator_profiles p ON p.user_id=u.id
      WHERE u.role='creator' AND u.status IN ('active','suspended')
      AND lower(regexp_replace(regexp_replace(coalesce(nullif(p.display_name,''),u.name),'[^a-zA-Z0-9]+','-','g'),'^-+|-+$','','g'))=$1
      ORDER BY p.updated_at DESC NULLS LAST,u.created_at ASC LIMIT 1`,[slugify(slug)]);
    if(!r.rowCount)return json(res,404,{error:'Creator not found'},rid);
    const x=r.rows[0];
    return json(res,200,{creator:{id:x.id,name:x.name,displayName:x.display_name||x.name,bio:x.bio||'',chatPricePaise:Number(x.chat_price_paise||0),status:x.status}},rid);
  }catch(e){return json(res,500,{error:'Server error'},rid);}
}

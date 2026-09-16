import { db, json, requestId, rateLimit } from '../../../lib.mjs';
import { presignDownload } from '../../../storage/r2.mjs';
function slugify(v){return String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70);}
export default async function handler(req,res){
  const rid=requestId(req);
  try{
    if(req.method!=='GET')return json(res,405,{error:'Method not allowed'},rid);
    if(!rateLimit(req,'public-creator',60,60000))return json(res,429,{error:'Too many requests'},rid);
    const slug=String(req.query?.slug||'').trim().toLowerCase();
    const creatorId=String(req.query?.creatorId||'').trim();
    if((!slug&&!creatorId)||slug.length>100||creatorId.length>160)return json(res,400,{error:'creator link is required'},rid);
    const r=await db().query(`SELECT u.id,u.name,u.status,p.display_name,p.bio,p.chat_price_paise,p.profile_pic_url,p.cover_url,p.public_email,p.profile_pic_key,p.cover_key,u.email
      FROM users u LEFT JOIN creator_profiles p ON p.user_id=u.id
      WHERE u.role='creator' AND u.status='active'
      AND (($1<>'' AND u.id=$1) OR ($1='' AND $2<>'' AND lower(regexp_replace(regexp_replace(coalesce(nullif(p.display_name,''),u.name),'[^a-zA-Z0-9]+','-','g'),'^-+|-+$','','g'))=$2))
      ORDER BY CASE WHEN $1<>'' AND u.id=$1 THEN 0 ELSE 1 END,p.updated_at DESC NULLS LAST,u.created_at ASC LIMIT 1`,[creatorId,slugify(slug)]);
    if(!r.rowCount)return json(res,404,{error:'Creator not found'},rid);
    const x=r.rows[0];
    return json(res,200,{creator:{id:x.id,name:x.name,displayName:x.display_name||x.name,bio:x.bio||'',chatPricePaise:Number(x.chat_price_paise||0),email:x.public_email||x.email||'',profilePic:x.profile_pic_key?presignDownload(x.profile_pic_key):(x.profile_pic_url||''),coverUrl:x.cover_key?presignDownload(x.cover_key):(x.cover_url||''),status:x.status}},rid);
  }catch(e){return json(res,500,{error:'Server error'},rid);}
}

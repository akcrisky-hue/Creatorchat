import { db, json, requireSession, requestId, rateLimit } from '../../lib.mjs';

export default async function handler(req,res){
  const rid=requestId(req);
  try{
    const s=requireSession(req,res,[],rid); if(!s)return;
    if(req.method!=='GET') return json(res,405,{error:'Method not allowed'},rid);
    if(!rateLimit(req,'wallet-read',60,60000)) return json(res,429,{error:'Too many requests'},rid);
    const limitRaw=Number(req.query?.limit||25);
    const limit=Math.min(100,Math.max(1,Number.isInteger(limitRaw)?limitRaw:25));
    const q=await db().query(`
      SELECT
        COALESCE(SUM(CASE WHEN type IN ('credit','refund','adjustment') AND status='completed' THEN amount_paise ELSE 0 END),0)
        - COALESCE(SUM(CASE WHEN type='debit' AND status='completed' THEN amount_paise ELSE 0 END),0) AS balance_paise
      FROM wallet_transactions WHERE user_id=$1
    `,[s.id]);
    const tx=await db().query(`
      SELECT id,type,amount_paise AS "amountPaise",reference_type AS "referenceType",reference_id AS "referenceId",status,created_at AS "createdAt"
      FROM wallet_transactions WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT $2
    `,[s.id,limit]);
    return json(res,200,{balancePaise:Number(q.rows[0]?.balance_paise||0),transactions:tx.rows},rid);
  }catch{return json(res,500,{error:'Server error'},rid);}
}

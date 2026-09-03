import { db, json, body, requireSession, id, requestId, rateLimit, requireSameOrigin } from '../../lib.mjs';
export default async function handler(req,res){
  const rid=requestId(req);
  try{
    const s=requireSession(req,res,[],rid);if(!s)return;
    if(req.method==='GET'){
      const chatId=String(req.query?.chatId||'');
      const limit=Math.min(Math.max(Number(req.query?.limit||50),1),100);
      if(!chatId)return json(res,400,{error:'chatId is required'},rid);
      const access=await db().query(`SELECT 1 FROM chats WHERE id=$1 AND ($3='admin' OR fan_id=$2 OR creator_id=$2)`,[chatId,s.id,s.role]);
      if(!access.rowCount)return json(res,403,{error:'Not permitted'},rid);
      const q=await db().query(`SELECT id,chat_id AS "chatId",sender_id AS "senderId",body,status,created_at AS "createdAt" FROM messages WHERE chat_id=$1 ORDER BY created_at DESC,id DESC LIMIT $2`,[chatId,limit]);
      return json(res,200,{items:q.rows.reverse()},rid);
    }
    if(req.method==='POST'){
      if(!requireSameOrigin(req,res,rid))return;
      if(!rateLimit(req,'message-create',60,60000))return json(res,429,{error:'Too many requests'},rid);
      const b=await body(req),chatId=String(b.chatId||''),text=String(b.body||'').trim();
      if(!chatId||!text||text.length>4000)return json(res,400,{error:'chatId and body (1-4000 chars) are required'},rid);
      const requestedId=String(b.id||'').trim().slice(0,120);
      const messageId=requestedId||id('msg');
      const client=await db().connect();
      try{
        await client.query('BEGIN');
        const access=await client.query(`SELECT c.id,c.fan_id,c.creator_id,c.status,COALESCE(cp.chat_price_paise,0) AS chat_price_paise FROM chats c LEFT JOIN creator_profiles cp ON cp.user_id=c.creator_id WHERE c.id=$1 AND ($3='admin' OR c.fan_id=$2 OR c.creator_id=$2) AND c.status='active' FOR UPDATE`,[chatId,s.id,s.role]);
        if(!access.rowCount){await client.query('ROLLBACK');return json(res,403,{error:'Not permitted'},rid);}
        const chat=access.rows[0];
        const existing=await client.query(`SELECT id,chat_id AS "chatId",sender_id AS "senderId",body,status,created_at AS "createdAt" FROM messages WHERE id=$1`,[messageId]);
        if(existing.rowCount){
          await client.query('ROLLBACK');
          if(String(existing.rows[0].chatId)!==chatId||String(existing.rows[0].senderId)!==String(s.id))return json(res,409,{error:'Message id already exists'},rid);
          return json(res,200,{message:existing.rows[0],alreadyProcessed:true},rid);
        }
        const isFan=s.role==='fan' && String(chat.fan_id)===String(s.id);
        const price=Number(chat.chat_price_paise||0);
        if(isFan && price>0){
          // Serialize wallet-changing chat sends for this fan, even across multiple chats.
          // A row-level lock on one chat is not enough to prevent concurrent overspending.
          await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`,[`wallet:${s.id}`]);
          const bal=await client.query(`SELECT COALESCE(SUM(CASE WHEN type IN ('credit','refund','adjustment') AND status='completed' THEN amount_paise WHEN type='debit' AND status='completed' THEN -amount_paise ELSE 0 END),0) AS balance FROM wallet_transactions WHERE user_id=$1`,[s.id]);
          const balance=Number(bal.rows[0].balance||0);
          if(balance<price){await client.query('ROLLBACK');return json(res,402,{error:'Insufficient wallet balance',requiredPaise:price,balancePaise:balance},rid);}
          await client.query(`INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'debit',$3,'chat_message',$4,'completed')`,[id('wtx'),s.id,price,messageId]);
          await client.query(`INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'credit',$3,'chat_message',$4,'completed')`,[id('wtx'),chat.creator_id,price,messageId]);
        }
        const q=await client.query(`INSERT INTO messages(id,chat_id,sender_id,body) VALUES($1,$2,$3,$4) RETURNING id,chat_id AS "chatId",sender_id AS "senderId",body,status,created_at AS "createdAt"`,[messageId,chatId,s.id,text]);
        await client.query(`UPDATE chats SET updated_at=now() WHERE id=$1`,[chatId]);
        await client.query('COMMIT');
        return json(res,201,{message:q.rows[0],chargedPaise:isFan?price:0},rid);
      }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
    }
    return json(res,405,{error:'Method not allowed'},rid);
  }catch(e){return json(res,e?.statusCode||500,{error:e?.statusCode?e.message:'Server error'},rid);}
}

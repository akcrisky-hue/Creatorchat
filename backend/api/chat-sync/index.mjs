import { db, json, body, requireSession, requestId, rateLimit, requireSameOrigin } from '../../lib.mjs';

const MAX_BATCH = 25;
const MAX_TEXT = 4000;

function cursorDecode(value){
  if(!value) return null;
  try { const x=JSON.parse(Buffer.from(String(value),'base64url').toString());
    if(!x || typeof x.t!=='string' || typeof x.id!=='string') return null;
    const d=new Date(x.t); if(Number.isNaN(d.getTime())) return null;
    return {t:d.toISOString(),id:x.id};
  } catch { return null; }
}
function cursorEncode(row){
  return Buffer.from(JSON.stringify({t:new Date(row.created_at).toISOString(),id:String(row.id)})).toString('base64url');
}
function cleanText(value){return String(value??'').replace(/[<>]/g,'').trim().slice(0,MAX_TEXT);}

export default async function handler(req,res){
  const rid=requestId(req);
  try{
    const s=requireSession(req,res,[],rid); if(!s)return;
    if(req.method!=='POST') return json(res,405,{error:'Method not allowed'},rid);
    if(!requireSameOrigin(req,res,rid)) return;
    if(!rateLimit(req,'chat-sync',30,60000)) return json(res,429,{error:'Too many requests'},rid);
    const b=await body(req);
    const changes=Array.isArray(b.changes)?b.changes.slice(0,MAX_BATCH):[];
    const cursor=cursorDecode(b.cursor);
    const client=await db().connect();
    try{
      await client.query('BEGIN');
      const saved=[];
      for(const c of changes){
        const m=c?.message||{}; const operation=String(c?.operation||'upsert'); const messageId=String(m.id||''); const chatId=String(m.chatId||'');
        if(!messageId || !chatId || messageId.length>160 || chatId.length>160) continue;
        const chat=await client.query(`SELECT c.id,c.fan_id,c.creator_id,c.status,COALESCE(cp.chat_price_paise,0) AS chat_price_paise FROM chats c LEFT JOIN creator_profiles cp ON cp.user_id=c.creator_id WHERE c.id=$1 AND (c.fan_id=$2 OR c.creator_id=$2) FOR UPDATE`,[chatId,s.id]);
        if(!chat.rowCount || chat.rows[0].status==='blocked') continue;
        const cRow=chat.rows[0];
        if(operation==='delete'){
          const q=await client.query(`UPDATE messages SET status='deleted',body='' WHERE id=$1 AND chat_id=$2 AND sender_id=$3 RETURNING id`,[messageId,chatId,s.id]);
          saved.push(messageId);
          continue;
        }
        if(String(m.senderId||s.id)!==s.id) continue;
        const text=cleanText(m.body??m.text);
        if(!text) continue;
        const existing=await client.query(`SELECT id,chat_id AS "chatId",sender_id AS "senderId",body,status,created_at AS "createdAt" FROM messages WHERE id=$1`,[messageId]);
        if(existing.rowCount){
          const old=existing.rows[0];
          if(String(old.chatId)!==chatId||String(old.senderId)!==String(s.id)) continue;
          saved.push(messageId);
          continue;
        }
        const isFan=s.role==='fan' && String(cRow.fan_id)===String(s.id);
        const price=Number(cRow.chat_price_paise||0);
        if(isFan && price>0){
          await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`,[`wallet:${s.id}`]);
          const bal=await client.query(`SELECT COALESCE(SUM(CASE WHEN type IN ('credit','refund','adjustment') AND status='completed' THEN amount_paise WHEN type='debit' AND status='completed' THEN -amount_paise ELSE 0 END),0) AS balance FROM wallet_transactions WHERE user_id=$1`,[s.id]);
          const balance=Number(bal.rows[0]?.balance||0);
          if(balance<price) continue;
          await client.query(`INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'debit',$3,'chat_message',$4,'completed') ON CONFLICT(reference_type,reference_id,type) DO NOTHING`,[id('wtx'),s.id,price,messageId]);
          const debit=await client.query(`SELECT 1 FROM wallet_transactions WHERE reference_type='chat_message' AND reference_id=$1 AND type='debit' LIMIT 1`,[messageId]);
          if(!debit.rowCount) continue;
          await client.query(`INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'credit',$3,'chat_message',$4,'completed') ON CONFLICT(reference_type,reference_id,type) DO NOTHING`,[id('wtx'),cRow.creator_id,price,messageId]);
        }
        const q=await client.query(`INSERT INTO messages(id,chat_id,sender_id,body,status,created_at)
          VALUES($1,$2,$3,$4,'sent',COALESCE($5::timestamptz,now()))
          ON CONFLICT(id) DO UPDATE SET body=EXCLUDED.body,status=CASE WHEN messages.status='deleted' THEN messages.status ELSE EXCLUDED.status END
          WHERE messages.sender_id=$3 AND messages.chat_id=$2
          RETURNING id,chat_id,sender_id,body,status,created_at`,[messageId,chatId,s.id,text,m.createdAt||null]);
        if(q.rowCount) saved.push(messageId);
        if(q.rowCount) await client.query('UPDATE chats SET updated_at=now() WHERE id=$1',[chatId]);
      }
      let where=`c.id IN (SELECT DISTINCT chat_id FROM messages WHERE chat_id IS NOT NULL) AND (c.fan_id=$1 OR c.creator_id=$1)`;
      const params=[s.id];
      if(cursor){params.push(cursor.t,cursor.id);where+=` AND (m.created_at,m.id)>($2::timestamptz,$3)`;}
      const q=await client.query(`SELECT m.id,m.chat_id,m.sender_id,m.body,m.status,m.created_at
        FROM messages m JOIN chats c ON c.id=m.chat_id WHERE ${where}
        ORDER BY m.created_at ASC,m.id ASC LIMIT ${MAX_BATCH}` ,params);
      await client.query('COMMIT');
      const messages=q.rows.map(r=>({id:r.id,chatId:r.chat_id,senderId:r.sender_id,body:r.body,text:r.body,status:r.status,createdAt:new Date(r.created_at).toISOString()}));
      const next=q.rows.length?cursorEncode(q.rows[q.rows.length-1]):(cursor?b.cursor:null);
      return json(res,200,{ok:true,messages,acknowledgedMessageIds:saved,cursor:next,savedCount:saved.length},rid);
    }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
  }catch(e){return json(res,e?.statusCode||500,{error:e?.statusCode?e.message:'Server error'},rid);}
}

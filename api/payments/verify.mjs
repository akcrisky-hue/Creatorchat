import { db, json, body, requireSession, verifyRazorpaySignature, requestId, rateLimit, requireSameOrigin, id } from '../../lib.mjs';

export default async function handler(req,res){
  const rid=requestId(req);
  try{
    const s=requireSession(req,res,[],rid); if(!s)return;
    if(req.method!=='POST')return json(res,405,{error:'Method not allowed'},rid);
    if(!requireSameOrigin(req,res,rid))return;
    if(!rateLimit(req,'payment-verify',20,60000))return json(res,429,{error:'Too many requests'},rid);
    const b=await body(req),orderId=String(b.razorpay_order_id||''),paymentId=String(b.razorpay_payment_id||''),signature=String(b.razorpay_signature||'');
    if(!orderId||!paymentId||!signature)return json(res,400,{error:'Missing Razorpay verification fields'},rid);
    if(!process.env.RAZORPAY_KEY_SECRET)return json(res,503,{error:'Razorpay server credentials are not configured'},rid);
    if(!verifyRazorpaySignature(orderId,paymentId,signature))return json(res,400,{error:'Invalid payment signature'},rid);

    const client=await db().connect();
    try{
      await client.query('BEGIN');
      const q=await client.query(`SELECT id,amount_paise AS "amountPaise",status,provider_payment_id AS "providerPaymentId" FROM payment_orders WHERE provider_order_id=$1 AND user_id=$2 FOR UPDATE`,[orderId,s.id]);
      if(!q.rowCount){await client.query('ROLLBACK');return json(res,404,{error:'Payment order not found'},rid);}
      const order=q.rows[0];
      if(order.status==='paid'){
        await client.query('COMMIT');
        return json(res,200,{ok:true,alreadyProcessed:true,order},rid);
      }
      if(order.status!=='created'){await client.query('ROLLBACK');return json(res,409,{error:'Payment order is not payable'},rid);}

      const updated=await client.query(`UPDATE payment_orders SET provider_payment_id=$1,status='paid',updated_at=now() WHERE id=$2 AND status='created' RETURNING id,amount_paise AS "amountPaise",status,provider_payment_id AS "providerPaymentId"`,[paymentId,order.id]);
      if(!updated.rowCount){await client.query('ROLLBACK');return json(res,409,{error:'Payment order was already processed'},rid);}
      await client.query(`INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'credit',$3,'payment_order',$4,'completed') ON CONFLICT (id) DO NOTHING`,[id('wtx'),s.id,order.amountPaise,order.id]);
      await client.query('COMMIT');
      return json(res,200,{ok:true,order:updated.rows[0],walletCreditPaise:order.amountPaise},rid);
    }catch(e){try{await client.query('ROLLBACK')}catch{};throw e}finally{client.release();}
  }catch{return json(res,500,{error:'Server error'},rid);}
}

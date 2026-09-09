import { db, json, body, requireSession, verifyRazorpaySignature, requestId, rateLimit, requireSameOrigin, id, razorpayAuth } from '../../lib.mjs';

export default async function handler(req,res){
  const rid=requestId(req);
  try{
    const s=requireSession(req,res,[],rid); if(!s)return;
    if(req.method!=='POST')return json(res,405,{error:'Method not allowed'},rid);
    if(!requireSameOrigin(req,res,rid))return;
    if(!rateLimit(req,'payment-verify',20,60000))return json(res,429,{error:'Too many requests'},rid);
    const b=await body(req),orderId=String(b.razorpay_order_id||''),paymentId=String(b.razorpay_payment_id||''),signature=String(b.razorpay_signature||'');
    const rechargeBonusRupees=(rupees)=>{const a=Number(rupees);if(a>3000)return Math.floor(a*0.10);if(a===3000)return 300;if(a>=2000)return 150;if(a>=1500)return 100;if(a>=1000)return 50;return 0;};
    if(!orderId||!paymentId||!signature)return json(res,400,{error:'Missing Razorpay verification fields'},rid);
    if(!process.env.RAZORPAY_KEY_SECRET)return json(res,503,{error:'Razorpay server credentials are not configured'},rid);
    if(!verifyRazorpaySignature(orderId,paymentId,signature))return json(res,400,{error:'Invalid payment signature'},rid);

    // Defense-in-depth: verify the payment directly with Razorpay before crediting the wallet.
    // The signature proves the checkout response was signed for this order/payment pair;
    // the provider lookup additionally confirms order, amount, currency and captured status.
    const auth=razorpayAuth();
    const providerRes=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:auth}});
    const provider=await providerRes.json().catch(()=>({}));
    if(!providerRes.ok)return json(res,400,{error:'Razorpay payment could not be verified'},rid);
    if(String(provider.order_id||'')!==orderId)return json(res,400,{error:'Payment does not belong to this order'},rid);
    if(String(provider.currency||'')!=='INR')return json(res,400,{error:'Unsupported payment currency'},rid);
    if(String(provider.status||'')!=='captured')return json(res,409,{error:'Payment is not captured'},rid);

    const client=await db().connect();
    try{
      await client.query('BEGIN');
      const q=await client.query(`SELECT id,amount_paise AS "amountPaise",status,provider_payment_id AS "providerPaymentId" FROM payment_orders WHERE provider_order_id=$1 AND user_id=$2 FOR UPDATE`,[orderId,s.id]);
      if(!q.rowCount){await client.query('ROLLBACK');return json(res,404,{error:'Payment order not found'},rid);}
      const order=q.rows[0];
      if(String(order.providerPaymentId||'') && String(order.providerPaymentId)!==paymentId){await client.query('ROLLBACK');return json(res,409,{error:'Payment order is already linked to another payment'},rid);}
      if(!Number.isInteger(Number(order.amountPaise)) || Number(order.amountPaise)%100!==0 || Number(order.amountPaise)<50000 || Number(order.amountPaise)>1000000){
        await client.query('ROLLBACK');
        return json(res,409,{error:'Wallet recharge amount is outside the allowed range'},rid);
      }
      if(!Number.isInteger(Number(provider.amount)) || Number(provider.amount)!==Number(order.amountPaise)){await client.query('ROLLBACK');return json(res,409,{error:'Payment amount does not match the order'},rid);}
      const bonusRupees=rechargeBonusRupees(Number(order.amountPaise)/100);
      const walletCreditPaise=Number(order.amountPaise)+(bonusRupees*100);
      if(order.status==='paid'){
        await client.query('COMMIT');
        return json(res,200,{ok:true,alreadyProcessed:true,order},rid);
      }
      if(order.status!=='created'){await client.query('ROLLBACK');return json(res,409,{error:'Payment order is not payable'},rid);}

      const updated=await client.query(`UPDATE payment_orders SET provider_payment_id=$1,status='paid',updated_at=now() WHERE id=$2 AND status='created' RETURNING id,amount_paise AS "amountPaise",status,provider_payment_id AS "providerPaymentId"`,[paymentId,order.id]);
      if(!updated.rowCount){await client.query('ROLLBACK');return json(res,409,{error:'Payment order was already processed'},rid);}
      await client.query(`INSERT INTO wallet_transactions(id,user_id,type,amount_paise,reference_type,reference_id,status) VALUES($1,$2,'credit',$3,'payment_order',$4,'completed') ON CONFLICT (reference_type,reference_id,type) WHERE reference_type='payment_order' AND type='credit' DO NOTHING`,[id('wtx'),s.id,walletCreditPaise,order.id]);
      await client.query('COMMIT');
      return json(res,200,{ok:true,order:updated.rows[0],walletCreditPaise,bonusPaise:bonusRupees*100},rid);
    }catch(e){try{await client.query('ROLLBACK')}catch{};throw e}finally{client.release();}
  }catch{return json(res,500,{error:'Server error'},rid);}
}

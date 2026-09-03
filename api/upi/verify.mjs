import { db, json, body, requireSession, requestId, rateLimit, requireSameOrigin, razorpayAuth, id } from '../../lib.mjs';

function validUpi(v){return /^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$/.test(v);}

export default async function handler(req,res){
  const rid=requestId(req);
  try{
    const s=requireSession(req,res,['admin','creator'],rid); if(!s)return;
    if(req.method!=='POST') return json(res,405,{error:'Method not allowed'},rid);
    if(!requireSameOrigin(req,res,rid)) return;
    if(!rateLimit(req,'upi-verify',5,60000)) return json(res,429,{error:'Too many verification attempts'},rid);
    const b=await body(req); const upi=String(b.upiId||'').trim();
    if(!validUpi(upi)) return json(res,400,{error:'Invalid UPI ID'},rid);
    if(!process.env.RAZORPAY_KEY_ID||!process.env.RAZORPAY_KEY_SECRET) return json(res,503,{error:'Razorpay server credentials are not configured'},rid);
    if(!process.env.RAZORPAYX_SOURCE_ACCOUNT_NUMBER) return json(res,503,{error:'RazorpayX validation source account is not configured'},rid);
    const user=await db().query('SELECT name,email,mobile FROM users WHERE id=$1 AND status=\'active\'',[s.id]);
    const u=user.rows[0]||{};
    const reference=id('upi').slice(0,40);
    const payload={
      source_account_number:String(process.env.RAZORPAYX_SOURCE_ACCOUNT_NUMBER),
      reference_id:reference,
      notes:{user_id:String(s.id).slice(0,256)},
      fund_account:{account_type:'vpa',vpa:{address:upi},contact:{name:String(u.name||s.name||'CreatorChat User').slice(0,120),email:String(u.email||s.email||'').slice(0,120),contact:String(u.mobile||'').replace(/\D/g,'').slice(-15),type:'customer',reference_id:String(s.id).slice(0,40)}}
    };
    const rp=await fetch('https://api.razorpay.com/v1/fund_accounts/validations',{method:'POST',headers:{Authorization:razorpayAuth(),'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await rp.json().catch(()=>({}));
    if(!rp.ok) return json(res,502,{error:'UPI provider validation failed'},rid);
    const vr=data.validation_results||{}; const status=String(data.status||'');
    const accountHolderName=String(vr.registered_name||'').trim();
    const resultStatus=status==='completed' && String(vr.account_status||'').toLowerCase()==='valid' && !!accountHolderName ? 'verified' : status==='failed' ? 'failed' : 'pending';
    return json(res,200,{status:resultStatus,accountHolderName:resultStatus==='verified'?accountHolderName:'',providerReferenceId:String(data.id||''),validationStatus:status},rid);
  }catch(e){return json(res,e?.statusCode||500,{error:e?.statusCode?e.message:'Server error'},rid);}
}

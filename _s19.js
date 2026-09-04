
(function(){
  const PAYMENT_API='/api/payments';
  function ensurePaymentState(){
    if(!window.s) return;
    if(!Array.isArray(s.paymentOrders)) s.paymentOrders=[];
    if(!Array.isArray(s.paymentAudit)) s.paymentAudit=[];
    if(!s.paymentSettings) s.paymentSettings={provider:'razorpay',currency:'INR',minRecharge:500,maxRecharge:10000};
  }
  window.ensurePaymentState=ensurePaymentState;
  window.paymentConfig=()=>{ensurePaymentState();return {...s.paymentSettings};};
  window.calculateWalletRecharge=amount=>{
    const a=Number(amount)||0;
    const min=Number(s?.paymentSettings?.minRecharge||500), max=Number(s?.paymentSettings?.maxRecharge||10000);
    if(!Number.isFinite(a)||a<min||a>max) return {valid:false,amount:a,bonus:0,total:0,min,max};
    const bonus=typeof rechargeBonus==='function'?Number(rechargeBonus(a))||0:0;
    return {valid:true,amount:a,bonus,total:a+bonus,min,max};
  };
  window.createWalletPaymentOrder=async function(amount,method='upi'){
    ensurePaymentState();
    const calc=calculateWalletRecharge(amount);
    if(!calc.valid) return {ok:false,error:`Recharge must be between ₹${calc.min} and ₹${calc.max}.`};
    const order={id:'local_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),amount:calc.amount,bonus:calc.bonus,totalCredit:calc.total,method,status:'pending',createdAt:new Date().toISOString()};
    s.paymentOrders.push(order);
    s.paymentAudit.push({action:'payment_order_created',orderId:order.id,at:order.createdAt});
    save();
    return {ok:true,order,mode:'local_pending',apiEndpoint:PAYMENT_API+'/create-order'};
  };
  window.markWalletPaymentResult=function(orderId,status,reference){
    ensurePaymentState();
    const o=s.paymentOrders.find(x=>String(x.id)===String(orderId));
    if(!o)return false;
    const allowed=['pending','created','paid','failed','cancelled'];
    o.status=allowed.includes(String(status))?String(status):'pending';
    if(reference)o.reference=String(reference).slice(0,200);
    o.updatedAt=new Date().toISOString();
    s.paymentAudit.push({action:'payment_status_updated',orderId:o.id,status:o.status,at:o.updatedAt});
    save();
    return true;
  };
  window.finalizeWalletPayment=function(orderId){
    ensurePaymentState();
    const o=s.paymentOrders.find(x=>String(x.id)===String(orderId));
    if(!o||o.status!=='paid'||o.credited)return false;
    if(!Array.isArray(s.tx))s.tx=[];
    s.balance=Math.max(0,Number(s.balance||0))+Number(o.totalCredit||0);
    s.tx.push({d:`Wallet recharge ₹${o.amount} + ₹${o.bonus} bonus`,a:Number(o.totalCredit||0),ts:Date.now(),type:'wallet-recharge',method:o.method||'UPI',reference:o.reference||'',paymentOrderId:o.id});
    o.credited=true;o.creditedAt=new Date().toISOString();
    s.paymentAudit.push({action:'wallet_credited',orderId:o.id,at:o.creditedAt});
    save();
    return true;
  };
  window.getPaymentOrder=function(orderId){ensurePaymentState();return s.paymentOrders.find(x=>String(x.id)===String(orderId))||null;};
  window.getPendingWalletPayments=function(){ensurePaymentState();return s.paymentOrders.filter(x=>['pending','created'].includes(x.status));};
  window.runStep218PaymentCheck=function(){
    ensurePaymentState();
    const seen=new Set(), dup=[];
    s.paymentOrders.forEach(o=>{if(seen.has(o.id))dup.push(o.id);seen.add(o.id);});
    const bad=s.paymentOrders.filter(o=>!o.id||!['pending','created','paid','failed','cancelled'].includes(o.status));
    if(dup.length||bad.length) throw new Error('Payment foundation integrity check failed');
    save();
    return {pass:true,orders:s.paymentOrders.length,pending:getPendingWalletPayments().length};
  };
  ensurePaymentState();
})();

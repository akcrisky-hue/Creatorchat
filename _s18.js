
(function(){
  'use strict';
  /* Step 216: non-breaking data-layer foundation.
     Keeps the current local demo working while giving every core entity a stable schema.
     Provider credentials are not stored in this client-side data layer. */
  try{
    if(!window.s || typeof window.s!=='object') return;
    const now=new Date().toISOString();
    if(!s.dataLayerVersion) s.dataLayerVersion=1;
    if(!s.createdAt) s.createdAt=now;
    if(!Array.isArray(s.auditLog)) s.auditLog=[];
    if(!Array.isArray(s.tx)) s.tx=[];
    if(!Array.isArray(s.fans)) s.fans=[];
    if(!Array.isArray(s.posts)) s.posts=[];
    if(!Array.isArray(s.plans)) s.plans=[];
    if(!Array.isArray(s.subscriptions)) s.subscriptions=[];
    if(!Array.isArray(s.subscriptionPlans)) s.subscriptionPlans=[];
    if(!Array.isArray(s.subscriptionOffers)) s.subscriptionOffers=[];
    if(!s.wallet || typeof s.wallet!=='object') s.wallet={balance:Number(s.balance||0),currency:'INR'};
    if(!Number.isFinite(Number(s.wallet.balance))) s.wallet.balance=Number(s.balance||0);
    if(!s.wallet.currency) s.wallet.currency='INR';
    s.balance=Number(s.wallet.balance||0);

    const uid=function(prefix){ return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8); };
    const normalize=function(obj,type){
      obj=obj&&typeof obj==='object'?obj:{};
      if(!obj.id) obj.id=uid(type||'item');
      if(!obj.createdAt) obj.createdAt=now;
      obj.updatedAt=now;
      return obj;
    };
    s.fans=s.fans.map(function(x){return normalize(x,'fan');});
    s.posts=s.posts.map(function(x){return normalize(x,'post');});
    s.plans=s.plans.map(function(x){return normalize(x,'plan');});
    s.tx=s.tx.map(function(x){return normalize(x,'tx');});
    s.subscriptions=s.subscriptions.map(function(x){return normalize(x,'sub');});

    window.CreatorChatData={
      version:1,
      getState:function(){return s;},
      save:function(){ if(typeof save==='function') save(); else localStorage.setItem('cc6',JSON.stringify(s)); },
      normalize:normalize,
      addAudit:function(action,details){
        s.auditLog.push({id:uid('audit'),action:String(action||''),details:String(details||''),createdAt:new Date().toISOString(),mode:String(s.mode||'fan')});
        if(s.auditLog.length>500) s.auditLog=s.auditLog.slice(-500);
      },
      recordTransaction:function(tx){
        const row=normalize(Object.assign({},tx||{}),'tx');
        if(!row.type) row.type='other';
        row.amount=Number(row.amount!=null?row.amount:(row.a!=null?row.a:0))||0;
        row.currency=row.currency||'INR';
        s.tx.push(row);
        return row;
      },
      getSummary:function(){
        return {fans:s.fans.length,posts:s.posts.length,transactions:s.tx.length,subscriptions:s.subscriptions.length,balance:Number(s.wallet.balance||0),currency:s.wallet.currency};
      }
    };
    CreatorChatData.addAudit('Step 216 data foundation initialized','Core entities normalized and local data layer ready');
    localStorage.setItem('cc6',JSON.stringify(s));
  }catch(e){ console.warn('Step 216 data foundation:',e); }
})();

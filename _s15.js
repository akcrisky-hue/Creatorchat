
(function(){
  function esc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }
  function admin(){return String(s.mode||'fan')==='admin';}
  function arr(v){return Array.isArray(v)?v:[];}

  function row(label,value){
    return '<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid rgba(0,0,0,.06)">'+
      '<span>'+esc(label)+'</span><b>'+esc(value)+'</b></div>';
  }

  window.renderFanAccountSections=function(f){
    if(!admin())return;
    var wrap=document.getElementById('adminFanAccountSections');
    if(!wrap)return;
    wrap.style.display='block';

    var activity=arr(f.activity||f.accountActivity||f.activities);
    var tx=arr(f.transactions||f.walletTransactions);
    var posts=arr(f.posts||f.postHistory);
    var purchases=arr(f.purchases||f.orders||f.purchaseHistory);

    document.getElementById('fanActivitySummary').innerHTML =
      row('Activity records', activity.length || 'Not available')+
      row('Account status', f.status||'Active')+
      row('Joined', f.joinedAt||f.createdAt||'Not available');

    document.getElementById('fanWalletSummary').innerHTML =
      row('Wallet balance', f.balance==null?'Not available':f.balance)+
      row('Transaction records', tx.length || 'Not available');

    document.getElementById('fanTransactionsList').innerHTML =
      tx.length ? tx.slice(0,10).map(function(t){
        return '<div class="muted" style="padding:5px 0">'+
          esc(t.date||t.createdAt||'')+' · '+esc(t.type||'Transaction')+' · '+esc(t.amount==null?'':t.amount)+'</div>';
      }).join('') : '<div class="muted">No transaction data available in the current account record.</div>';

    document.getElementById('fanContentSummary').innerHTML =
      row('Posts', posts.length || 'Not available')+
      row('Purchases', purchases.length || 'Not available');

    document.getElementById('fanPurchasesList').innerHTML =
      purchases.length ? purchases.slice(0,10).map(function(p){
        return '<div class="muted" style="padding:5px 0">'+
          esc(p.date||p.createdAt||'')+' · '+esc(p.title||p.name||p.item||'Purchase')+
          (p.amount!=null?' · '+esc(p.amount):'')+'</div>';
      }).join('') : '<div class="muted">No purchase data available in the current account record.</div>';
  };

  // Wrap the Step 213 action renderer rather than replacing it.
  var previousRender=window.renderFanAdminActions;
  if(typeof previousRender==='function'){
    window.renderFanAdminActions=function(index){
      previousRender(index);
      var fans=arr(s.fans), f=fans[index];
      if(f)renderFanAccountSections(f);
    };
  }

  var previousManager=window.openFanManager;
  if(typeof previousManager==='function'){
    window.openFanManager=function(){
      previousManager();
      var wrap=document.getElementById('adminFanAccountSections');
      if(wrap)wrap.style.display='none';
    };
  }

  // Never expose the management card/sections in Fan mode.
  function enforceRole(){
    var card=document.getElementById('adminFansManagementCard');
    var sections=document.getElementById('adminFanAccountSections');
    var on=admin();
    if(card)card.style.display=on?'block':'none';
    if(sections && !on)sections.style.display='none';
  }
  enforceRole();
  setInterval(enforceRole,1000);
})();

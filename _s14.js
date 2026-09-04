
(function(){
  function esc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }
  function isAdmin(){ return String(s.mode||'fan')==='admin'; }

  window.renderFanAdminActions=function(index){
    if(!isAdmin()) return;
    var fans=Array.isArray(s.fans)?s.fans:[];
    var f=fans[index];
    var box=document.getElementById('adminFanList');
    if(!f||!box)return;

    var status=f.status||'Active';
    var blocked=String(status).toLowerCase()==='blocked';
    var suspended=String(status).toLowerCase()==='suspended';

    box.innerHTML=
      '<div class="card" style="margin-top:8px">'+
      '<b>'+esc(f.name||f.username||('Fan '+(index+1)))+'</b>'+
      '<div class="muted" style="margin-top:6px">Email: '+esc(f.email||'Not provided')+'</div>'+
      '<div class="muted">Mobile: '+esc(f.phone||f.mobile||'Not provided')+'</div>'+
      '<div class="muted">Status: '+esc(status)+'</div>'+
      '<div class="muted">Balance: '+esc(f.balance==null?'0':f.balance)+'</div>'+
      '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">'+
      '<button class="btn light" type="button" onclick="setFanAdminStatus('+index+',&quot;'+(blocked?'Active':'Blocked')+'&quot;)">'+(blocked?'Unblock':'Block')+'</button>'+
      '<button class="btn light" type="button" onclick="setFanAdminStatus('+index+',&quot;'+(suspended?'Active':'Suspended')+'&quot;)">'+(suspended?'Unsuspend':'Suspend')+'</button>'+
      '<button class="btn light" type="button" onclick="viewFanAsAdmin('+index+')">View as Fan</button>'+
      '<button class="btn light" type="button" onclick="openFanManager()">← Back</button>'+
      '</div></div>';
  };

  window.setFanAdminStatus=function(index,newStatus){
    if(!isAdmin())return;
    var fans=Array.isArray(s.fans)?s.fans:[];
    if(!fans[index])return;
    fans[index].status=newStatus;
    try{localStorage.setItem('cc6',JSON.stringify(s));}catch(e){}
    renderFanAdminActions(index);
  };

  window.viewFanAsAdmin=function(index){
    if(!isAdmin())return;
    var fans=Array.isArray(s.fans)?s.fans:[];
    var f=fans[index];
    if(!f)return;
    alert('Fan Preview\n\nViewing the fan experience for '+(f.name||f.username||'this fan')+'.\nNo password or OTP is used.');
  };
})();

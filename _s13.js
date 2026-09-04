
(function(){
  function esc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  window.openFanManager=function(){
    if(String(s.mode||'fan')!=='admin')return;
    var box=document.getElementById('adminFanList');
    if(!box)return;
    var fans=Array.isArray(s.fans)?s.fans:[];
    if(!fans.length){
      box.innerHTML='<div class="muted">No fan accounts found.</div>';
      return;
    }
    box.innerHTML=fans.map(function(f,i){
      return '<div class="card" style="margin-top:8px"><div class="row">'+
        '<div><b>'+esc(f.name||f.username||('Fan '+(i+1)))+'</b>'+
        '<div class="muted">'+esc(f.email||'')+'</div></div>'+
        '<button class="btn light" type="button" onclick="renderFanAdminActions('+i+')">View</button>'+
        '</div></div>';
    }).join('');
  };

  window.viewFanDetails=function(index){
    if(String(s.mode||'fan')!=='admin')return;
    var fans=Array.isArray(s.fans)?s.fans:[];
    var f=fans[index];
    if(!f)return;
    var box=document.getElementById('adminFanList');
    if(!box)return;
    box.innerHTML='<div class="card" style="margin-top:8px">'+
      '<b>'+esc(f.name||f.username||('Fan '+(index+1)))+'</b>'+
      '<div class="muted" style="margin-top:6px">Email: '+esc(f.email||'Not provided')+'</div>'+
      '<div class="muted">Mobile: '+esc(f.phone||f.mobile||'Not provided')+'</div>'+
      '<div class="muted">Status: '+esc(f.status||'Active')+'</div>'+
      '<div class="muted">Balance: '+esc(f.balance==null?'0':f.balance)+'</div>'+
      '<div class="muted" style="margin-top:8px">Password and OTP are never displayed.</div>'+
      '<button class="btn light" style="margin-top:10px" type="button" onclick="openFanManager()">← Back</button>'+
      '</div>';
  };
})();

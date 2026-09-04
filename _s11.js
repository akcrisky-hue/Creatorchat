
(function(){
  const PASSCODE='2580';
  window.openAdminModeGate=function(){
    const m=document.getElementById('adminModeGate');
    const i=document.getElementById('adminModeGateInput');
    const msg=document.getElementById('adminModeGateMessage');
    if(m)m.style.setProperty('display','none','important');
    if(i){i.value='';setTimeout(()=>i.focus(),50);}
    if(msg)msg.textContent='';
  };
  window.closeAdminModeGate=function(){
    const m=document.getElementById('adminModeGate');
    if(m)m.style.setProperty('display','none','important');
  };
  window.unlockAdminMode=function(){
    const i=document.getElementById('adminModeGateInput');
    const msg=document.getElementById('adminModeGateMessage');
    if(!i || i.value!==PASSCODE){if(msg)msg.textContent='Incorrect admin access passcode.';return;}
    sessionStorage.setItem('creatorchat_admin_unlocked','1');
    try{CreatorChatAuth.setSession({id:'demo-admin',role:'admin',name:'Admin',email:'',mobile:''},'demo-gate');}catch(e){}
    closeAdminModeGate();
    s.mode='admin';
    document.body.setAttribute('data-mode','admin');
    localStorage.setItem('cc6',JSON.stringify(s));
    if(typeof nav==='function')nav();
    if(typeof show==='function')show('admin');
  };
})();

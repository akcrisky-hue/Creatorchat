
(function(){
  if(window.__ccStep242)return; window.__ccStep242=true;
  // Production rule: the old client-side passcode must never grant admin access.
  // Admin access is granted only after the server validates /api/auth/login.
  window.unlockAdminMode=async function(){
    const gateMsg=document.getElementById('adminModeGateMessage');
    const gateInput=document.getElementById('adminModeGateInput');
    if(gateInput)gateInput.value='';
    if(gateMsg)gateMsg.textContent='Use your admin email and password to continue.';
    const panel=document.getElementById('adminLoginPanel');
    if(panel)panel.style.setProperty('display','block','important');
    const email=document.getElementById('adminLoginEmail');
    if(email)setTimeout(()=>email.focus(),50);
    const gate=document.getElementById('adminModeGate');
    if(gate)gate.style.setProperty('display','none','important');
  };
  window.openAdminModeGate=function(){
    const panel=document.getElementById('adminLoginPanel');
    if(panel)panel.style.setProperty('display','block','important');
    const gate=document.getElementById('adminModeGate');
    if(gate)gate.style.setProperty('display','none','important');
    const msg=document.getElementById('adminLoginMessage'); if(msg)msg.textContent='';
  };
  window.closeAdminModeGate=function(){
    const gate=document.getElementById('adminModeGate');
    if(gate)gate.style.setProperty('display','none','important');
  };
  window.CreatorChatProduction242={
    version:'242.0',
    clientAdminPasscodeDisabled:true,
    serverAuthRequired:true,
    verifyAdminSession:async function(){
      try{
        const r=await CreatorChatAuth.api('/api/auth/session',{method:'GET'});
        if(!r.ok)return false;
        const d=await r.json().catch(()=>({}));
        return !!(d&&d.user&&String(d.user.role||'').toLowerCase()==='admin');
      }catch(e){return false;}
    }
  };
})();


(function(){
  const AUTH_KEY='creatorchat_auth_session_v1';
  const AUTH_VERSION=1;
  function safeRead(){try{return JSON.parse(sessionStorage.getItem(AUTH_KEY)||'null');}catch(e){return null;}}
  function safeWrite(v){try{sessionStorage.setItem(AUTH_KEY,JSON.stringify(v));return true;}catch(e){return false;}}
  function now(){return new Date().toISOString();}
  window.ensureAuthState=function(){
    if(!s.auth||typeof s.auth!=='object')s.auth={version:AUTH_VERSION,provider:'pending',status:'signed_out',user:null,updatedAt:now()};
    if(!s.auth.version)s.auth.version=AUTH_VERSION;
    if(!s.auth.status)s.auth.status='signed_out';
    if(!('user' in s.auth))s.auth.user=null;
    if(!s.auth.provider)s.auth.provider='pending';
    return s.auth;
  };
  window.CreatorChatAuth={
    key:AUTH_KEY,
    getSession:function(){return safeRead();},
    isSignedIn:function(){const x=safeRead();return !!(x&&x.status==='signed_in'&&x.user&&x.user.id);},
    currentUser:function(){const x=safeRead();return x&&x.user?x.user:null;},
    setSession:function(user,provider){
      const clean={id:String(user?.id||''),role:String(user?.role||'fan'),name:String(user?.name||''),email:String(user?.email||''),mobile:String(user?.mobile||'')};
      if(!clean.id)return false;
      const session={version:AUTH_VERSION,status:'signed_in',provider:String(provider||'server'),user:clean,issuedAt:now(),updatedAt:now()};
      safeWrite(session);ensureAuthState();s.auth={...s.auth,...session};return true;
    },
    signOut:function(){
      try{sessionStorage.removeItem(AUTH_KEY);sessionStorage.removeItem('creatorchat_admin_unlocked');}catch(e){}
      ensureAuthState();s.auth={...s.auth,status:'signed_out',user:null,updatedAt:now()};
      return true;
    },
    requireRole:function(role){const u=this.currentUser();return !!u&&String(u.role||'').toLowerCase()===String(role||'').toLowerCase();},
    api:function(path,options){
      const opts=options&&typeof options==='object'?{...options}:{};opts.credentials='include';
      opts.headers={...(options&&options.headers||{}),'Content-Type':'application/json'};return fetch(path,opts);
    }
  };
  window.restoreAuthSession=function(){
    ensureAuthState();const session=CreatorChatAuth.getSession();
    if(session&&session.status==='signed_in'&&session.user&&session.user.id){
      s.auth={...s.auth,...session,updatedAt:now()};
      if(session.user.role==='admin')try{sessionStorage.setItem('creatorchat_admin_unlocked','1');}catch(e){}
      return true;
    }return false;
  };
  window.clearAuthSession=function(){CreatorChatAuth.signOut();};
  window.adminLogin=async function(){
    const email=document.getElementById('adminLoginEmail')?.value.trim(),password=document.getElementById('adminLoginPassword')?.value||'',msg=document.getElementById('adminLoginMessage');
    if(!email||!/^\S+@\S+\.\S+$/.test(email)){if(msg)msg.textContent='Enter a valid admin email.';return;}
    if(!password){if(msg)msg.textContent='Enter your admin password.';return;}
    if(msg)msg.textContent='Signing in…';
    try{
      const res=await CreatorChatAuth.api('/api/auth/login',{method:'POST',body:JSON.stringify({email,password,role:'admin'})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||!data||!data.user){if(msg)msg.textContent=data.message||'Authentication service is not connected.';return;}
      if(String(data.user.role||'').toLowerCase()!=='admin'){if(msg)msg.textContent='This account does not have admin access.';return;}
      CreatorChatAuth.setSession(data.user,'server');sessionStorage.setItem('creatorchat_admin_unlocked','1');s.mode='admin';save();
      const p=document.getElementById('adminLoginPanel');if(p)p.style.setProperty('display','none','important');
      if(typeof nav==='function')nav();if(typeof show==='function')show('admin');
    }catch(e){if(msg)msg.textContent='Authentication service is not connected.';}
  };
  window.adminLogout=function(){
    try{CreatorChatAuth.api('/api/auth/logout',{method:'POST'}).catch(()=>{});}catch(e){}
    CreatorChatAuth.signOut();s.mode='fan';save();
  };
  ensureAuthState();restoreAuthSession();
})();

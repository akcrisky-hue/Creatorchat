
(function(){
  if(window.__ccPublicEntry24950)return;window.__ccPublicEntry24950=true;
  let creator=null;
  function qs(){return new URLSearchParams(location.search).get('creator')||'';}
  function setStatus(t){const e=document.getElementById('publicCreatorAuthStatus');if(e)e.textContent=t||'';}
  function initials(n){return String(n||'CC').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'CC';}
  function showGate(){document.body.classList.add('public-creator-entry');const g=document.getElementById('publicCreatorEntry');if(g)g.style.setProperty('display','block','important');}
  function hideGate(){document.body.classList.remove('public-creator-entry');const g=document.getElementById('publicCreatorEntry');if(g)g.style.setProperty('display','none','important');}
  window.switchPublicAuth=function(mode){
    const login=mode==='login';
    document.getElementById('publicLoginForm')?.style.setProperty('display',login?'block':'none','important');
    document.getElementById('publicRegisterForm')?.style.setProperty('display',login?'none':'block','important');
    document.getElementById('publicLoginTab')?.classList.toggle('active',login);
    document.getElementById('publicRegisterTab')?.classList.toggle('active',!login);
    setStatus('');
  };
  async function loadCreator(){
    const slug=qs();if(!slug)return;showGate();
    try{
      const r=await fetch('/api/public/creator?slug='+encodeURIComponent(slug),{credentials:'include'});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||!d.creator){
        const n=document.getElementById('publicCreatorName');if(n)n.textContent='Creator not found';
        const b=document.getElementById('publicCreatorBio');if(b)b.textContent='This creator link is invalid or unavailable.';
        const tabs=document.querySelector('.public-entry-tabs');if(tabs)tabs.style.display='none';
        document.getElementById('publicLoginForm')?.style.setProperty('display','none','important');
        document.getElementById('publicRegisterForm')?.style.setProperty('display','none','important');
        return;
      }
      creator=d.creator;
      const n=document.getElementById('publicCreatorName');if(n)n.textContent=creator.displayName||creator.name||'Creator';
      const b=document.getElementById('publicCreatorBio');if(b)b.textContent=creator.bio||'Connect with your creator.';
      const a=document.getElementById('publicCreatorAvatar');if(a)a.textContent=initials(creator.displayName||creator.name);
      const st=document.getElementById('publicCreatorStatus');if(st)st.textContent=creator.status==='active'?'Online profile':'Profile available';
    }catch(e){setStatus('Unable to load this creator profile.');}
  }
  async function finishFanLogin(data){
    if(!data?.user||String(data.user.role||'').toLowerCase()!=='fan')throw new Error('Fan account could not be signed in.');
    if(typeof CreatorChatAuth!=='undefined')CreatorChatAuth.setSession(data.user,'server');
    s.mode='fan';s.activeCreatorId=String(creator?.id||'');
    const f=(s.fans||[])[0]||{id:'fan1',name:data.user.name||'Fan',messages:[]};
    f.creatorId=String(creator?.id||'');f.chatPrice=Number(creator?.chatPricePaise||0)/100;f.name=data.user.name||f.name;f.userId=data.user.id;
    s.activeFanId=f.id;s.fans=[f,...(s.fans||[]).filter(x=>x.id!==f.id)];
    save();hideGate();nav();show('profile');renderPublicCreatorProfile();
  }
  window.submitPublicFanLogin=async function(){
    const email=document.getElementById('publicFanLoginEmail')?.value.trim().toLowerCase(),password=document.getElementById('publicFanLoginPassword')?.value||'';
    if(!email||!password)return setStatus('Enter your email and password.');
    setStatus('Signing in…');
    try{const r=await fetch('/api/auth/login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,role:'fan'})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Invalid fan credentials.');await finishFanLogin(d);}catch(e){setStatus(String(e.message||'Fan login failed.'));}
  };
  window.submitPublicFanRegister=async function(){
    const name=document.getElementById('publicFanRegisterName')?.value.trim(),email=document.getElementById('publicFanRegisterEmail')?.value.trim().toLowerCase(),password=document.getElementById('publicFanRegisterPassword')?.value||'';
    if(!name||!email||password.length<8)return setStatus('Enter your name, valid email and an 8+ character password.');
    setStatus('Creating your fan account…');
    try{const r=await fetch('/api/auth/register',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password,role:'fan'})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Fan registration failed.');await finishFanLogin(d);}catch(e){setStatus(String(e.message||'Fan registration failed.'));}
  };
  loadCreator();
})();

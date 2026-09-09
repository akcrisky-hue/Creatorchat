
const defaultPlans=[
['Starter Monthly','1 Month',99],
['Basic Monthly','1 Month',299],
['Standard Monthly','1 Month',499],
['Premium Monthly','1 Month',999],
['Monthly','1 Month',2499],
['Quarterly','3 Months',6999],
['Half-Yearly','6 Months',11999],
['Yearly','12 Months',19999]
];
const gifts=[['❤️','Heart',99],['🌹','Rose',199],['💕','Love',399],['💐','Flowers',599],['💎','Diamond',999],['🧸','Teddy',1499],['💖','Big Heart',2499],['🎁','Love Box',4999],['💝','Premium',7999],['💋','Kiss',9999],['👑','Royal',14999],['💎','Ultimate',19999]];
let s=JSON.parse(localStorage.getItem('cc6')||'null')||{mode:'fan',balance:0,rate:29,free:false,member:'None',earn:0,orders:0,tx:[],posts:[],plans:[],planVersion:2,supportEmail:''};
if(typeof s.supportEmail!=='string')s.supportEmail='';
if(!Array.isArray(s.notifications))s.notifications=[];
if(!s.notificationPrefs)s.notificationPrefs={creator:true,posts:true,gifts:true,system:true};
if(!s.creatorProfile)s.creatorProfile={name:'Kaira',email:'',mobile:'',pic:'',cover:''};
if(!Array.isArray(s.fans))s.fans=[{id:'fan1',name:'Demo Fan',email:'fan@example.com',mobile:'',chatPrice:0,messages:[]}];
if(!s.chatAccess)s.chatAccess={};
if(typeof s.payoutValue!=='string')s.payoutValue='';
if(s.planVersion!==3){
      s.plans=[
        {id:101,name:'Starter Monthly',duration:'1 Month',price:99,active:true},
        {id:102,name:'Basic Monthly',duration:'1 Month',price:499,active:true},
        {id:103,name:'Premium Monthly',duration:'1 Month',price:2499,active:true},
        {id:104,name:'Quarterly',duration:'3 Months',price:6999,active:true},
        {id:105,name:'Half-Yearly',duration:'6 Months',price:11999,active:true},
        {id:106,name:'Full Year',duration:'12 Months',price:19999,active:true}
      ];
      s.planVersion=3;localStorage.setItem('cc6',JSON.stringify(s));
    }
if(!Array.isArray(s.plans))s.plans=[];
if(!Array.isArray(s.giftCatalog)||s.giftCatalog.length<12)s.giftCatalog=[
      ['❤️','Heart',99],['🌹','Rose',199],['💕','Love',399],['💐','Flowers',599],
      ['💎','Diamond',999],['🧸','Teddy',1499],['💖','Big Heart',2499],['🎁','Love Box',4999],
      ['💝','Premium',7999],['💋','Kiss',9999],['👑','Royal',14999],['💎','Ultimate',19999]
    ].map((g,i)=>({id:i+1,emoji:g[0],name:g[1],price:g[2],active:true}));
if(typeof s.creatorOnline!=='boolean')s.creatorOnline=true;
if(!s.fanAccount)s.fanAccount={name:'',contact:'',email:'',mobile:'',loggedIn:true};
if(!s.auth||typeof s.auth!=='object')s.auth={version:1,provider:'pending',status:'signed_out',user:null,updatedAt:new Date().toISOString()};
if(typeof s.fanAccount.email!=='string')s.fanAccount.email='';
if(typeof s.fanAccount.mobile!=='string')s.fanAccount.mobile='';
if(!s.fanAccount.email && s.fanAccount.contact && s.fanAccount.contact.includes('@'))s.fanAccount.email=s.fanAccount.contact;
if(!s.fanAccount.mobile && s.fanAccount.contact && !s.fanAccount.contact.includes('@'))s.fanAccount.mobile=s.fanAccount.contact;
if(s.planVersion<4){
  s.plans=s.plans.map(p=>({...p,fanVisible:(p.system===true)?false:(p.id<=106?false:(p.active!==false))}));
  s.planVersion=4;
  localStorage.setItem('cc6',JSON.stringify(s));
}
const money=n=>'₹'+Number(n).toLocaleString('en-IN');
function save(){localStorage.setItem('cc6',JSON.stringify(s));render()}
function saveFanAccount(){let n=document.getElementById('fanName').value.trim(),c=document.getElementById('fanContact').value.trim();if(!n||!c)return alert('Fan name and mobile/email are required.');s.fanAccount={...s.fanAccount,name:n,contact:c,loggedIn:true};if(c.includes('@'))s.fanAccount.email=c;else s.fanAccount.mobile=c;save();alert('Fan account saved (demo).')}
function saveFanSettings(){let n=document.getElementById('fanSettingName').value.trim(),e=document.getElementById('fanSettingEmail').value.trim(),m=document.getElementById('fanSettingMobile').value.trim();if(!n)return alert('Name is required.');if(e&&!/^\S+@\S+\.\S+$/.test(e))return alert('Enter a valid email address.');if(m&&!/^\d{10}$/.test(m))return alert('Mobile number must be 10 digits.');s.fanAccount={...s.fanAccount,name:n,email:e,mobile:m,contact:e||m,loggedIn:true};save();alert('Fan settings updated (demo).')}
function rechargeBonus(a){if(a>3000)return Math.floor(a*0.10);if(a===3000)return 300;if(a>=2000)return 150;if(a>=1500)return 100;if(a>=1000)return 50;return 0}
function updateRechargeBonus(){let el=document.getElementById('rechargeBonus');if(!el)return;let a=Number(document.getElementById('rechargeAmount').value)||0;if(a<500){el.textContent='Minimum ₹500 · Maximum ₹10,000';return}if(a>10000){el.textContent='Maximum recharge ₹10,000';return}let b=rechargeBonus(a);el.textContent=`You pay ₹${a} + ₹${b} bonus = ₹${a+b} wallet credit`}
function demoRecharge(){s.lowBalanceShown=false;let a=Number(document.getElementById('rechargeAmount').value),b=rechargeBonus(a);if(!Number.isFinite(a)||a<500)return alert('Minimum recharge is ₹500.');if(a>10000)return alert('Maximum recharge is ₹10,000 per transaction.');s.balance+=a+b;s.tx.push({d:`Wallet recharge ₹${a} + ₹${b} bonus (Demo)`,a:a+b,ts:Date.now()});document.getElementById('rechargeAmount').value='';updateRechargeBonus();save();alert(`₹${a} + ₹${b} bonus = ₹${a+b} wallet credit (demo).`)}
function toggleCreatorStatus(){s.creatorOnline=!s.creatorOnline;save();}
function isAdminAuthenticated(){
  return sessionStorage.getItem('creatorchat_admin_unlocked')==='1';
}
function setMode(mode){
  if(mode!=='admin'&&mode!=='fan')return;
  s.mode=mode;
  try{localStorage.setItem('cc6',JSON.stringify(s));}catch(e){}
  document.body.setAttribute('data-mode',mode);
  nav();
  show(mode==='admin'?'admin':'home');
}
function toggleMode(){
  setMode(s.mode==='admin'?'fan':'admin');
}
function show(id){
  document.body.setAttribute('data-mode',s.mode);
      const adminOnlyPages=new Set(['admin','pricing','adminTransactions','adminGifts','posts','adminChat','users','ledger','orders','orderHistory','payout','insights','notifications','alerts']);
      if(s.mode!=='admin' && adminOnlyPages.has(id)){ id='home_duplicate_1'; }
      let target=document.getElementById(id);
      if(!target)return;
      document.body.setAttribute('data-mode',String(s.mode||'fan'));
      document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
      target.classList.add('active');
      document.getElementById('menuBackdrop')?.classList.remove('open');
      render();
      if(typeof enforceStableRoleVisibility==='function')enforceStableRoleVisibility();
    }
function nav(){
  let a=s.mode==='admin';
  let n=a
    ? [['admin','🏠','Dashboard'],['pricing','💬','Pricing'],['posts','🔒','Paid Post'],['adminGifts','🎁','Gifts'],['users','👥','Fans']]
    : [['home','🏠','Home'],['profile','⭐','Creator'],['paidPosts','🔒','Posts'],['chat','💬','Chat'],['wallet','💰','Wallet']];
  let current=document.querySelector('.page.active')?.id||(a?'admin':'home');
  document.getElementById('nav').innerHTML=n.map(x=>`<button class="${x[0]===current?'active':''}" onclick="show('${x[0]}')">${x[1]}<br>${x[2]}</button>`).join('');
  buildMenu();
  refreshInsights();
}
function buildMenu(){
  let a=s.mode==='admin';
  let items=a
    ? [
      ['📋','Pending Orders','Manage pending purchases','orders'],
      ['🧾','Order History','Completed order record','orderHistory'],
      ['💳','Payout Settings','Manage creator payouts','payout'],
      ['📈','Insights','Sales and content overview','insights'],
      ['🔔','Notifications','Send updates to fans','notifications'],
      ['🚨','Alert Settings','Choose admin alerts','alerts'],
      ['📊','Ledger','Complete transaction record','ledger'],
      ['⚙️','Settings','Support email & interface','settings'],
      ['📜','Terms of Service','Platform rules','terms'],
      ['🛟','Support','Help & fan support','support'],
      ['👤','Fan View','Open fan side','home']
    ]
    : [['⚙️','Settings','Name, email & mobile','fanSettings'],['👑','Admin View','Creator/admin controls','admin'],['🚪','Logout','Sign out of this demo','logout']];
  document.getElementById('menuModeText').textContent=a?'Admin controls':'Fan menu';
  document.getElementById('menuItems').innerHTML=items.map(x=>`<button class="menu-item" onclick="menuGo('${x[3]}')"><span class="mi">${x[0]}</span><span><b>${x[1]}</b><span>${x[2]}</span></span></button>`).join('');
  let e=s.supportEmail||'Support email not set';
  ['menuSupportEmail','supportModalEmail','supportEmailPreview'].forEach(id=>{let el=document.getElementById(id);if(el)el.textContent=e});
  let inp=document.getElementById('supportEmail');if(inp)inp.value=s.supportEmail||'';
}
function toggleMenu(){document.getElementById('menuBackdrop').classList.toggle('open')}
function closeMenu(e){if(!e||e.target.id==='menuBackdrop')document.getElementById('menuBackdrop').classList.remove('open')}
function menuGo(id){
  document.getElementById('menuBackdrop').classList.remove('open');

  if(id==='logout'){
    if(confirm('Do you want to log out?')){s.fanAccount={...s.fanAccount,loggedIn:false};save();alert('Demo logout complete.');}
    return;
  }

  if(id==='support'){openSupport();return;}

  // View switching must also change the actual app mode.
  // This fixes "Admin View" opening the page but leaving Fan navigation active.
  if(id==='admin'){setMode('admin');return;}
  if(id==='home'){setMode('fan');return;}

  show(id);
}
function openSupport(){document.getElementById('menuBackdrop').classList.remove('open');document.getElementById('supportModal').classList.add('open')}
function closeSupport(){document.getElementById('supportModal').classList.remove('open')}
function refreshInsights(){
  let p=document.getElementById('insightPosts'),pl=document.getElementById('insightPlans'),e=document.getElementById('insightEarnings');
  if(p)p.textContent=(s.posts||[]).length;
  if(pl)pl.textContent=(s.plans||[]).length;
  if(e)e.textContent='₹'+Number(s.earn||0).toLocaleString('en-IN');
}
function savePayout(){saveVerifiedPayoutDetails();}

function toggleFanNotifPrefs(){
  const p=document.getElementById('fanNotifPrefsPanel'),a=document.getElementById('fanNotifPrefsArrow');
  if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(a)a.textContent=open?'⌄':'⌃';
  if(!open){
    const q=s.notificationPrefs||{};
    ['Creator','Posts','Gifts','System'].forEach(k=>{
      const e=document.getElementById('pref'+k);if(e)e.checked=q[k.toLowerCase()]!==false;
    });
  }
}
function saveFanNotifPrefs(){
  s.notificationPrefs={
    creator:!!document.getElementById('prefCreator')?.checked,
    posts:!!document.getElementById('prefPosts')?.checked,
    gifts:!!document.getElementById('prefGifts')?.checked,
    system:!!document.getElementById('prefSystem')?.checked
  };
  save();
  alert('Notification preferences saved.');
  toggleFanNotifPrefs();
}


function toggleFanHelp(){
  const p=document.getElementById('fanHelpPanel'),a=document.getElementById('fanHelpArrow');
  if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(a)a.textContent=open?'⌄':'⌃';
}
function fanHelpTopic(topic){
  const email=s.supportEmail||'';
  const msg='Support request: '+topic+'\nFan: '+(s.fan?.name||'Fan')+'\nPlease help me with this issue.';
  if(email){
    location.href='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent('CreatorChat Support — '+topic)+'&body='+encodeURIComponent(msg);
  }else{
    alert('Admin support email is not set yet.');
  }
}


function renderFanActivity(){
  const b=document.getElementById('fanActivityBalance'),o=document.getElementById('fanActivityOrders'),tx=document.getElementById('fanActivityTx');
  if(!b||!o||!tx)return;
  b.textContent=money(Number(s.balance||0));
  o.textContent=Number(s.orders||0);
  const rows=(s.tx||[]).filter(function(x){var ty=String(x.type||'').toLowerCase(),d=String(x.d||'').toLowerCase();return ty==='wallet-recharge'||d.includes('wallet recharge')||d.includes('wallet top up')||d.includes('wallet top-up');}).slice().reverse().slice(0,5);
  tx.innerHTML=rows.length?rows.map(x=>`<div class="row" style="padding:8px 0;border-bottom:1px solid #eee"><span>${x.d||'Transaction'}</span><b>${money(x.a||0)}</b></div>`).join(''):'<div class="muted">No transactions yet.</div>';
}
function toggleFanActivity(){
  const p=document.getElementById('fanActivityPanel'),a=document.getElementById('fanActivityArrow');
  if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(a)a.textContent=open?'⌄':'⌃';
  if(!open)renderFanActivity();
}

function toggleFanNotifications(){
  let p=document.getElementById('fanNotificationList'),a=document.getElementById('fanNotifArrow');
  if(!p)return;
  let open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(a)a.textContent=open?'⌄':'⌃';
  
}
function sendNotification(){
  let t=document.getElementById('notificationTitle').value.trim();
  let m=document.getElementById('notificationText').value.trim();
  if(!t||!m)return alert('Enter both a title and a message.');
  if(!Array.isArray(s.notifications))s.notifications=[];
  s.notifications.unshift({id:'n'+Date.now(),icon:'🔔',category:'system',title:t,text:m,ts:Date.now(),read:false});
  s.notifications=s.notifications.slice(0,50);
  document.getElementById('notificationTitle').value='';
  document.getElementById('notificationText').value='';
  save();
  alert('Notification sent to fans.');
}

function previewCreatorImage(input,targetId){
  let file=input.files&&input.files[0]; if(!file)return;
  let r=new FileReader();
  r.onload=function(){document.getElementById(targetId).innerHTML='<img src="'+r.result+'" style="max-width:100%;max-height:160px;border-radius:14px;object-fit:cover">';};
  r.readAsDataURL(file);
}
function saveCreatorProfile(){
  if(!s.creatorProfile)s.creatorProfile={name:'',email:'',mobile:'',pic:'',cover:''};
  s.creatorProfile.name=document.getElementById('creatorName').value.trim();
  s.creatorProfile.email=document.getElementById('creatorEmail').value.trim();
  s.creatorProfile.mobile=document.getElementById('creatorMobile').value.trim();
  let p=document.getElementById('creatorProfilePic'),c=document.getElementById('creatorCoverPhoto');
  function read(file,cb){if(!file)return cb(null);let r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(file);}
  read(p.files&&p.files[0],function(pic){
    read(c.files&&c.files[0],function(cover){
      if(pic)s.creatorProfile.pic=pic;
      if(cover)s.creatorProfile.cover=cover;
      save(); renderCreatorProfileFields(); renderCreatorPublicLink();
      const u=(typeof CreatorChatAuth!=='undefined')?CreatorChatAuth.currentUser():null;
      if(u&&String(u.role||'').toLowerCase()==='creator'){
        CreatorChatAuth.api('/api/creator/profile',{method:'PATCH',body:JSON.stringify({creatorId:u.id,displayName:s.creatorProfile.name,bio:String(s.creatorProfile.bio||''),chatPricePaise:Math.round(Number(s.rate||29)*100)})}).catch(()=>{});
      }
      alert('Creator profile saved.');
    });
  });
}

function renderPublicCreatorProfile(){
  let p=s.creatorProfile||{};
  let name=p.name||'Kaira';
  let n=document.getElementById('fanCreatorName'); if(n)n.textContent=name;
  let e=document.getElementById('fanCreatorEmail'); if(e)e.textContent=p.email||'Email not set';
  let pic=document.getElementById('fanCreatorPic');
  if(pic)pic.innerHTML=p.pic?'<img src="'+p.pic+'" style="width:100%;height:100%;object-fit:cover">':name.slice(0,2).toUpperCase();
  let cover=document.getElementById('fanCreatorCover');
  if(cover)cover.style.backgroundImage=p.cover?'url("'+p.cover+'")':'none';
}

function creatorPublicSlug(name){
  return String(name||'creator').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'creator';
}
function getCreatorPublicLink(){
  const name=(s.creatorProfile&&s.creatorProfile.name)||'Kaira';
  return location.origin+'/?creator='+encodeURIComponent(creatorPublicSlug(name));
}
function renderCreatorPublicLink(){
  const el=document.getElementById('creatorPublicLink');
  if(el)el.value=getCreatorPublicLink();
}
async function copyCreatorPublicLink(){
  const el=document.getElementById('creatorPublicLink');
  const link=el?.value||getCreatorPublicLink();
  try{await navigator.clipboard.writeText(link);alert('Fan profile link copied.');}
  catch(e){if(el){el.select();document.execCommand('copy');alert('Fan profile link copied.');}}
}



function renderAccountSettings(){
  const n=document.getElementById('settingsDisplayName'),e=document.getElementById('settingsEmail'),m=document.getElementById('settingsMobile');
  if(n)n.value=s.userName||s.name||'';
  if(e)e.value=s.email||'';
  if(m)m.value=s.mobile||s.phone||'';
}

function getSupportEmail(){return s.supportEmail||'Not configured';}
function toggleHelpSupport(){
  const p=document.getElementById('helpSupportPanel');if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(!open){
    const d=document.getElementById('supportEmailDisplay');if(d)d.textContent=getSupportEmail();
    const admin=(s.mode==='admin'||s.mode==='creator');
    const box=document.getElementById('adminSupportSettings');
    if(box)box.style.setProperty('display',admin?'block':'none','important');
    const e=document.getElementById('adminSupportEmail');if(e)e.value=s.supportEmail||'';
  }
}
function saveSupportEmail(){
  if(!(s.mode==='admin'||s.mode==='creator'))return;
  const e=document.getElementById('adminSupportEmail'),v=e?e.value.trim():'';
  if(v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){alert('Enter a valid email.');return;}
  s.supportEmail=v;save();
  const d=document.getElementById('supportEmailDisplay');if(d)d.textContent=getSupportEmail();
  if(typeof addAdminAudit==='function')addAdminAudit('Support email updated',v||'Support email removed');
}


function ensureFaqs(){
  if(!Array.isArray(s.faqs))s.faqs=[
    {q:'How do I add wallet balance?',a:'Open Wallet and choose an available top-up amount.'},
    {q:'How do subscriptions work?',a:'Only subscriptions created by the creator are shown to that fan.'},
    {q:'How do I contact support?',a:'Open Help & Support in Settings and send a support request.'}
  ];
}
function renderFaq(){
  ensureFaqs();
  const el=document.getElementById('faqList');if(!el)return;
  el.innerHTML=s.faqs.map((f,i)=>`<details style="padding:10px 0;border-bottom:1px solid #eee">
    <summary style="cursor:pointer;font-weight:600">${f.q||'Question'}</summary>
    <div style="margin-top:7px">${f.a||''}</div>
    ${(s.mode==='admin'||s.mode==='creator')?`<button class="btn light" style="margin-top:8px" onclick="deleteFaq(${i})">Delete</button>`:''}
  </details>`).join('');
}
function toggleFaq(){
  const p=document.getElementById('faqPanel');if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(!open){
    renderFaq();
    const e=document.getElementById('adminFaqEditor');
    if(e)e.style.setProperty('display',(s.mode==='admin'||s.mode==='creator')?'block':'none','important');
  }
}
function addFaq(){
  if(!(s.mode==='admin'||s.mode==='creator'))return;
  const q=document.getElementById('faqQuestion')?.value.trim()||'';
  const a=document.getElementById('faqAnswer')?.value.trim()||'';
  if(!q||!a){alert('Question and answer required.');return;}
  ensureFaqs();s.faqs.push({q,a});save();renderFaq();
  document.getElementById('faqQuestion').value='';
  document.getElementById('faqAnswer').value='';
}
function deleteFaq(index){
  if(!(s.mode==='admin'||s.mode==='creator'))return;
  if(!confirm('Delete this FAQ?'))return;
  ensureFaqs();s.faqs.splice(index,1);save();renderFaq();
}


function refreshAdminControlCenter(){
  const fans = Array.isArray(s.fans) ? s.fans.length : 0;
  const posts = Array.isArray(s.posts) ? s.posts.length : 0;
  const gifts = Array.isArray(s.gifts) ? s.gifts.filter(g => g && g.visible !== false).length : 0;
  const plans = Array.isArray(s.plans) ? s.plans.filter(p => p && p.visible !== false).length : 0;
  const setText = (id, value) => { const el=document.getElementById(id); if(el) el.textContent=String(value); };
  setText('adminFanCount', fans);
  setText('adminPostCount', posts);
  setText('adminGiftCount', gifts);
  setText('adminPlanCount', plans);
}

function renderAdminSupport(){
  const el=document.getElementById('adminSupportList');if(!el)return;
  const req=Array.isArray(s.supportRequests)?s.supportRequests.slice().reverse():[];
  el.innerHTML=req.length?req.map((r,i)=>`<div style="padding:10px 0;border-bottom:1px solid #eee">
    <div class="row"><b>Ticket #${String(r.id).slice(-6)}</b><span class="pill">${r.status||'open'}</span></div>
    <div style="margin-top:5px">${r.message||''}</div>
    <div class="muted" style="margin-top:4px">${r.email||'No email'} · ${r.createdAt?new Date(r.createdAt).toLocaleString():''}</div>
    ${(r.status||'open')!=='closed'?`<button class="btn light" style="margin-top:8px" onclick="closeSupportRequest(${s.supportRequests.length-1-i})">Close Ticket</button>`:''}
  </div>`).join(''):'<div class="muted">No support requests.</div>';
}
function toggleAdminSupport(){
  const p=document.getElementById('adminSupportPanel');if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderAdminSupport();
}
function closeSupportRequest(index){
  if(!Array.isArray(s.supportRequests)||!s.supportRequests[index])return;
  s.supportRequests[index].status='closed';
  s.supportRequests[index].closedAt=new Date().toISOString();
  save();renderAdminSupport();
  if(typeof addAdminAudit==='function')addAdminAudit('Support ticket closed','Ticket #'+String(s.supportRequests[index].id).slice(-6));
}

function sendSupportRequest(){
  const msg=document.getElementById('supportMessage')?.value.trim()||'',st=document.getElementById('supportStatus');
  if(!msg){if(st)st.textContent='Please describe your issue.';return;}
  s.supportRequests=Array.isArray(s.supportRequests)?s.supportRequests:[];
  s.supportRequests.push({id:Date.now(),message:msg,status:'open',createdAt:new Date().toISOString(),email:s.email||''});
  save();
  if(typeof addNotification==='function')addNotification('Support request sent','Your request was submitted.','support');
  if(st)st.textContent='Support request submitted successfully.';
  const box=document.getElementById('supportMessage');if(box)box.value='';
}

function saveAccountSettings(){
  s.userName=document.getElementById('settingsDisplayName')?.value.trim()||'';
  s.email=document.getElementById('settingsEmail')?.value.trim()||'';
  s.mobile=document.getElementById('settingsMobile')?.value.trim()||'';
  save();
  if(typeof addNotification==='function')addNotification('Account updated','Your account details were saved.','account');
  const st=document.getElementById('accountSettingsStatus');
  if(st)st.textContent='Account details saved.';
}
function logoutCurrentUser(){
  if(!confirm('Log out of this account?'))return;
  try{localStorage.removeItem('creatorchat_current_user');}catch(e){}
  if(typeof addAdminAudit==='function' && (s.mode==='admin'||s.mode==='creator'))addAdminAudit('Logout','Current account logged out');
  save();
  location.reload();
}

function renderFanNotifications(){
  let box=document.getElementById('fanNotificationList');if(!box)return;
  let notes=Array.isArray(s.notifications)?s.notifications:[];
  const pref=s.notificationPrefs||{creator:true,posts:true,gifts:true,system:true};
  const allowed={creator:pref.creator!==false,posts:pref.posts!==false,gifts:pref.gifts!==false,system:pref.system!==false};
  notes=notes.filter(n=>allowed[n.category||'system']!==false);
  let unread=notes.filter(n=>!n.read).length;
  let badge=document.getElementById('fanNotifBadge');
  if(badge){badge.textContent=unread>99?'99+':unread;badge.style.display=unread?'inline-block':'none';}
  box.innerHTML=notes.length?notes.slice(0,10).map(n=>`<div class="row" style="padding:10px 0;border-bottom:1px solid #eee;opacity:${n.read?.65:1}"><span style="font-size:21px">${n.icon||'🔔'}</span><div style="flex:1;min-width:0"><b>${n.title}</b>${!n.read?' <span class="pill">New</span>':''}<div class="muted">${n.text}</div><small class="muted">${n.ts?new Date(n.ts).toLocaleString('en-IN'):''}</small></div></div>`).join(''):'<div class="muted">No notifications yet.</div>';
}
function markFanNotificationsRead(){
  if(!Array.isArray(s.notifications))return;
  s.notifications.forEach(n=>n.read=true);
  save();
  renderFanNotifications();
}
function renderInsights(){
  let f=document.getElementById('insightFans');if(f)f.textContent=(s.fans||[]).length;
  let t=document.getElementById('insightTx');if(t)t.textContent=(s.tx||[]).length;
  let v=(s.tx||[]).reduce((sum,x)=>sum+Number(x.a||0),0);
  let el=document.getElementById('insightVolume');if(el)el.textContent='₹'+v.toLocaleString('en-IN');
}
function renderFans(){
  let box=document.getElementById('fanList'); if(!box)return;
  if(!Array.isArray(s.fans)||!s.fans.length){box.innerHTML='<div class="muted" style="padding:14px 0">No fans yet.</div>';return;}
  box.innerHTML=s.fans.map(f=>{
    let unread=(f.messages||[]).filter(m=>m.from==='fan' && !m.adminRead).length;
    let last=(f.messages||[]).slice(-1)[0];
    let preview=last?(last.media?last.text||'Media message':last.text||'Message'):'No messages yet';
    return `<button type="button" onclick="openAdminChat('${f.id}')" style="width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #eee;padding:12px 0;cursor:pointer">
      <div class="row" style="gap:10px">
        <div style="min-width:0;flex:1"><b>${f.name||'Fan'}</b><div class="muted">${f.email||'No email'} · Chat ₹${f.chatPrice||0}</div><div class="muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${preview}</div></div>
        ${unread?`<span class="unread-badge">${unread>99?'99+':unread}</span>`:''}
      </div></button>`;
  }).join('');
}

function getActiveFan(){
  return (s.fans||[]).find(x=>x.id===s.activeFanId) || (s.fans||[])[0];
}

function fanChatRate(){
  let f=getActiveFan();
  return Math.max(0,Number(f&&f.chatPrice||0));
}
function updateFanChatBalance(){
  let b=Number(s.balance||0);
  let el=document.getElementById('fanChatBalance');if(el)el.textContent='₹'+b.toLocaleString('en-IN');
}
function lowBalancePopup(){
  if(Number(s.balance||0)<100 && !s.lowBalanceShown){
    s.lowBalanceShown=true;save();
    alert('⚠️ Low Balance\n\nYour wallet balance is below ₹100. Please recharge to continue chatting.');
  }
}

function chargeFanChatAction(f){
  let rate=fanChatRate();
  if(rate>0 && Number(s.balance||0)<rate){
    alert('⚠️ Insufficient wallet balance. Please recharge to continue.');
    return false;
  }
  if(rate>0){
    s.balance=Number(s.balance||0)-rate;
    s.earn=Number(s.earn||0)+rate;
    if(!Array.isArray(s.tx))s.tx=[];
    s.tx.push({d:'Paid chat media · '+(f.name||'Creator'),a:rate,ts:Date.now()});
  }
  return true;
}
function fanAttach(label,accept){
  let f=getActiveFan();if(!f)return;
  if(!chargeFanChatAction(f))return;
  let input=document.createElement('input');
  input.type='file';input.accept=accept;
  input.onchange=function(){
    let file=input.files&&input.files[0];
    if(!file){
      // No file selected: refund the charge.
      let rate=fanChatRate();
      if(rate>0){s.balance=Number(s.balance||0)+rate;s.earn=Number(s.earn||0)-rate;}
      save();updateFanChatBalance();return;
    }
    let r=new FileReader();
    r.onload=function(){
      if(!f.messages)f.messages=[];
      f.messages.push({from:'fan',text:label+' · '+file.name,media:r.result,mediaType:file.type,ts:Date.now(),adminRead:false});
      save();renderFanChat();updateFanChatBalance();lowBalancePopup();
    };
    r.readAsDataURL(file);
  };
  input.click();
}

function toggleFanGifts(){
  const p=document.getElementById('fanGiftPanel');
  const a=document.getElementById('fanGiftArrow');
  if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(a)a.textContent=open?'⌄':'⌃';
}


function toggleFanChatInfo(){
  const p=document.getElementById('fanChatInfoPanel');
  const a=document.getElementById('fanChatInfoArrow');
  if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(a)a.textContent=open?'⌄':'⌃';
}

async function sendFanMessage(){
  let f=getActiveFan(),el=document.getElementById('fanChatText');
  if(!f||!el)return;
  let text=el.value.trim();if(!text)return;
  let rate=fanChatRate();
  if(rate>0 && Number(s.balance||0)<rate){
    alert('⚠️ Insufficient wallet balance. Please recharge to continue chatting.');
    return;
  }
  let chatId=String(f.chatId||f.chatID||'');
  const creatorId=String(f.creatorId||f.userId||f.id||'');
  const msgId='msg_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  // Demo accounts intentionally have no server-side user id/session.
  // Decide this BEFORE creating a chat so the hosted demo never sends
  // fake/empty fan IDs to the production API. Real authenticated fans
  // continue through the server-authoritative billing path.
  const serverFanId = String(s.fanAccount?.id||s.auth?.user?.id||s.userId||'').trim();
  const serverSignedIn = !!(s.auth?.status==='signed_in' && s.auth?.user?.id && String(s.auth?.user?.role||'fan').toLowerCase()==='fan');
  const isDemoFan = !serverSignedIn || !serverFanId;
  try{
    if(isDemoFan){
      throw new Error('__DEMO_CHAT_FALLBACK__');
    }
    if(!chatId && creatorId){
      const cr=await fetch('/api/chats',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({fanId:serverFanId,creatorId})});
      const cd=await cr.json().catch(()=>({}));
      if(cr.ok&&cd.chat?.id){chatId=String(cd.chat.id);f.chatId=chatId;}
      else if(cr.status!==401&&cr.status!==404&&cr.status!==405)throw new Error(cd.error||'Chat could not be opened');
    }
    if(!chatId)throw new Error('Chat is not connected to a production account');
    const res=await fetch('/api/messages',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:msgId,chatId,body:text})});
    const data=await res.json().catch(()=>({}));
    if(res.status===402){alert('⚠️ Insufficient wallet balance. Please recharge to continue chatting.');return;}
    if(res.ok){
      const charged=Number(data.chargedPaise||0)/100;
      if(charged>0){
        s.balance=Math.max(0,Number(s.balance||0)-charged);
        if(!Array.isArray(s.tx))s.tx=[];
        s.tx.push({d:'Paid chat message · '+(f.name||'Creator'),a:charged,ts:Date.now(),type:'chat-message',referenceId:msgId});
      }
      if(!f.messages)f.messages=[];
      f.messages.push({from:'fan',text,ts:Date.now(),adminRead:false,id:msgId});
      el.value='';save();renderFanChat();updateFanChatBalance();lowBalancePopup();return;
    }
    if(res.status!==401&&res.status!==404&&res.status!==405)throw new Error(data.error||'Message could not be sent');
    if(location.protocol!=='file:'){alert('⚠️ Chat server is not connected. Message was not charged.');return;}
  }catch(e){
    const demoFallback = String(e?.message||'')==='__DEMO_CHAT_FALLBACK__';
    if(location.protocol!=='file:' && !demoFallback){
      alert('⚠️ '+String(e?.message||'Chat server unavailable')+'\n\nMessage was not charged.');
      return;
    }
  }
  if(rate>0){
    s.balance=Number(s.balance||0)-rate;
    s.earn=Number(s.earn||0)+rate;
    if(!Array.isArray(s.tx))s.tx=[];
    s.tx.push({d:'Paid chat message · '+(f.name||'Creator'),a:rate,ts:Date.now(),type:'chat-message-demo'});
  }
  if(!f.messages)f.messages=[];
  f.messages.push({from:'fan',text,ts:Date.now(),adminRead:false,id:msgId});
  el.value='';save();renderFanChat();updateFanChatBalance();lowBalancePopup();
}
function unlockPaidChat(){
  let f=getActiveFan(); if(!f)return alert('Creator profile unavailable.');
  let price=Number(f.chatPrice||0);
  if(price<=0){
    s.chatAccess[f.id]=true; save(); renderChatAccess(); return;
  }
  if(Number(s.balance||0)<price)return alert('Wallet balance is insufficient. Please recharge first.');
  if(!confirm('Unlock private chat for ₹'+price+'?'))return;
  s.balance=Number(s.balance||0)-price;
  s.earn=Number(s.earn||0)+price;
  if(!s.chatAccess)s.chatAccess={};
  s.chatAccess[f.id]=true;
  if(!Array.isArray(s.tx))s.tx=[];
  s.tx.push({d:'Paid chat unlock · '+(f.name||'Fan'),a:price,ts:Date.now()});
  save(); renderChatAccess(); render();
}
function renderChatAccess(){
  updateFanChatBalance();
  let p=document.getElementById('fanChatPrice');if(p)p.parentElement.parentElement.style.display='none';
  let b=document.getElementById('unlockChatBtn');if(b)b.style.display='none';
  let st=document.getElementById('chatAccessStatus');if(st)st.style.display='none';
}
function openAdminChat(id){
  let f=(s.fans||[]).find(x=>x.id===id); if(!f)return;
  s.activeFanId=id; save();
  let t=document.getElementById('adminChatTitle');if(t)t.textContent='💬 '+(f.name||'Fan');
  let p=document.getElementById('adminChatPrice');if(p)p.value=f.chatPrice||0;
  let l=document.getElementById('adminChatPriceLabel');if(l)l.textContent='₹'+(f.chatPrice||0);
  renderAdminChat(); show('adminChat');
}
function saveAdminChatPrice(){
  let f=(s.fans||[]).find(x=>x.id===s.activeFanId); if(!f)return;
  let v=Number(document.getElementById('adminChatPrice').value);
  if(!Number.isFinite(v)||v<0)return alert('Enter a valid chat price.');
  f.chatPrice=v; save();
  let l=document.getElementById('adminChatPriceLabel');if(l)l.textContent='₹'+v;
  renderFans(); alert('Chat price updated.');
}


function hideFanChatPrices(){
  // Fan mode must never expose the creator's per-message rate.
  document.querySelectorAll('body *').forEach(el=>{
    if(el.children.length===0 && el.textContent){
      let t=el.textContent;
      if(/₹\s*[\d,]+\s*\/\s*message|₹\s*[\d,]+\s+per\s+message|Rs\.?\s*[\d,]+\s*\/\s*message/i.test(t)){
        el.textContent=t.replace(/₹\s*[\d,]+\s*\/\s*message/gi,'')
                        .replace(/₹\s*[\d,]+\s+per\s+message/gi,'')
                        .replace(/Rs\.?\s*[\d,]+\s*\/\s*message/gi,'');
      }
    }
  });
}
function chatTime(ts){
  if(!ts)return '';
  return new Date(ts).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'});
}
function markFanChatRead(){
  let f=getActiveFan(); if(!f||!Array.isArray(f.messages))return;
  let changed=false;
  f.messages.forEach(m=>{if(m.from==='admin' && !m.fanRead){m.fanRead=true;changed=true;}});
  if(changed)save();
}
function renderFanChat(){hideFanChatPrices();
  let f=getActiveFan(),box=document.getElementById('chatbox');
  if(!box||!f)return;
  markFanChatRead();
  box.innerHTML=(f.messages||[]).map(m=>{
    let media=m.media?(m.mediaType&&m.mediaType.startsWith('image/')?`<img src="${m.media}" style="max-width:100%;max-height:220px;border-radius:12px;display:block;margin-top:6px">`:m.mediaType&&m.mediaType.startsWith('video/')?`<video src="${m.media}" controls style="max-width:100%;max-height:240px;border-radius:12px;display:block;margin-top:6px"></video>`:m.mediaType&&m.mediaType.startsWith('audio/')?`<audio src="${m.media}" controls style="max-width:100%;margin-top:6px"></audio>`:''):'';
    return `<div style="padding:8px 10px;margin:6px 0;border-radius:12px;background:${m.from==='fan'?'#f4f1f8':'#fff0f7'}">${typeof sanitizeChatText==='function'?sanitizeChatText(m.text):String(m.text||'').replace(/<[^>]*>/g,'').trim()}${media}<div class="chat-meta"><span>${m.from==='fan'?'You':'Creator'}</span><span>${chatTime(m.ts)}</span></div></div>`;
  }).join('')||'<div class="muted">No messages yet.</div>';
  box.scrollTop=box.scrollHeight;
  updateFanChatBalance();
}
function renderAdminChat(){
  let f=(s.fans||[]).find(x=>x.id===s.activeFanId),box=document.getElementById('adminChatMessages');
  if(!box||!f)return;
  box.innerHTML=(f.messages||[]).map(m=>{
    let media=m.media ? (m.mediaType&&m.mediaType.startsWith('image/')?`<img src="${m.media}" style="max-width:100%;max-height:220px;border-radius:12px;display:block;margin-top:6px">`:m.mediaType&&m.mediaType.startsWith('video/')?`<video src="${m.media}" controls style="max-width:100%;max-height:240px;border-radius:12px;display:block;margin-top:6px"></video>`:m.mediaType&&m.mediaType.startsWith('audio/')?`<audio src="${m.media}" controls style="max-width:100%;margin-top:6px"></audio>`:''):'';
    return `<div style="padding:8px 10px;margin:6px 0;border-radius:12px;background:${m.from==='admin'?'#fff0f7':'#f4f1f8'}">${typeof sanitizeChatText==='function'?sanitizeChatText(m.text):String(m.text||'').replace(/<[^>]*>/g,'').trim()}${media}<div class="chat-meta"><span>${m.from==='admin'?'You':'Fan'}</span><span>${chatTime(m.ts)}</span></div></div>`;
  }).join('')||'<div class="muted">No messages yet.</div>';
  box.scrollTop=box.scrollHeight;
  f.messages.forEach(m=>{if(m.from==='fan')m.adminRead=true;});
  save();
  renderFans();
}
function sendAdminText(){
  let f=(s.fans||[]).find(x=>x.id===s.activeFanId),el=document.getElementById('adminChatText');
  if(!f||!el)return;
  let text=el.value.trim();if(!text)return;
  if(!f.messages)f.messages=[];
  f.messages.push({from:'admin',text,ts:Date.now(),fanRead:false});
  if(!Array.isArray(s.notifications))s.notifications=[];
  s.notifications.unshift({id:'n'+Date.now(),icon:'💬',title:'New creator message',text:'Kaira sent you a new chat message.',ts:Date.now(),read:false,category:'creator'});
  el.value='';save();renderAdminChat();
}
function adminAttach(label){
  let f=(s.fans||[]).find(x=>x.id===s.activeFanId);if(!f)return;
  if(!f.messages)f.messages=[];
  let input=document.createElement('input');
  input.type='file';
  input.accept=label.includes('Photo')?'image/*':label.includes('Video')?'video/*':label.includes('Audio')?'audio/*':'*/*';
  input.onchange=function(){
    let file=input.files&&input.files[0];if(!file)return;
    let r=new FileReader();
    r.onload=function(){
      f.messages.push({from:'admin',text:label+' · '+file.name,media:r.result,mediaType:file.type,ts:Date.now(),fanRead:false});
      save();renderAdminChat();
    };
    r.readAsDataURL(file);
  };
  input.click();
}
function renderCreatorProfileFields(){
  let p=s.creatorProfile||{};
  let map={creatorName:p.name||'',creatorEmail:p.email||'',creatorMobile:p.mobile||''};
  Object.keys(map).forEach(id=>{let el=document.getElementById(id);if(el)el.value=map[id]});
  let a=document.getElementById('creatorPicPreview'); if(a)a.innerHTML=p.pic?'<img src="'+p.pic+'" style="max-width:100%;max-height:160px;border-radius:14px;object-fit:cover">':'';
  let b=document.getElementById('creatorCoverPreview'); if(b)b.innerHTML=p.cover?'<img src="'+p.cover+'" style="width:100%;max-height:160px;border-radius:14px;object-fit:cover">':'';
}
function sendSupport(){let e=s.supportEmail,m=document.getElementById('supportMessage').value.trim();if(!e)return alert('The admin has not set a support email yet.');if(!m)return alert('Enter a message.');window.location.href='mailto:'+e+'?subject=CreatorChat%20Support&body='+encodeURIComponent(m)}
function setRate(v){s.rate=Number(v);save()}
function togglePostAccess(){let sub=document.getElementById('postAccess').value==='subscription';document.getElementById('postPaidBox').style.display=sub?'none':'block';document.getElementById('postSubBox').style.display=sub?'block':'none';renderPlanSelect()}
function renderPlanSelect(){let el=document.getElementById('postPlan');if(!el)return;let active=s.plans.filter(p=>p.active);el.innerHTML=active.length?active.map(p=>`<option value="${p.id}">${p.name} — ${money(p.price)}</option>`).join(''):'<option value="">No active subscription plans</option>'}
function addGift(){let e=document.getElementById('giftEmoji').value.trim()||'🎁',n=document.getElementById('giftName').value.trim(),p=Number(document.getElementById('giftPrice').value);if(!n||p<0||!Number.isFinite(p))return alert('Gift name and a valid amount are required.');s.giftCatalog.push({id:Date.now(),emoji:e,name:n,price:p,active:true});document.getElementById('giftEmoji').value='';document.getElementById('giftName').value='';document.getElementById('giftPrice').value='';save()}
function toggleGift(id){let g=s.giftCatalog.find(x=>x.id===id);if(g)g.active=!g.active;save()}
function editGift(id){
  let g=s.giftCatalog.find(x=>x.id===id);if(!g)return;
  let n=prompt('Gift name',g.name);if(n===null)return;
  let p=Number(prompt('Gift amount ₹',g.price));if(!Number.isFinite(p)||p<0)return alert('Enter a valid amount.');
  let e=prompt('Gift emoji',g.emoji);if(e===null)e=g.emoji;
  g.name=n.trim()||g.name;g.price=p;g.emoji=e.trim()||g.emoji;save();
}
function editPlan(id){
  let p=s.plans.find(x=>x.id===id);if(!p)return;
  let n=prompt('Plan name',p.name);if(n===null)return;
  let d=prompt('Duration',p.duration);if(d===null)return;
  let v=Number(prompt('Plan amount ₹',p.price));if(!Number.isFinite(v)||v<0)return alert('Enter a valid amount.');
  p.name=n.trim()||p.name;p.duration=d.trim()||p.duration;p.price=v;save();
}
function addPlan(){let n=document.getElementById('planName').value.trim(),d=document.getElementById('planDuration').value.trim(),p=Number(document.getElementById('planPrice').value);if(!n||!d||p<0||!Number.isFinite(p))return alert('Plan name, duration, and a valid amount are required.');let dm=(d.match(/\d+/)||['1'])[0];s.plans.push({id:Date.now(),name:n,duration:d,durationMonths:Number(dm),price:p,active:true,fanVisible:true});document.getElementById('planName').value='';document.getElementById('planDuration').value='';document.getElementById('planPrice').value='';save()}
function togglePlan(id){let p=s.plans.find(x=>x.id===id);if(p){p.active=!p.active;p.fanVisible=p.active;}save()}
function toggleFree(){s.free=!s.free;save()}
function updateWalletCustomBonus(){let el=document.getElementById('walletCustomBonus');if(!el)return;let a=Number(document.getElementById('walletCustomAmount').value)||0;if(a<500){el.textContent='Minimum ₹500 · Maximum ₹10,000';return}if(a>10000){el.textContent='Maximum ₹10,000 per recharge';return}let b=rechargeBonus(a);el.textContent=`You pay ₹${a} + ₹${b} bonus = ₹${a+b} wallet credit`;}
function customWalletRecharge(){let el=document.getElementById('walletCustomAmount'),a=Number(el?.value),b=rechargeBonus(a);if(!Number.isFinite(a)||a<500)return alert('Minimum recharge is ₹500.');if(a>10000)return alert('Maximum recharge is ₹10,000.');s.balance+=a+b;s.tx.push({d:`Wallet recharge ₹${a} + ₹${b} bonus (Demo)`,a:a+b,ts:Date.now()});el.value='';updateWalletCustomBonus();save();alert(`₹${a} + ₹${b} bonus = ₹${a+b} wallet credit (demo).`)}
function recharge(v){
      if(v<500)return alert('Minimum recharge is ₹500.');
      if(v>10000)return alert('Maximum recharge is ₹10,000.');
      let b=rechargeBonus(v);
      s.balance+=v+b;
      s.tx.push({d:`Wallet recharge ₹${v} + ₹${b} bonus (Demo)`,a:v+b,ts:Date.now()});
      save();
      alert(`₹${v} + ₹${b} bonus = ₹${v+b} wallet credit (demo).`);
    }
function subscribe(v,n){
  v=Number(v||0);
  if(s.balance<v)return alert('Wallet balance insufficient. Recharge first.');
  let plan=(s.plans||[]).find(p=>p.name===n);
  let months=Number(plan&&plan.durationMonths||0);
  if(!months){
    let m=(plan&&plan.duration||'').match(/(\\d+)/); months=m?Number(m[1]):1;
  }
  s.balance-=v;s.member=n;s.orders++;s.earn+=v;
  s.subscription={name:n,price:v,durationMonths:months,startedAt:Date.now(),expiresAt:Date.now()+months*30*24*60*60*1000};
  (s.posts||[]).forEach(p=>{if(p.access==='subscription'){let q=s.plans.find(x=>x.id===p.planId);if(q&&q.name===n)p.unlocked=true;}});
  s.tx.push({d:'Subscription — '+n,a:v,ts:Date.now()});
  save();render();alert('Subscription activated (demo).');
}
function gift(v,n){if(s.balance<v)return alert('Wallet balance insufficient. Recharge first.');s.balance-=v;s.orders++;s.earn+=v;s.tx.push({d:'Gift — '+n,a:v,ts:Date.now()});save();alert('Gift sent (demo).')}
function updateMediaPreview(){let box=document.getElementById('mediaPreview'),files=[...document.getElementById('postMedia').files],blur=Number(document.getElementById('blurRange').value);box.innerHTML=files.length?files.map(f=>`<div style="padding:6px 0;border-bottom:1px solid #eee">${f.type.startsWith('video/')?'🎥':'📸'} ${f.name}</div>`).join(''):'No media selected'}
document.addEventListener('change',e=>{if(e.target.id==='postMedia')updateMediaPreview()});
document.addEventListener('input',e=>{if(e.target.id==='blurRange')document.getElementById('blurValue').textContent=e.target.value+'px'});
function renderSelected(inputId,boxId){const box=document.getElementById(boxId);box.innerHTML='';[...document.getElementById(inputId).files].forEach(f=>{const w=document.createElement('div');w.style.cssText='margin:8px 0;border-radius:12px;overflow:hidden;background:#eee';let e;if(f.type.startsWith('image/')){e=document.createElement('img');e.src=URL.createObjectURL(f)}else{e=document.createElement('video');e.src=URL.createObjectURL(f);e.controls=true;e.muted=true;e.playsInline=true}e.style.cssText='width:100%;max-height:280px;object-fit:cover;display:block';e.className='liveMedia';w.appendChild(e);box.appendChild(w)});applyBlur()}
function applyBlur(){const v=Number(document.getElementById('blurRange').value);document.getElementById('blurValue').textContent=v+'px';document.querySelectorAll('.liveMedia').forEach(e=>e.style.filter=`blur(${v}px)`)}
document.addEventListener('change',e=>{if(e.target.id==='postPhoto')renderSelected('postPhoto','photoPreview');if(e.target.id==='postVideo')renderSelected('postVideo','videoPreview')});
document.addEventListener('input',e=>{if(e.target.id==='blurRange')applyBlur()});

function collectPostForm(){
  let t=document.getElementById('postTitle')?.value.trim()||'';
  let x=document.getElementById('postText')?.value.trim()||'';
  let access=document.getElementById('postAccess')?.value||'paid';
  let p=Number(document.getElementById('postPrice')?.value||0);
  let planId=Number(document.getElementById('postPlan')?.value||0);
  let blur=Number(document.getElementById('blurRange')?.value||12);
  let photos=[...((document.getElementById('postPhoto')||{}).files||[])];
  let videos=[...((document.getElementById('postVideo')||{}).files||[])];
  let media=[...photos,...videos].map(f=>({name:f.name,type:f.type,size:f.size}));
  return {title:t,text:x,access,price:access==='paid'?p:0,planId:access==='subscription'?planId:null,blur,media,files:[...photos,...videos]};
}
function clearPostForm(){
  ['postTitle','postText','postPrice','postPhoto','postVideo'].forEach(id=>{let e=document.getElementById(id);if(!e)return;if(e.type==='file')e.value='';else e.value='';});
  ['photoPreview','videoPreview'].forEach(id=>{let e=document.getElementById(id);if(e)e.innerHTML='';});
}
function savePostDraft(){
  let p=collectPostForm();
  if(!p.title && !p.text && !p.media.length)return alert('Add some content for the draft.');
  p.id=Date.now();p.status='draft';p.unlocked=false;
  s.posts.push(p);save();clearPostForm();render();alert('Post saved as draft.');
}
function publishDraft(id){
  let p=s.posts.find(x=>x.id===id);if(!p)return;
  p.status='published';save();render();
}
function deleteDraft(id){
  if(!confirm('Delete this draft?'))return;
  s.posts=s.posts.filter(p=>p.id!==id);save();render();
}
function toggleSavedPost(id){
  s.savedPosts=Array.isArray(s.savedPosts)?s.savedPosts:[];
  const i=s.savedPosts.indexOf(id);
  if(i>=0)s.savedPosts.splice(i,1);else s.savedPosts.push(id);
  save();renderSavedPosts();render();
}
function renderSavedPosts(){
  const box=document.getElementById('savedPostList');if(!box)return;
  const ids=Array.isArray(s.savedPosts)?s.savedPosts:[];
  const posts=(s.posts||[]).filter(p=>p.status!=='draft'&&ids.includes(p.id));
  box.innerHTML=posts.length?posts.slice().reverse().map(p=>`<div class="row" style="padding:9px 0;border-bottom:1px solid #eee"><span><b>${p.title||'Untitled'}</b><div class="muted">${p.access==='subscription'?'⭐ Subscription':money(p.price)}</div></span><button class="btn light" onclick="toggleSavedPost(${p.id})">Remove</button></div>`).join(''):'<div class="muted">No saved posts yet.</div>';
}
function renderDraftPosts(){
  const el=document.getElementById('draftPostList');if(!el)return;
  const drafts=(s.posts||[]).filter(p=>p.status==='draft').slice().reverse();
  el.innerHTML=drafts.length?drafts.map(p=>`<div style="padding:11px 0;border-bottom:1px solid #eee">
    <div class="row"><b>${p.title||'Untitled draft'}</b><span class="pill">DRAFT</span></div>
    <div class="muted" style="margin-top:5px">${p.text||'No description'}</div>
    <div style="margin-top:8px">
      <button class="btn" onclick="publishDraft(${p.id})">PUBLISH</button>
      <button class="btn light" onclick="deleteDraft(${p.id})">DELETE</button>
    </div>
  </div>`).join(''):'<div class="muted">No drafts yet.</div>';
}

function createPost(){let t=document.getElementById('postTitle').value.trim(),x=document.getElementById('postText').value.trim(),access=document.getElementById('postAccess').value,p=Number(document.getElementById('postPrice').value),planId=Number(document.getElementById('postPlan').value),photos=[...document.getElementById('postPhoto').files],videos=[...document.getElementById('postVideo').files],blur=Number(document.getElementById('blurRange').value);if(!t)return alert('Post title is required.');if(access==='paid'&&(p<0||!Number.isFinite(p)))return alert('Enter a valid amount for a paid post.');if(access==='subscription'&&!s.plans.some(q=>q.id===planId&&q.active))return alert('Select an active subscription plan.');let media=[...photos,...videos].map(f=>({name:f.name,type:f.type,size:f.size}));s.posts.push({id:Date.now(),status:'published',title:t,text:x,access,price:access==='paid'?p:0,planId:access==='subscription'?planId:null,unlocked:false,blur,media});save();document.getElementById('postTitle').value='';document.getElementById('postText').value='';document.getElementById('postPrice').value='';document.getElementById('postPhoto').value='';document.getElementById('postVideo').value='';document.getElementById('photoPreview').innerHTML='';document.getElementById('videoPreview').innerHTML='';alert('Post published (demo).')}
function editPost(id){
  let p=s.posts.find(x=>x.id===id);if(!p)return;
  let title=prompt('Post title',p.title);if(title===null)return;
  let price=p.access==='paid'?Number(prompt('Paid amount ₹',p.price)):p.price;
  if(p.access==='paid'&&(!Number.isFinite(price)||price<0))return alert('Enter a valid amount.');
  p.title=title.trim()||p.title;if(p.access==='paid')p.price=price;
  p.blur=Number(prompt('Blur (0-30)',p.blur||12));if(!Number.isFinite(p.blur))p.blur=12;
  save();
}
function deletePost(id){
  if(!confirm('Delete this post?'))return;
  s.posts=s.posts.filter(p=>p.id!==id);save();
}
function unlockPost(id){
      let post=s.posts.find(p=>p.id===id);if(!post||post.unlocked)return;
      if(post.access==='subscription'){
        let plan=s.plans.find(q=>q.id===post.planId&&q.active);
        if(!plan)return alert('This subscription plan is no longer active.');
        if(s.member!==plan.name){
          alert('To view this post, you need a '+plan.name+' subscription. Go to the Creator section and subscribe to a plan.');
          return;
        }
        post.unlocked=true;save();render();alert('Subscription post unlocked (demo).');return;
      }
      if(s.balance<post.price)return alert('Wallet balance insufficient. Recharge first.');
      s.balance-=post.price;post.unlocked=true;s.orders++;s.earn+=post.price;
      s.tx.push({d:'Paid post — '+post.title,a:post.price,ts:Date.now()});save();alert('Post unlocked (demo).');
    }
function send(){let i=document.getElementById('msg'),t=i.value.trim();if(!t)return;if(!s.free&&s.balance<s.rate)return alert('Wallet balance insufficient. Recharge first.');if(!s.free){s.balance-=s.rate;s.earn+=s.rate;s.orders++;s.tx.push({d:'Paid message',a:s.rate,ts:Date.now()})}let box=document.getElementById('chatbox'),mine=document.createElement('div'),reply=document.createElement('div');mine.className='bubble mine';mine.textContent=t;reply.className='bubble';reply.textContent='Received ❤️';box.append(mine,reply);i.value='';save()}
function renderTransactions(){
  let now=Date.now(), thirty=30*24*60*60*1000;
  let recent=(s.tx||[]).filter(t=>(!t.ts||now-t.ts<=thirty)&&(String(t.type||'').toLowerCase()==='wallet-recharge'||String(t.d||'').toLowerCase().includes('wallet recharge')||String(t.d||'').toLowerCase().includes('wallet top up')||String(t.d||'').toLowerCase().includes('wallet top-up'))).slice().reverse().slice(0,20);
  let fan=document.getElementById('fanHistoryList');
  if(fan) fan.innerHTML=recent.length?recent.map(t=>`<div class="row" style="padding:9px 0;border-bottom:1px solid #eee"><span>${t.d}</span><b>${money(t.a)}</b></div>`).join(''):'<div class="muted">No recent transactions.</div>';
  let admin=document.getElementById('adminTxList');
  if(admin) admin.innerHTML=(s.tx||[]).slice().reverse().map(t=>`<div class="row" style="padding:9px 0;border-bottom:1px solid #eee"><span>${t.d}<div class="muted">${t.ts?new Date(t.ts).toLocaleString():'Recorded'}</div></span><b>${money(t.a)}</b></div>`).join('')||'<div class="muted">No transactions yet.</div>';
}


function renderMySubscription(){
  let card=document.getElementById('mySubscriptionCard'),info=document.getElementById('mySubscriptionInfo'),st=document.getElementById('mySubscriptionStatus');
  if(!card||!info||!st)return;
  let sub=s.subscription;
  if(!sub||!sub.expiresAt||Date.now()>=Number(sub.expiresAt)){
    card.style.display='';
    st.textContent='Not active';
    info.innerHTML='<div class="muted">No active subscription. Choose a plan above to unlock creator-only posts.</div>';
    if(sub && Date.now()>=Number(sub.expiresAt)){
      s.member='';
      (s.posts||[]).forEach(p=>{if(p.access==='subscription')p.unlocked=false;});
      s.subscription=null;
      save();
    }
    return;
  }
  let days=Math.max(0,Math.ceil((Number(sub.expiresAt)-Date.now())/86400000));
  st.textContent='Active';
  info.innerHTML=`<div class="row"><span><b>${sub.name}</b><div class="muted">Expires ${new Date(sub.expiresAt).toLocaleDateString('en-IN')}</div></span><span class="pill">${days} day${days===1?'':'s'} left</span></div>`;
}

let fanPostFilter='all';
function setFanPostFilter(v){
  fanPostFilter=v;
  ['filterAll','filterSub','filterPaid'].forEach(id=>{
    let b=document.getElementById(id);if(!b)return;
    b.classList.toggle('light',id!=='filter'+(v==='all'?'All':v==='subscription'?'Sub':'Paid'));
  });
  render();
}
function renderFanOffers(activePlans){
  const el=document.getElementById('fanOffers');
  const card=document.getElementById('creatorOffersCard');
  if(!el||!card)return;
  const monthly=activePlans.find(p=>Number(p.durationMonths||0)===1);
  const offers=activePlans.map(p=>{
    const months=Number(p.durationMonths||0);
    let saving=0;
    if(monthly && months>1 && Number(monthly.price)>0) saving=(Number(monthly.price)*months)-Number(p.price);
    return {...p,saving};
  }).filter(p=>p.saving>0).sort((a,b)=>b.saving-a.saving).slice(0,3);
  if(!offers.length){
    card.style.display='none';
    return;
  }
  card.style.display='';
  el.innerHTML=offers.map(p=>`<div class="row" style="padding:10px 0;border-bottom:1px solid #eee">
    <span><b>✨ ${p.name}</b><div class="muted">${p.duration} · Save ${money(p.saving)}</div></span>
    <button class="btn light" onclick="subscribe(${p.price},'${p.name}')">View</button>
  </div>`).join('');
}

function filterCreatorPosts(filter){
  const root=document.getElementById('posts');
  if(!root)return;
  document.querySelectorAll('#creatorPostFilters .post-filter').forEach(b=>{
    b.classList.toggle('active',b.dataset.filter===filter);
  });
  const cards=root.querySelectorAll('[data-post-type], .post-card, .post-item');
  if(!cards.length)return;
  cards.forEach(card=>{
    const type=(card.dataset.postType||card.dataset.type||card.textContent||'').toLowerCase();
    let show=filter==='all';
    if(filter==='paid')show=type.includes('paid')||type.includes('₹');
    if(filter==='subscription')show=type.includes('subscription')||type.includes('sub');
    if(filter==='free')show=type.includes('free')||type.includes('complementary');
    card.style.display=show?'':'none';
  });
}



let editingPostIndex=-1;
function openPostEdit(index,text){
  editingPostIndex=Number(index);
  const m=document.getElementById('postEditModal'),t=document.getElementById('postEditText');
  if(!m||!t)return;
  t.value=text||'';
  m.style.setProperty('display','flex','important');
}
function closePostEdit(){
  editingPostIndex=-1;
  const m=document.getElementById('postEditModal');
  if(m)m.style.setProperty('display','none','important');
}
function savePostEdit(){
  if(editingPostIndex<0||!Array.isArray(s.posts)||!s.posts[editingPostIndex])return;
  const t=document.getElementById('postEditText');
  s.posts[editingPostIndex].text=t?t.value.trim():s.posts[editingPostIndex].text;
  save();
  closePostEdit();
  if(typeof renderPosts==='function')renderPosts();
  else if(typeof render==='function')render();
}
function deleteCreatorPost(index){
  index=Number(index);
  if(!Array.isArray(s.posts)||!s.posts[index])return;
  if(!confirm('Delete this post?'))return;
  s.posts.splice(index,1);
  save();
  if(typeof renderPosts==='function')renderPosts();
  else if(typeof render==='function')render();
}

function openPostPreview(title,body){
  const m=document.getElementById('postPreviewModal'),t=document.getElementById('postPreviewTitle'),b=document.getElementById('postPreviewBody');
  if(!m||!t||!b)return;
  t.textContent=title||'Post Preview';
  b.innerHTML=body||'<div class="muted">No preview available.</div>';
  m.style.setProperty('display','flex','important');
}
function closePostPreview(){
  const m=document.getElementById('postPreviewModal');
  if(m)m.style.setProperty('display','none','important');
}



function creatorAvailableEarnings(){
  const tx=Array.isArray(s.tx)?s.tx:[];
  return tx.filter(x=>x.type==='earning'||x.type==='subscription'||x.type==='gift')
           .reduce((n,x)=>n+Number(x.a||x.amount||0),0);
}


function addAdminAudit(action,detail){
  s.adminAudit=Array.isArray(s.adminAudit)?s.adminAudit:[];
  s.adminAudit.push({id:Date.now(),action:String(action||'Action'),detail:String(detail||''),at:new Date().toISOString()});
  if(s.adminAudit.length>100)s.adminAudit=s.adminAudit.slice(-100);
}
function renderAdminAudit(){
  const el=document.getElementById('adminAuditList');if(!el)return;
  const rows=Array.isArray(s.adminAudit)?s.adminAudit.slice().reverse():[];
  el.innerHTML=rows.length?rows.slice(0,25).map(r=>`<div style="padding:9px 0;border-bottom:1px solid #eee">
    <b>${r.action||'Action'}</b>
    <div class="muted">${r.detail||''}</div>
    <small class="muted">${r.at?new Date(r.at).toLocaleString():''}</small>
  </div>`).join(''):'<div class="muted">No admin activity yet.</div>';
}

function toggleAdminBackup(){
  const p=document.getElementById('adminBackupPanel');if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
}
function downloadAdminBackup(){
  const payload={version:1,exportedAt:new Date().toISOString(),state:s};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='creatorchat-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  if(typeof addAdminAudit==='function')addAdminAudit('Backup downloaded','App data export created');
  save();
}
function restoreAdminBackup(event){
  const file=event.target.files&&event.target.files[0], status=document.getElementById('adminBackupStatus');
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const payload=JSON.parse(reader.result);
      if(!payload||!payload.state||typeof payload.state!=='object')throw new Error('Invalid backup');
      if(!confirm('Restore this backup? Current app data will be replaced.'))return;
      s=payload.state;
      if(typeof addAdminAudit==='function')addAdminAudit('Backup restored','App data restored from JSON backup');
      save();
      if(status)status.textContent='Backup restored successfully.';
      if(typeof render==='function')render();
    }catch(e){
      if(status)status.textContent='Invalid backup file.';
    }finally{event.target.value='';}
  };
  reader.readAsText(file);
}

function toggleAdminAudit(){
  const p=document.getElementById('adminAuditPanel');if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderAdminAudit();
}

function renderAdminPayouts(){
  const el=document.getElementById('adminPayoutList');if(!el)return;
  const req=Array.isArray(s.payoutRequests)?s.payoutRequests.slice().reverse():[];
  el.innerHTML=req.length?req.map((r,i)=>`<div class="payout-row" style="padding:10px 0;border-bottom:1px solid #eee">
    <div class="row"><b>${money(r.amount||0)}</b><span class="pill">${r.status||'pending'}</span></div>
    <div class="muted" style="margin:4px 0">Method: ${(r.method||'bank').toUpperCase()}</div>
    ${(r.status||'pending')==='pending'?`<div style="display:flex;gap:8px">
      <button class="btn" onclick="setPayoutStatus(${s.payoutRequests.length-1-i},'approved')">Approve</button>
      <button class="btn light" onclick="setPayoutStatus(${s.payoutRequests.length-1-i},'rejected')">Reject</button>
    </div>`:''}
  </div>`).join(''):'<div class="muted">No payout requests.</div>';
}
function toggleAdminPayouts(){
  const p=document.getElementById('adminPayoutPanel');if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderAdminPayouts();
}
function setPayoutStatus(index,status){
  if(!Array.isArray(s.payoutRequests)||!s.payoutRequests[index])return;
  s.payoutRequests[index].status=status;
  s.payoutRequests[index].reviewedAt=new Date().toISOString();
  addAdminAudit('Payout '+status, money(s.payoutRequests[index].amount||0)+' via '+(s.payoutRequests[index].method||'bank').toUpperCase());
  addNotification('Payout '+status,money(s.payoutRequests[index].amount||0)+' request reviewed','payout');
  save();renderAdminPayouts();
}

function toggleCreatorPayouts(){
  if(s.mode!=='admin')return;
  const p=document.getElementById('creatorPayoutPanel');
  if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(!open){
    const a=document.getElementById('payoutAvailable');
    if(a)a.textContent=money(creatorAvailableEarnings());
  }
}
function requestCreatorPayout(){
  if(s.mode!=='admin')return;
  const amount=Number(document.getElementById('payoutAmount')?.value||0);
  const method=document.getElementById('creatorPayoutMethod')?.value||'bank';
  const available=creatorAvailableEarnings();
  const status=document.getElementById('payoutRequestStatus');
  if(amount<=0){if(status)status.textContent='Enter a valid amount.';return;}
  if(amount>available){if(status)status.textContent='Amount is higher than available earnings.';return;}
  s.payoutRequests=Array.isArray(s.payoutRequests)?s.payoutRequests:[];
  s.payoutRequests.push({id:Date.now(),amount,method,status:'pending',createdAt:new Date().toISOString()});
  addNotification('Payout request submitted',money(amount)+' via '+method.toUpperCase(),'payout');
  save();
  if(status)status.textContent='Payout request submitted — Pending review.';
  const input=document.getElementById('payoutAmount');if(input)input.value='';
}

function renderCreatorAnalytics(){
  const p=document.getElementById('creatorAnalyticsPanel');
  const posts=document.getElementById('caPosts'),subs=document.getElementById('caSubscribers'),
        msgs=document.getElementById('caMessages'),rev=document.getElementById('caRevenue');
  if(!p||!posts||!subs||!msgs||!rev)return;
  const all=Array.isArray(s.posts)?s.posts:[];
  posts.textContent=all.filter(x=>x.status!=='draft').length;
  subs.textContent=Number(s.subscribers||s.subscriptionCount||0);
  const chats=Array.isArray(s.messages)?s.messages:[];
  msgs.textContent=chats.length;
  const tx=Array.isArray(s.tx)?s.tx:[];
  const earned=tx.filter(x=>x.type==='earning'||x.type==='subscription'||x.type==='gift').reduce((n,x)=>n+Number(x.a||x.amount||0),0);
  rev.textContent=money(earned);
}
function toggleCreatorAnalytics(){
  const p=document.getElementById('creatorAnalyticsPanel');
  if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderCreatorAnalytics();
}


function ensureNotifications(){
  s.notifications=Array.isArray(s.notifications)?s.notifications:[];
}
function addNotification(title,text,type){
  ensureNotifications();
  s.notifications.push({id:Date.now()+Math.random(),title:String(title||'Notification'),text:String(text||''),type:type||'info',read:false,at:new Date().toISOString()});
  if(s.notifications.length>100)s.notifications=s.notifications.slice(-100);
}
function renderNotifications(){
  ensureNotifications();
  const list=document.getElementById('notificationList'),badge=document.getElementById('notificationBadge');
  if(!list||!badge)return;
  const unread=s.notifications.filter(n=>!n.read).length;
  badge.textContent=unread;
  badge.style.display=unread?'inline-block':'none';
  const rows=s.notifications.slice().reverse().slice(0,30);
  list.innerHTML=rows.length?rows.map(n=>`<div style="padding:10px 0;border-bottom:1px solid #eee;opacity:${n.read?.65:1}">
    <b>${n.title||'Notification'}</b>
    <div class="muted">${n.text||''}</div>
    <small class="muted">${n.at?new Date(n.at).toLocaleString():''}</small>
  </div>`).join(''):'<div class="muted">No notifications.</div>';
}
function toggleNotifications(){
  const c=document.getElementById('notificationCenter');if(!c)return;
  const open=c.style.display!=='none';
  c.style.setProperty('display',open?'none':'block','important');
  if(!open)renderNotifications();
}
function markAllNotificationsRead(){
  ensureNotifications();
  s.notifications.forEach(n=>n.read=true);
  save();renderNotifications();
}

function render(){
  refreshAdminDashboard();
  refreshAdminControlCenter();hideFanChatPrices();renderFanActivity();renderMySubscription();renderNotifications();renderFanNotifications();renderInsights();renderFanChat();
// Role guard: payout/creator analytics/admin payout controls must never render in Fan mode.
['creatorPayoutCard','creatorAnalyticsCard','adminPayoutCard'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.setProperty('display',s.mode==='admin'?'block':'none','important');});
renderTransactions();nav();
const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
const val=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v};
set('statusBtn',s.creatorOnline?'ONLINE':'OFFLINE');set('earn',money(s.earn));set('orders',s.orders);set('free',s.free?'ON':'OFF');val('rate',s.rate);set('fanRate',s.rate);set('chatRate',s.rate);set('balance',money(s.balance));set('fanWalletBalance',money(s.balance));if(s.fanAccount){val('fanName',s.fanAccount.name||'');val('fanContact',s.fanAccount.contact||'');val('fanSettingName',s.fanAccount.name||'');val('fanSettingEmail',s.fanAccount.email||'');val('fanSettingMobile',s.fanAccount.mobile||'');}set('membership',s.member);set('fanMember',s.member);set('fanMemberSettings',s.member);let publicStatus=s.creatorOnline?'Online':'Offline';['fanOnlineHome','fanOnlineProfile','fanOnlineChat'].forEach(id=>{let e=document.getElementById(id);if(e)e.textContent=publicStatus;});
renderPlanSelect();
const adminPlans=document.getElementById('adminPlans');if(adminPlans)adminPlans.innerHTML=s.plans.length?s.plans.map(p=>`<div class="row" style="padding:10px 0;border-bottom:1px solid #eee"><span><b>${p.name}</b><div class="muted">${p.duration} · ${money(p.price)}</div></span><span style="display:flex;gap:5px"><button class="btn light" onclick="editPlan(${p.id})">EDIT</button><button class="btn ${p.active?'light':''}" onclick="togglePlan(${p.id})">${p.active?'HIDE FROM FAN':'SHOW TO FAN'}</button></span></div>`).join(''):'No subscription plans created.';
const activePlans=s.plans.filter(p=>p.active&&p.fanVisible!==false).map(p=>({...p,durationMonths:p.durationMonths||({"1 Month":1,"3 Months":3,"6 Months":6,"12 Months":12}[p.duration]||0)}));
const fanPlans=document.getElementById('fanPlans');if(fanPlans)fanPlans.innerHTML=activePlans.length?activePlans.map(p=>`<div class="plan" style="margin-bottom:10px"><div class="row"><span><b>${p.name}</b><div class="muted">${p.duration}</div><strong>${money(p.price)}</strong></span><button class="btn" onclick="subscribe(${p.price},'${p.name}')">Subscribe</button></div></div>`).join(''):'<div class="muted">The creator has not made any subscription plans available yet.</div>';
renderFanOffers(activePlans);
const adminGiftsList=document.getElementById('adminGiftsList');if(adminGiftsList)adminGiftsList.innerHTML=s.giftCatalog.map(g=>`<div class="row" style="padding:9px 0;border-bottom:1px solid #eee"><span>${g.emoji} ${g.name}<div class="muted">${money(g.price)}</div></span><span style="display:flex;gap:5px"><button class="btn light" onclick="editGift(${g.id})">EDIT</button><button class="btn ${g.active?'light':''}" onclick="toggleGift(${g.id})">${g.active?'HIDE':'SHOW'}</button></span></div>`).join('');
const fanGifts=document.getElementById('fanGifts');if(fanGifts)fanGifts.innerHTML=s.giftCatalog.filter(g=>g.active).map(g=>`<div class="gift" onclick="gift(${g.price},'${g.name}')">${g.emoji}<b>${money(g.price)}</b><span class="muted">${g.name}</span></div>`).join('');
const rechargeBox=document.getElementById('recharge');if(rechargeBox)rechargeBox.innerHTML=[500,1000,1500,2000,3000,5000,10000].map(v=>`<div class="gift" onclick="recharge(${v})">💳<b>${money(v)}</b><span class="muted">Recharge</span></div>`).join('');
const adminLedger=document.getElementById('adminLedger');if(adminLedger)adminLedger.innerHTML=s.tx.length?s.tx.slice().reverse().map(x=>`<div class="row" style="padding:9px 0;border-bottom:1px solid #eee"><span>${x.d}</span><b>${money(x.a)}</b></div>`).join(''):'No transactions yet.';
renderDraftPosts();renderSavedPosts();const postList=document.getElementById('postList');let publishedPosts=(s.posts||[]).filter(p=>p.status!=='draft');if(postList)postList.innerHTML=publishedPosts.length?publishedPosts.slice().reverse().map(p=>`<div style="padding:11px 0;border-bottom:1px solid #eee"><div class="row"><b>${p.title}</b><b>${p.access==='subscription'?'⭐ Subscription':money(p.price)}</b></div><div class="muted" style="margin-top:5px">${p.text||''}</div>${p.media?.length?`<div class="muted" style="margin-top:6px">📎 ${p.media.length} media file(s): ${p.media.map(m=>m.name).join(', ')}</div>`:''}<div style="margin-top:8px"><button class="btn light" onclick="editPost(${p.id})">EDIT</button> <button class="btn light" onclick="deletePost(${p.id})">DELETE</button></div></div>`).join(''):'No paid posts yet.';
const fanPostList=document.getElementById('fanPostList');if(fanPostList){
  const sub=s.subscription&&s.subscription.expiresAt>Date.now()?s.subscription:null;
  const visibleFanPosts=s.posts.filter(p=>fanPostFilter==='all'||(fanPostFilter==='subscription'&&p.access==='subscription')||(fanPostFilter==='paid'&&p.access!=='subscription'));
  fanPostList.innerHTML=visibleFanPosts.length?visibleFanPosts.slice().reverse().map(p=>{
    const plan=p.access==='subscription'?s.plans.find(q=>q.id===p.planId):null;
    const autoSub=!!(p.access==='subscription'&&sub&&plan&&sub.name===plan.name);
    const open=!!(p.unlocked||autoSub);
    if(autoSub&&!p.unlocked)p.unlocked=true;
    const heading=p.access==='subscription'?(plan?plan.name+' Subscription':'Subscription'):money(p.price);
    const body=open?(p.text||''):'🔒 Exclusive content — unlock to view.';
    const media=open&&p.media?.length?`<div style="margin:8px 0">${p.media.map(m=>m.url?(m.type||'').startsWith('video/')?`<video src="${m.url}" controls style="max-width:100%;max-height:300px;border-radius:12px;display:block;margin:6px 0"></video>`:`<img src="${m.url}" alt="" style="max-width:100%;max-height:300px;border-radius:12px;display:block;margin:6px 0">`:'').join('')}</div><div class="muted">📎 ${p.media.length} photo/video file(s)</div>`:p.media?.length?`<div style="margin:8px 0;padding:18px;border-radius:12px;background:#ddd;filter:blur(${p.blur||12}px);text-align:center;font-size:28px">📸 🎥</div><div class="muted">🔒 ${p.media.length} locked photo/video file(s)</div>`:'';
    const action=open?'<span class="pill">✓ Unlocked</span>':`<button class="btn full" onclick="unlockPost(${p.id})">${p.access==='subscription'?'⭐ Subscribe to '+(plan?.name||'this plan'):'Unlock Post'}</button>`;
    return `<div class="card" style="padding:12px;margin:8px 0"><div class="row"><b>${p.title}</b><b>${p.access==='subscription'?'⭐ Subscription':money(p.price)}</b></div><p class="muted">${body}</p>${media}${action}</div>`;
  }).join(''):(fanPostFilter==='subscription'?'No subscription posts available.':fanPostFilter==='paid'?'No paid posts available.':'No posts available.');
}
}
render();


function refreshSubscriptionStatuses(){
  subscriptionIntegrityPass();
  if(!Array.isArray(s.subscriptions))return false;
  let changed=false, now=Date.now();
  s.subscriptions.forEach(x=>{
    if(!x)return;
    if(x.expiresAt && new Date(x.expiresAt).getTime()<=now && x.active!==false){
      x.active=false; x.status='expired'; x.expiredAt=new Date().toISOString(); changed=true;
    }
    if(!x.status)x.status=x.active===false?'expired':'active';
  });
  if(changed)save();
  return changed;
}
function getSubscriptionStatus(sub){
  if(!sub)return 'expired';
  if(sub.expiresAt && new Date(sub.expiresAt).getTime()<=Date.now())return 'expired';
  return sub.active===false?'expired':'active';
}








function enforceRoleVisibility(){
  const mode=String(s.mode||document.body.getAttribute('data-mode')||'').toLowerCase();
  const fan=mode==='fan';
  const fanOnlyIds=['fanWalletRechargeHistoryCard','mySubscriptionsCard'];
  fanOnlyIds.forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.setProperty('display',fan?'block':'none','important');
  });
  const adminCreatorOnlyIds=['subscriptionAnalyticsCard','subscriptionTransactionsCard',
    'subscriptionControlsCard','subscriptionPreferencesCard','creatorSubscriberToolsCard'];
  adminCreatorOnlyIds.forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.setProperty('display',(!fan && (mode==='admin'||mode==='creator'))?'block':'none','important');
  });
}




function ensureStep178to195(){
  if(!s.uiFinal)s.uiFinal={};
  if(!Array.isArray(s.chatMessages))s.chatMessages=[];
  if(!Array.isArray(s.notifications))s.notifications=[];
  if(!Array.isArray(s.subscriptions))s.subscriptions=[];
  if(!Array.isArray(s.tx))s.tx=[];
}
function currentRole178(){
  return String(s.mode||document.body.getAttribute('data-mode')||'').toLowerCase();
}
function toggleStep178to195(){
  const p=document.getElementById('step178to195Panel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderStep178to195();
}
function renderStep178to195(){
  ensureStep178to195();
  const el=document.getElementById('step178to195Body');if(!el)return;
  const role=currentRole178();
  const recharge=role==='fan'&&typeof getLastFiveWalletRecharges==='function'?getLastFiveWalletRecharges().length:0;
  const unread=s.notifications.filter(n=>n&&!n.read).length;
  el.innerHTML=`<div class="row"><b>Current role</b><span class="pill">${role||'unknown'}</span></div>
  <div class="row" style="margin-top:8px"><b>Fan recharge rows</b><span class="pill">${recharge}</span></div>
  <div class="row" style="margin-top:8px"><b>Unread notifications</b><span class="pill">${unread}</span></div>
  <button class="btn light full" style="margin-top:12px" onclick="runStep178to195Check()">Run pre-final check</button>`;
}
function strictFanHistoryVisibility178(){
  const fan=currentRole178()==='fan';
  const el=document.getElementById('fanWalletRechargeHistoryCard');
  if(el)el.style.setProperty('display',fan?'block':'none','important');
  document.querySelectorAll('[id*="payout" i],[class*="payout" i]').forEach(x=>{
    if(fan)x.style.setProperty('display','none','important');
  });
  if(fan){
    document.querySelectorAll('[id*="totalspent" i],[id*="total-spent" i],[class*="totalspent" i]')
      .forEach(x=>x.style.setProperty('display','none','important'));
  }
}
function getOnlyFiveRechargeRows178(){
  if(currentRole178()!=='fan')return [];
  return typeof getLastFiveWalletRecharges==='function'?getLastFiveWalletRecharges().slice(0,5):[];
}
function validateRechargeRows178(){
  const rows=getOnlyFiveRechargeRows178();
  return rows.length<=5;
}
function validateNoFanPayout178(){
  if(currentRole178()!=='fan')return true;
  const text=document.body?document.body.innerText.toLowerCase():'';
  return !/\bpayout\b/.test(text);
}
function validateNoFanTotalSpent178(){
  if(currentRole178()!=='fan')return true;
  const text=document.body?document.body.innerText.toLowerCase():'';
  return !text.includes('total spent');
}
function validateChatMessageShape178(){
  ensureStep178to195();
  s.chatMessages=s.chatMessages.filter(m=>m&&m.id!=null);
  s.chatMessages.forEach(m=>{
    if(!m.type)m.type='text';
    if(m.type==='text')m.text=typeof sanitizeChatText==='function'?sanitizeChatText(m.text):String(m.text||'');
  });
  save();return true;
}
function validateNotificationShape178(){
  ensureStep178to195();
  s.notifications=s.notifications.filter(n=>n&&n.id!=null);
  save();return true;
}
function validateSubscriptionShape178(){
  ensureStep178to195();
  s.subscriptions=s.subscriptions.filter(x=>x&&x.id!=null);
  save();return true;
}
function validateWalletShape178(){
  ensureStep178to195();
  s.tx=s.tx.filter(x=>x&&x.ts!=null);
  if(typeof normalizeWalletBalance==='function')normalizeWalletBalance();
  save();return true;
}
function runStep178to195Check(){
  ensureStep178to195();
  validateChatMessageShape178();
  validateNotificationShape178();
  validateSubscriptionShape178();
  validateWalletShape178();
  strictFanHistoryVisibility178();
  validateRechargeRows178();
  validateNoFanPayout178();
  validateNoFanTotalSpent178();
  if(typeof subscriptionIntegrityPass==='function')subscriptionIntegrityPass();
  if(typeof validateChatState==='function')validateChatState();
  if(typeof enforceRoleVisibility==='function')enforceRoleVisibility();
  save();renderStep178to195();
  alert('✅ Pre-final verification completed.');
}

function ensureStep148to177(){
  if(!s.profileSettings)s.profileSettings={showOnline:true};
  if(!s.securitySettings)s.securitySettings={sessionNotice:true};
  if(!s.chatMessages) s.chatMessages=[];
  if(!s.notifications) s.notifications=[];
  if(!s.subscriptions) s.subscriptions=[];
}
function toggleStep148to177(){
  const p=document.getElementById('step148to177Panel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderStep148to177();
}
function renderStep148to177(){
  ensureStep148to177();
  const el=document.getElementById('step148to177Body');if(!el)return;
  const unread=s.notifications.filter(n=>n&&!n.read).length;
  const chats=s.chatMessages.filter(m=>m&&m.sender!=='creator'&&!m.readByCreator).length;
  el.innerHTML=`<div class="row"><b>Unread notifications</b><span class="pill">${unread}</span></div>
  <div class="row" style="margin-top:8px"><b>Unread chats</b><span class="pill">${chats}</span></div>
  <div class="row" style="margin-top:8px"><b>Wallet balance</b><span class="pill">${typeof s.balance==='number'?s.balance:0}</span></div>
  <button class="btn light full" style="margin-top:12px" onclick="runStep148to177Check()">Run hardening check</button>`;
}
function setProfileVisibility(key,value){
  ensureStep148to177();s.profileSettings[key]=!!value;save();
}
function setSecurityPreference(key,value){
  ensureStep148to177();s.securitySettings[key]=!!value;save();
}
function getConversationMessages(chatId){
  ensureStep148to177();
  return s.chatMessages.filter(m=>String(m?.chatId)===String(chatId)).sort((a,b)=>Number(a.createdAt||0)-Number(b.createdAt||0));
}
function countConversationMedia(chatId){
  return getConversationMessages(chatId).filter(m=>m.type&&m.type!=='text').length;
}
function getFavoriteChats(){
  ensureStep148to177();
  return Array.isArray(s.favoriteChats)?s.favoriteChats.slice():[];
}
function getArchivedChats(){
  ensureStep148to177();
  return Array.isArray(s.archivedChats)?s.archivedChats.slice():[];
}
function clearChatSearchState(){
  try{sessionStorage.removeItem('chat_search');}catch(e){}
}
function validateChatReferences(){
  ensureStep148to177();
  const ids=new Set(s.chatMessages.map(m=>String(m?.id)));
  s.reportedChats=(s.reportedChats||[]).filter(r=>ids.has(String(r.messageId)));
  save();return true;
}
function validateNotificationState(){
  ensureStep148to177();
  s.notifications=s.notifications.filter(n=>n&&n.id!=null);
  s.notifications.forEach(n=>{n.read=!!n.read;});
  save();return true;
}
function validateWalletTransactions(){
  if(!Array.isArray(s.tx))s.tx=[];
  s.tx=s.tx.filter(x=>x&&x.ts!=null);
  if(typeof normalizeWalletBalance==='function')normalizeWalletBalance();
  save();return true;
}
function getWalletRechargeHistoryForCurrentRole(){
  const mode=String(s.mode||document.body.getAttribute('data-mode')||'').toLowerCase();
  if(mode!=='fan')return [];
  return typeof getLastFiveWalletRecharges==='function'?getLastFiveWalletRecharges():[];
}
function hideFinancialLeakage(){
  const mode=String(s.mode||document.body.getAttribute('data-mode')||'').toLowerCase();
  if(mode!=='fan')return;
  document.querySelectorAll('[id*="payout" i],[class*="payout" i],[id*="totalspent" i],[id*="total-spent" i],[class*="totalspent" i]')
    .forEach(el=>el.style.setProperty('display','none','important'));
}
function validateSubscriptionRecords(){
  ensureStep148to177();
  s.subscriptions=s.subscriptions.filter(x=>x&&x.id!=null);
  save();return true;
}
function getCurrentRole(){
  return String(s.mode||document.body.getAttribute('data-mode')||'').toLowerCase();
}
function isFanRole(){return getCurrentRole()==='fan';}
function isCreatorRole(){return getCurrentRole()==='creator';}
function isAdminRole(){return getCurrentRole()==='admin';}
function ensureFanRechargeCardOnly(){
  const el=document.getElementById('fanWalletRechargeHistoryCard');
  if(el)el.style.setProperty('display',isFanRole()?'block':'none','important');
}
function accessibilitySafeLabels(){
  document.querySelectorAll('button').forEach(b=>{if(!b.getAttribute('aria-label')&&b.textContent.trim())b.setAttribute('aria-label',b.textContent.trim());});
}
function runStep148to177Check(){
  ensureStep148to177();
  validateChatReferences();
  validateNotificationState();
  validateWalletTransactions();
  validateSubscriptionRecords();
  ensureFanRechargeCardOnly();
  hideFinancialLeakage();
  if(typeof subscriptionIntegrityPass==='function')subscriptionIntegrityPass();
  if(typeof validateChatState==='function')validateChatState();
  if(typeof enforceRoleVisibility==='function')enforceRoleVisibility();
  accessibilitySafeLabels();
  save();renderStep148to177();
  alert('✅ Final-build hardening checks completed.');
}

function ensureStep128to147(){
  if(!s.uiCenter)s.uiCenter={compactNotifications:true};
  if(!Array.isArray(s.notifications))s.notifications=[];
  if(!Array.isArray(s.chatMessages))s.chatMessages=[];
  if(!Array.isArray(s.subscriptions))s.subscriptions=[];
}
function toggleStep128to147(){
  const p=document.getElementById('step128to147Panel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderStep128to147();
}
function renderStep128to147(){
  ensureStep128to147();
  const el=document.getElementById('step128to147Body');if(!el)return;
  const unread=getUnreadNotificationCount?getUnreadNotificationCount():s.notifications.filter(n=>n&&!n.read).length;
  const chats=getTotalUnreadChatCount?getTotalUnreadChatCount():0;
  el.innerHTML=`<div class="row"><b>Unread notifications</b><span class="pill">${unread}</span></div>
  <div class="row" style="margin-top:8px"><b>Unread chats</b><span class="pill">${chats}</span></div>
  <div class="row" style="margin-top:8px"><b>Subscriptions</b><span class="pill">${s.subscriptions.length}</span></div>
  <button class="btn light full" style="margin-top:12px" onclick="runStep128to147Check()">Run UX & privacy check</button>`;
}
function getNotificationCountByType(type){
  ensureStep128to147();
  return s.notifications.filter(n=>String(n?.type||'')===String(type||'')).length;
}
function addUniqueNotification(key,title,message,type){
  ensureStep128to147();
  if(!s._uniqueNotifications)s._uniqueNotifications={};
  if(s._uniqueNotifications[key])return false;
  s._uniqueNotifications[key]=Date.now();
  if(typeof addNotification==='function')addNotification(title,message,type||'general');
  else s.notifications.push({id:Date.now(),title,message,type:type||'general',ts:Date.now(),read:false});
  save();return true;
}
function clearReadNotifications(){
  ensureStep128to147();
  s.notifications=s.notifications.filter(n=>!n||!n.read);save();
}
function getChatIds(){
  ensureStep128to147();
  return [...new Set(s.chatMessages.map(m=>String(m?.chatId||'')).filter(Boolean))];
}
function getChatSummary(chatId){
  const rows=typeof getChatMessagesForChat==='function'?getChatMessagesForChat(chatId):s.chatMessages.filter(m=>String(m?.chatId)===String(chatId));
  const last=rows[rows.length-1];
  return {count:rows.length,unread:rows.filter(m=>m.sender!=='creator'&&!m.readByCreator).length,lastText:last?(safeChatPreview?safeChatPreview(last.text||last.caption||''):''):''};
}
function archiveChat(chatId){
  ensureStep128to147();
  if(!s.archivedChats)s.archivedChats=[];
  const id=String(chatId||'');if(!id)return;
  if(!s.archivedChats.includes(id))s.archivedChats.push(id);
  save();
}
function unarchiveChat(chatId){
  ensureStep128to147();
  if(!Array.isArray(s.archivedChats))return;
  const id=String(chatId||'');s.archivedChats=s.archivedChats.filter(x=>String(x)!==id);save();
}
function isChatArchived(chatId){
  ensureStep128to147();
  return Array.isArray(s.archivedChats)&&s.archivedChats.includes(String(chatId||''));
}
function toggleFavoriteChat(chatId){
  ensureStep128to147();
  if(!s.favoriteChats)s.favoriteChats=[];
  const id=String(chatId||'');if(!id)return;
  s.favoriteChats=s.favoriteChats.includes(id)?s.favoriteChats.filter(x=>x!==id):[...s.favoriteChats,id];save();
}
function isFavoriteChat(chatId){
  ensureStep128to147();
  return Array.isArray(s.favoriteChats)&&s.favoriteChats.includes(String(chatId||''));
}
function getActiveFanSubscriptions(){
  ensureStep128to147();
  return s.subscriptions.filter(x=>typeof getSubscriptionStatus==='function'&&getSubscriptionStatus(x)==='active');
}
function getExpiringSubscriptions(days=3){
  const max=Math.max(1,Number(days)||3);
  return getActiveFanSubscriptions().filter(x=>typeof getSubscriptionDaysLeft==='function'&&getSubscriptionDaysLeft(x)<=max);
}
function getFanRechargeSummary(){
  const rows=typeof getLastFiveWalletRecharges==='function'?getLastFiveWalletRecharges():[];
  return {count:rows.length,last:rows[0]||null};
}
function validateFanFinancialVisibility(){
  if(String(s.mode||document.body.getAttribute('data-mode')||'').toLowerCase()!=='fan')return true;
  if(typeof enforceRoleVisibility==='function')enforceRoleVisibility();
  if(typeof guardFanFinancialUI==='function')guardFanFinancialUI();
  return true;
}
function validateCreatorAdminVisibility(){
  const mode=String(s.mode||document.body.getAttribute('data-mode')||'').toLowerCase();
  if(mode!=='admin'&&mode!=='creator')return true;
  const fanHistory=document.getElementById('fanWalletRechargeHistoryCard');
  if(fanHistory)fanHistory.style.setProperty('display','none','important');
  return true;
}
function runStep128to147Check(){
  ensureStep128to147();
  validateFanFinancialVisibility();
  validateCreatorAdminVisibility();
  if(typeof subscriptionIntegrityPass==='function')subscriptionIntegrityPass();
  if(typeof validateChatState==='function')validateChatState();
  save();renderStep128to147();
  alert('✅ UX, privacy and role checks completed.');
}

function ensureStep108to127(){
  if(!s.uiSettings)s.uiSettings={compactHistory:true};
  if(!Array.isArray(s.notifications))s.notifications=[];
  if(!Array.isArray(s.chatMessages))s.chatMessages=[];
  if(!Array.isArray(s.subscriptions))s.subscriptions=[];
}
function toggleStep108to127(){
  const p=document.getElementById('step108to127Panel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderStep108to127();
}
function renderStep108to127(){
  ensureStep108to127();
  const el=document.getElementById('step108to127Body');if(!el)return;
  const unread=s.chatMessages.filter(m=>m&&m.sender!=='creator'&&!m.readByCreator).length;
  const active=s.subscriptions.filter(x=>typeof getSubscriptionStatus==='function'&&getSubscriptionStatus(x)==='active').length;
  el.innerHTML=`<div class="row"><b>Unread chats</b><span class="pill">${unread}</span></div>
  <div class="row" style="margin-top:8px"><b>Active subscriptions</b><span class="pill">${active}</span></div>
  <div class="row" style="margin-top:8px"><b>Notifications</b><span class="pill">${s.notifications.length}</span></div>
  <button class="btn light full" style="margin-top:12px" onclick="runStep108to127Check()">Run final safeguards check</button>`;
}
function getUnreadNotificationCount(){
  ensureStep108to127();
  return s.notifications.filter(n=>n&&!n.read).length;
}
function markNotificationRead(id){
  ensureStep108to127();
  const n=s.notifications.find(x=>String(x.id)===String(id));if(!n)return;
  n.read=true;save();
}
function removeOldNotifications(days){
  ensureStep108to127();
  const cutoff=Date.now()-Math.max(1,Number(days)||30)*86400000;
  s.notifications=s.notifications.filter(n=>!n.ts||Number(n.ts)>=cutoff);save();
}
function getRecentNotifications(limit=10){
  ensureStep108to127();
  return s.notifications.slice().sort((a,b)=>Number(b.ts||0)-Number(a.ts||0)).slice(0,Math.max(1,Number(limit)||10));
}
function getFanRechargeOnlyHistory(){
  if(typeof getLastFiveWalletRecharges==='function')return getLastFiveWalletRecharges();
  return [];
}
function fanCanSeeFinancialHistory(){
  return String(s.mode||'').toLowerCase()==='fan' && getFanRechargeOnlyHistory().length>=0;
}
function guardFanFinancialUI(){
  const fan=String(s.mode||'').toLowerCase()==='fan';
  document.querySelectorAll('[id*="payout" i],[class*="payout" i]').forEach(el=>{
    if(fan)el.style.setProperty('display','none','important');
  });
  if(fan){
    document.querySelectorAll('[id*="totalspent" i],[id*="total-spent" i],[class*="totalspent" i]').forEach(el=>el.style.setProperty('display','none','important'));
  }
}
function safeChatPreview(text){
  if(typeof sanitizeChatText==='function')return sanitizeChatText(text).slice(0,120);
  return String(text||'').replace(/<[^>]*>/g,'').slice(0,120);
}
function getPinnedMessages(chatId){
  ensureStep108to127();
  return s.chatMessages.filter(m=>String(m.chatId)===String(chatId)&&m.pinned);
}
function getMediaMessages(chatId){
  ensureStep108to127();
  return s.chatMessages.filter(m=>String(m.chatId)===String(chatId)&&m.type&&m.type!=='text');
}
function getSubscriptionDaysLeft(sub){
  if(!sub||!sub.expiresAt)return 0;
  return Math.max(0,Math.ceil((new Date(sub.expiresAt).getTime()-Date.now())/86400000));
}
function getSubscriptionBadge(sub){
  if(typeof getSubscriptionStatus==='function'){
    const st=getSubscriptionStatus(sub);
    return st==='active'?'Active':st==='cancelled'?'Cancelled':'Expired';
  }
  return 'Unknown';
}
function preventDuplicateRechargeReference(ref){
  const r=String(ref||'').trim();if(!r)return false;
  const tx=Array.isArray(s.tx)?s.tx:[];
  return !tx.some(x=>String(x?.reference||'')===r);
}
function addRechargeReference(reference){
  const r=String(reference||'').trim();
  return !!r && preventDuplicateRechargeReference(r);
}
function normalizeWalletBalance(){
  const n=Number(s.balance);
  s.balance=Number.isFinite(n)?Math.max(0,n):0;save();
}
function normalizeSubscriptionPrices(){
  if(!Array.isArray(s.subscriptionPlans))s.subscriptionPlans=[];
  s.subscriptionPlans.forEach(p=>{p.price=Math.max(0,Number(p.price)||0);});
  save();
}
function runStep108to127Check(){
  ensureStep108to127();
  normalizeWalletBalance();
  normalizeSubscriptionPrices();
  if(typeof subscriptionIntegrityPass==='function')subscriptionIntegrityPass();
  if(typeof validateChatState==='function')validateChatState();
  if(typeof guardFanFinancialUI==='function')guardFanFinancialUI();
  save();
  renderStep108to127();
  alert('✅ Final safeguards check completed.');
}

function ensureStep88to107(){
  if(!s.walletSettings)s.walletSettings={rechargeNotifications:true};
  if(!Array.isArray(s.rechargeMethods))s.rechargeMethods=[];
  if(!Array.isArray(s.chatMessages))s.chatMessages=[];
  if(!Array.isArray(s.chatAudit))s.chatAudit=[];
}
function toggleStep88to107(){
  const p=document.getElementById('step88to107Panel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderStep88to107();
}
function renderStep88to107(){
  ensureStep88to107();
  const el=document.getElementById('step88to107Body');if(!el)return;
  const rechargeCount=(s.tx||[]).filter(x=>String(x.type||'').toLowerCase().includes('recharge')).length;
  const unread=getTotalUnreadChatCount();
  el.innerHTML=`<div class="row"><b>Recharge records</b><span class="pill">${rechargeCount}</span></div>
  <div class="row" style="margin-top:8px"><b>Unread chats</b><span class="pill">${unread}</span></div>
  <div class="row" style="margin-top:8px"><b>Chat media enabled</b><span class="pill">${s.chatSettings?.mediaEnabled===false?'Off':'On'}</span></div>
  <button class="btn light full" style="margin-top:12px" onclick="runFinalWalletChatCheck()">Run final check</button>`;
}
function getTotalUnreadChatCount(){
  ensureStep88to107();
  return s.chatMessages.filter(m=>m&&m.sender!=='creator'&&!m.readByCreator).length;
}
function getLastFiveWalletRecharges(){
  const tx=Array.isArray(s.tx)?s.tx:[];
  return tx.filter(x=>{
    const t=String(x?.type||'').toLowerCase(), d=String(x?.d||x?.description||'').toLowerCase();
    return ['wallet-recharge','wallet_recharge','recharge','wallet-topup','wallet_topup'].includes(t)
      || d.includes('wallet recharge') || d.includes('wallet top up') || d.includes('wallet top-up');
  }).sort((a,b)=>Number(b.ts||0)-Number(a.ts||0)).slice(0,5);
}
function addRechargeRecord(amount,method){
  const n=Math.max(0,Number(amount)||0);if(!n)return false;
  if(!Array.isArray(s.tx))s.tx=[];
  s.tx.push({d:'Wallet Recharge',a:n,ts:Date.now(),type:'wallet-recharge',method:method||'Wallet'});
  s.balance=Number(s.balance||0)+n;save();return true;
}
function setRechargeNotificationPreference(v){
  ensureStep88to107();s.walletSettings.rechargeNotifications=!!v;save();
}
function getChatMessagesForChat(chatId){
  ensureStep88to107();
  return s.chatMessages.filter(m=>String(m.chatId)===String(chatId)).sort((a,b)=>Number(a.createdAt||0)-Number(b.createdAt||0));
}
function deleteOwnChatMessage(messageId){
  ensureStep88to107();
  const i=s.chatMessages.findIndex(m=>String(m.id)===String(messageId)&&m.sender==='fan');
  if(i<0)return false;
  s.chatMessages.splice(i,1);save();return true;
}
function pinChatMessage(messageId){
  ensureStep88to107();
  const m=s.chatMessages.find(x=>String(x.id)===String(messageId));if(!m)return;
  m.pinned=true;save();addChatAudit('Message pinned',String(messageId));save();
}
function unpinChatMessage(messageId){
  ensureStep88to107();
  const m=s.chatMessages.find(x=>String(x.id)===String(messageId));if(!m)return;
  m.pinned=false;save();addChatAudit('Message unpinned',String(messageId));save();
}
function sanitizeChatText(text){
  return String(text||'').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,'').trim().slice(0,4000);
}
function canSendToFan(fanId){
  ensureStep88to107();
  return !s.blockedFans.some(x=>String(x)===String(fanId));
}
function createChatMessage(chatId,sender,text){
  ensureStep88to107();
  const clean=sanitizeChatText(text);if(!clean)return null;
  const msg={id:Date.now(),chatId:chatId||'',sender:sender||'fan',type:'text',text:clean,createdAt:Date.now(),readByCreator:sender==='creator'};
  s.chatMessages.push(msg);save();return msg;
}
function getActiveSubscriptionForFan(planId){
  if(!Array.isArray(s.subscriptions))return null;
  return s.subscriptions.find(x=>String(x.planId)===String(planId)&&getSubscriptionStatus(x)==='active')||null;
}
function isPlanAvailableForFan(planId){
  const p=(s.subscriptionPlans||[]).find(x=>String(x.id)===String(planId));
  return !!p && p.active!==false;
}
function isOfferCurrentlyValid(offer){
  if(!offer||offer.active===false)return false;
  return !offer.expiresAt || new Date(offer.expiresAt).getTime()>Date.now();
}
function getValidOffersForPlan(planId){
  return (s.subscriptionOffers||[]).filter(o=>String(o.planId)===String(planId)&&isOfferCurrentlyValid(o));
}
function runFinalWalletChatCheck(){
  ensureStep88to107();
  subscriptionIntegrityPass?.();
  validateChatState?.();
  getLastFiveWalletRecharges();
  save();alert('✅ Wallet, chat and subscription checks completed.');
}

function ensureChatUpgradeState(){
  if(!s.chatSettings)s.chatSettings={fanCanMessage:true,mediaEnabled:true,autoReply:false};
  if(!Array.isArray(s.chatMessages))s.chatMessages=[];
  if(!Array.isArray(s.blockedFans))s.blockedFans=[];
  if(!Array.isArray(s.reportedChats))s.reportedChats=[];
  if(!Array.isArray(s.chatAudit))s.chatAudit=[];
}
function addChatAudit(action,details){
  ensureChatUpgradeState();
  s.chatAudit.push({id:Date.now(),action,details:details||'',ts:new Date().toISOString()});
  if(s.chatAudit.length>500)s.chatAudit=s.chatAudit.slice(-500);
}
function toggleCreatorChatCenter(){
  const p=document.getElementById('creatorChatUpgradePanel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderCreatorChatCenter();
}
function renderCreatorChatCenter(){
  ensureChatUpgradeState();
  const el=document.getElementById('creatorChatUpgradeBody');if(!el)return;
  const total=s.chatMessages.length;
  const media=s.chatMessages.filter(m=>m&&m.type&&m.type!=='text').length;
  const blocked=s.blockedFans.length;
  el.innerHTML=`<div class="row"><b>Total messages</b><span class="pill">${total}</span></div>
  <div class="row" style="margin-top:8px"><b>Media messages</b><span class="pill">${media}</span></div>
  <div class="row" style="margin-top:8px"><b>Blocked fans</b><span class="pill">${blocked}</span></div>
  <button class="btn light full" style="margin-top:12px" onclick="clearChatDrafts()">Clear local drafts</button>`;
}
function toggleChatPrivacy(){
  const p=document.getElementById('chatPrivacyPanel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderChatPrivacy();
}
function renderChatPrivacy(){
  ensureChatUpgradeState();
  const el=document.getElementById('chatPrivacyBody');if(!el)return;
  el.innerHTML=`<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" ${s.chatSettings.fanCanMessage?'checked':''} onchange="setChatSetting('fanCanMessage',this.checked)"> Allow fans to start chats</label>
  <label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" ${s.chatSettings.mediaEnabled?'checked':''} onchange="setChatSetting('mediaEnabled',this.checked)"> Enable media in chat</label>
  <label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" ${s.chatSettings.autoReply?'checked':''} onchange="setChatSetting('autoReply',this.checked)"> Enable auto-reply</label>`;
}
function setChatSetting(key,value){
  ensureChatUpgradeState();s.chatSettings[key]=!!value;save();addChatAudit('Chat setting changed',key+': '+!!value);save();
}
function clearChatDrafts(){
  try{localStorage.removeItem('creatorchat_drafts');}catch(e){}
  alert('✅ Local chat drafts cleared.');
}
function sendCreatorMediaMessage(chatId,type,src,caption){
  ensureChatUpgradeState();
  if(!s.chatSettings.mediaEnabled)return;
  const allowed=['image','audio','video'];
  if(!allowed.includes(type))return;
  const msg={id:Date.now(),chatId:chatId||'',sender:'creator',type,src:src||'',caption:caption||'',createdAt:new Date().toISOString()};
  s.chatMessages.push(msg);save();addChatAudit('Media message sent',type);save();
}
function blockFanFromChat(fanId){
  ensureChatUpgradeState();
  const id=String(fanId||'');if(!id)return;
  if(!s.blockedFans.some(x=>String(x)===id))s.blockedFans.push(id);
  addChatAudit('Fan blocked',id);save();
}
function unblockFanFromChat(fanId){
  ensureChatUpgradeState();
  const id=String(fanId||'');s.blockedFans=s.blockedFans.filter(x=>String(x)!==id);
  addChatAudit('Fan unblocked',id);save();
}
function reportChatMessage(messageId,reason){
  ensureChatUpgradeState();
  s.reportedChats.push({messageId,reason:reason||'Reported',ts:new Date().toISOString(),status:'open'});
  addChatAudit('Chat message reported',String(messageId));save();
}
function muteChatNotifications(minutes){
  ensureChatUpgradeState();
  const mins=Math.max(0,Number(minutes)||0);
  s.chatSettings.mutedUntil=mins?Date.now()+mins*60000:0;save();
}
function chatNotificationsMuted(){
  ensureChatUpgradeState();
  return Number(s.chatSettings.mutedUntil||0)>Date.now();
}
function addChatReaction(messageId,reaction){
  ensureChatUpgradeState();
  const m=s.chatMessages.find(x=>String(x.id)===String(messageId));if(!m)return;
  m.reactions=Array.isArray(m.reactions)?m.reactions:[];
  m.reactions.push({reaction:String(reaction||'👍'),ts:new Date().toISOString()});
  save();
}
function markChatRead(chatId){
  ensureChatUpgradeState();
  s.chatMessages.forEach(m=>{if(String(m.chatId)===String(chatId))m.readByCreator=true;});
  save();
}
function searchChatMessages(query){
  ensureChatUpgradeState();
  const q=String(query||'').toLowerCase().trim();
  if(!q)return s.chatMessages.slice();
  return s.chatMessages.filter(m=>String(m.text||m.caption||'').toLowerCase().includes(q));
}
function getUnreadChatCount(chatId){
  ensureChatUpgradeState();
  return s.chatMessages.filter(m=>String(m.chatId)===String(chatId)&&!m.readByCreator&&m.sender!=='creator').length;
}
function exportChatAudit(){
  ensureChatUpgradeState();
  const blob=new Blob([JSON.stringify(s.chatAudit,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='chat-audit.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function validateChatState(){
  ensureChatUpgradeState();
  s.chatMessages=s.chatMessages.filter(m=>m&&m.id!=null);
  s.blockedFans=[...new Set(s.blockedFans.map(String))];
  s.reportedChats=s.reportedChats.filter(r=>r&&r.messageId!=null);
  save();addChatAudit('Chat integrity check','Chat state validated');save();
  return true;
}

function subscriptionIntegrityPass(){
  if(!Array.isArray(s.subscriptionPlans))s.subscriptionPlans=[];
  if(!Array.isArray(s.subscriptionOffers))s.subscriptionOffers=[];
  if(!Array.isArray(s.subscriptions))s.subscriptions=[];
  if(!Array.isArray(s.tx))s.tx=[];
  if(!Array.isArray(s.subscriptionAudit))s.subscriptionAudit=[];
  if(!s.subscriptionSettings)s.subscriptionSettings={expiryReminders:true,renewalReminders:true};
  let changed=false, now=Date.now();

  s.subscriptionPlans=s.subscriptionPlans.filter(p=>p&&p.id!=null).map(p=>{
    if(p.price!=null)p.price=Math.max(0,Number(p.price)||0);
    if(p.active===undefined)p.active=true;
    return p;
  });

  s.subscriptionOffers=s.subscriptionOffers.filter(o=>o&&o.planId!=null).map(o=>{
    if(o.discount!=null)o.discount=Math.min(90,Math.max(1,Number(o.discount)||1));
    if(o.expiresAt && new Date(o.expiresAt).getTime()<now)o.active=false;
    if(o.active===undefined)o.active=true;
    return o;
  });

  s.subscriptions=s.subscriptions.filter(x=>x&&x.id!=null&&x.planId!=null).map(x=>{
    if(x.expiresAt && new Date(x.expiresAt).getTime()<=now && x.active!==false){
      x.active=false;x.status='expired';x.expiredAt=x.expiredAt||new Date().toISOString();changed=true;
    }
    if(!x.status)x.status=x.active===false?'expired':'active';
    return x;
  });
  if(changed)save();
}
function addSubscriptionAudit(action,details){
  if(!Array.isArray(s.subscriptionAudit))s.subscriptionAudit=[];
  s.subscriptionAudit.push({id:Date.now(),action,details:details||'',ts:new Date().toISOString()});
  if(s.subscriptionAudit.length>500)s.subscriptionAudit=s.subscriptionAudit.slice(-500);
}
function getSubscriptionGraceStatus(sub){
  if(!sub)return 'expired';
  if(sub.active!==false && sub.expiresAt){
    const diff=new Date(sub.expiresAt).getTime()-Date.now();
    if(diff<=0 && diff>-3*86400000)return 'grace';
  }
  return getSubscriptionStatus(sub);
}
function getPlanSubscriberCount(planId){
  subscriptionIntegrityPass();
  return s.subscriptions.filter(x=>String(x.planId)===String(planId)&&getSubscriptionStatus(x)==='active').length;
}
function getCreatorSubscriberCount(){
  const ids=new Set(s.subscriptionPlans.map(p=>String(p.id)));
  return s.subscriptions.filter(x=>ids.has(String(x.planId))&&getSubscriptionStatus(x)==='active').length;
}
function toggleAdvancedSubscriptionTools(){
  const p=document.getElementById('advancedSubscriptionToolsPanel');if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderAdvancedSubscriptionTools();
}
function renderAdvancedSubscriptionTools(){
  subscriptionIntegrityPass();
  const el=document.getElementById('advancedSubscriptionToolsBody');if(!el)return;
  const activeSubs=s.subscriptions.filter(x=>getSubscriptionStatus(x)==='active').length;
  const graceSubs=s.subscriptions.filter(x=>getSubscriptionGraceStatus(x)==='grace').length;
  const activePlans=s.subscriptionPlans.filter(p=>p.active!==false).length;
  const activeOffers=s.subscriptionOffers.filter(o=>o.active!==false&&(!o.expiresAt||new Date(o.expiresAt)>=new Date())).length;
  const recurring=s.subscriptions.filter(x=>getSubscriptionStatus(x)==='active').reduce((n,x)=>n+Number(x.price||0),0);
  el.innerHTML=`
    <div class="row"><b>Active subscribers</b><span class="pill">${activeSubs}</span></div>
    <div class="row" style="margin-top:8px"><b>Grace-period subscriptions</b><span class="pill">${graceSubs}</span></div>
    <div class="row" style="margin-top:8px"><b>Active plans</b><span class="pill">${activePlans}</span></div>
    <div class="row" style="margin-top:8px"><b>Active offers</b><span class="pill">${activeOffers}</span></div>
    <div class="row" style="margin-top:8px"><b>Estimated active subscription value</b><b>${money(recurring)}</b></div>
    <button class="btn light full" style="margin-top:12px" onclick="runSubscriptionIntegrityCheck()">Run Integrity Check</button>`;
}
function runSubscriptionIntegrityCheck(){
  subscriptionIntegrityPass();
  addSubscriptionAudit('Integrity check','Subscription data validated and statuses refreshed');
  save();
  renderAdvancedSubscriptionTools();
  alert('✅ Subscription integrity check complete.');
}
function setOfferActive(offerId,active){
  if(!(s.mode==='admin'||s.mode==='creator'))return;
  subscriptionIntegrityPass();
  const o=s.subscriptionOffers.find(x=>String(x.id)===String(offerId));if(!o)return;
  o.active=!!active;addSubscriptionAudit(active?'Offer activated':'Offer paused',o.title||'Offer');save();
  if(typeof renderCreatorOffers==='function')renderCreatorOffers();
}
function cleanupExpiredOffers(){
  subscriptionIntegrityPass();
  s.subscriptionOffers=s.subscriptionOffers.filter(o=>!o.expiresAt||new Date(o.expiresAt)>=new Date());
  save();
  if(typeof renderCreatorOffers==='function')renderCreatorOffers();
}
function filterSubscribersByStatus(status){
  subscriptionIntegrityPass();
  return s.subscriptions.filter(x=>{
    const st=getSubscriptionStatus(x);
    return status==='all'||st===status;
  });
}
function sortPlansByPrice(desc=false){
  subscriptionIntegrityPass();
  s.subscriptionPlans.sort((a,b)=>desc?Number(b.price||0)-Number(a.price||0):Number(a.price||0)-Number(b.price||0));
  save();
}
function markRenewalFailed(subId,reason){
  const x=s.subscriptions.find(z=>String(z.id)===String(subId));if(!x)return;
  x.renewalStatus='failed';x.renewalFailureReason=reason||'Wallet payment failed';x.renewalFailedAt=new Date().toISOString();
  addSubscriptionAudit('Renewal failed',reason||'Wallet payment failed');save();
}
function recordSubscriptionRefund(subId,amount,reason){
  const x=s.subscriptions.find(z=>String(z.id)===String(subId));if(!x)return;
  x.refund={amount:Number(amount)||0,reason:reason||'',refundedAt:new Date().toISOString()};
  s.tx.push({d:'Subscription refund · '+(reason||'Refund'),a:Number(amount)||0,ts:Date.now(),type:'subscription-refund'});
  addSubscriptionAudit('Refund recorded',reason||'Subscription refund');save();
}
function cancelSubscriptionWithAudit(subId,reason){
  const x=s.subscriptions.find(z=>String(z.id)===String(subId));if(!x)return;
  x.active=false;x.status='cancelled';x.cancelledAt=new Date().toISOString();x.cancelReason=reason||'Cancelled by subscriber';
  addSubscriptionAudit('Subscription cancelled',reason||'Cancelled by subscriber');save();
  if(typeof renderMySubscriptions==='function')renderMySubscriptions();
}
function subscriptionNotificationOnce(key,title,message){
  if(!s._subscriptionNotifications)s._subscriptionNotifications={};
  if(s._subscriptionNotifications[key])return false;
  s._subscriptionNotifications[key]=Date.now();save();
  if(typeof addNotification==='function')addNotification(title,message,'subscription');
  return true;
}

function ensureSubscriptionSettings(){
  if(!s.subscriptionSettings)s.subscriptionSettings={expiryReminders:true,renewalReminders:true};
  if(!Array.isArray(s.subscriptions))s.subscriptions=[];
  if(!Array.isArray(s.subscriptionPlans))s.subscriptionPlans=[];
  if(!Array.isArray(s.subscriptionOffers))s.subscriptionOffers=[];
}
function toggleSubscriptionControls(){
  const p=document.getElementById('subscriptionControlsPanel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderSubscriptionControls();
}
function renderSubscriptionControls(){
  ensureSubscriptionSettings();
  const el=document.getElementById('subscriptionControlsList');if(!el)return;
  const plans=s.subscriptionPlans;
  el.innerHTML=plans.length?plans.map(p=>`<div style="padding:10px 0;border-bottom:1px solid #eee">
    <div class="row"><b>${p.name||'Subscription'}</b><span class="pill">${p.active===false?'Paused':'Active'}</span></div>
    <button class="btn light" style="margin-top:8px" onclick="toggleSubscriptionPlan(${p.id})">${p.active===false?'Activate':'Pause Plan'}</button>
  </div>`).join(''):'<div class="muted">No plans created yet.</div>';
}
function toggleSubscriptionPlan(planId){
  if(!(s.mode==='admin'||s.mode==='creator'))return;
  const p=s.subscriptionPlans.find(x=>String(x.id)===String(planId));if(!p)return;
  p.active=p.active===false;
  save();renderSubscriptionControls();
  if(typeof addAdminAudit==='function')addAdminAudit(p.active?'Subscription plan activated':'Subscription plan paused',p.name||'Subscription');
}
function cancelSubscription(subId){
  ensureSubscriptionSettings();
  const x=s.subscriptions.find(z=>String(z.id)===String(subId));if(!x)return;
  x.active=false;x.status='cancelled';x.cancelledAt=new Date().toISOString();
  save();
  if(typeof addNotification==='function')addNotification('Subscription cancelled','Your subscription has been cancelled.','subscription');
  renderMySubscriptions();renderSubscriptionRenewals();
}
function toggleSubscriptionPreferences(){
  const p=document.getElementById('subscriptionPreferencesPanel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderSubscriptionPreferences();
}
function renderSubscriptionPreferences(){
  ensureSubscriptionSettings();
  const el=document.getElementById('subscriptionPreferencesBody');if(!el)return;
  el.innerHTML=`<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" ${s.subscriptionSettings.expiryReminders?'checked':''} onchange="setSubscriptionPreference('expiryReminders',this.checked)"> Expiry reminders</label>
  <label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" ${s.subscriptionSettings.renewalReminders?'checked':''} onchange="setSubscriptionPreference('renewalReminders',this.checked)"> Renewal reminders</label>`;
}
function setSubscriptionPreference(key,value){
  ensureSubscriptionSettings();s.subscriptionSettings[key]=!!value;save();
}
function toggleSubscriberTools(){
  const p=document.getElementById('creatorSubscriberToolsPanel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open){renderSubscriberTools();document.getElementById('subscriberSearch')?.addEventListener('input',renderSubscriberTools);}
}
function renderSubscriberTools(){
  if(!(s.mode==='admin'||s.mode==='creator'))return;
  ensureSubscriptionSettings();
  const el=document.getElementById('subscriberToolsList');if(!el)return;
  const q=(document.getElementById('subscriberSearch')?.value||'').toLowerCase().trim();
  const plans=s.subscriptionPlans;
  const ownIds=new Set(plans.filter(p=>!p.creatorId||String(p.creatorId)===String(s.creatorId||s.activeCreatorId||s.currentCreatorId||'default')).map(p=>String(p.id)));
  const rows=s.subscriptions.filter(x=>ownIds.has(String(x.planId))).filter(x=>{
    const p=plans.find(z=>String(z.id)===String(x.planId));
    return !q || String(p?.name||'').toLowerCase().includes(q) || String(x.userName||x.fanName||x.userEmail||'').toLowerCase().includes(q);
  });
  el.innerHTML=rows.length?rows.map(x=>{
    const p=plans.find(z=>String(z.id)===String(x.planId));
    const status=getSubscriptionStatus(x);
    return `<div style="padding:10px 0;border-bottom:1px solid #eee">
      <div class="row"><b>${x.userName||x.fanName||'Subscriber'}</b><span class="pill">${status}</span></div>
      <div class="muted">${p?.name||'Subscription'} · ${x.userEmail||''}</div>
      <button class="btn light" style="margin-top:7px" onclick="viewSubscriberDetail(${x.id})">Details</button>
    </div>`;
  }).join(''):'<div class="muted">No matching subscribers.</div>';
}
function viewSubscriberDetail(subId){
  const x=(s.subscriptions||[]).find(z=>String(z.id)===String(subId));if(!x)return;
  const p=(s.subscriptionPlans||[]).find(z=>String(z.id)===String(x.planId));
  alert('Subscriber: '+(x.userName||x.fanName||'Subscriber')+'\nPlan: '+(p?.name||'Subscription')+'\nStatus: '+getSubscriptionStatus(x)+'\nStarted: '+(x.startedAt?new Date(x.startedAt).toLocaleDateString():'—')+'\nEnds: '+(x.expiresAt?new Date(x.expiresAt).toLocaleDateString():'—'));
}
function exportSubscriberData(){
  if(!(s.mode==='admin'||s.mode==='creator'))return;
  ensureSubscriptionSettings();
  const plans=s.subscriptionPlans, rows=s.subscriptions.map(x=>{
    const p=plans.find(z=>String(z.id)===String(x.planId));
    return {subscriber:x.userName||x.fanName||'Subscriber',email:x.userEmail||'',plan:p?.name||'',status:getSubscriptionStatus(x),started:x.startedAt||'',expires:x.expiresAt||''};
  });
  const blob=new Blob([JSON.stringify(rows,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='subscriber-data.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),500);
}

function ensureSubscriptionArrays(){
  if(!Array.isArray(s.subscriptions))s.subscriptions=[];
  if(!Array.isArray(s.tx))s.tx=[];
}
function toggleSubscriptionRenewals(){
  const p=document.getElementById('subscriptionRenewalPanel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderSubscriptionRenewals();
}
function renderSubscriptionRenewals(){
  ensureSubscriptionArrays();
  const el=document.getElementById('subscriptionRenewalList');if(!el)return;
  const plans=Array.isArray(s.subscriptionPlans)?s.subscriptionPlans:[];
  const mine=s.subscriptions.filter(x=>x && x.expiresAt);
  el.innerHTML=mine.length?mine.map(x=>{
    const p=plans.find(z=>String(z.id)===String(x.planId));if(!p)return '';
    const active=getSubscriptionStatus(x)==='active';
    const end=new Date(x.expiresAt);
    return `<div style="padding:10px 0;border-bottom:1px solid #eee"><div class="row"><b>${p.name||'Subscription'}</b><span class="pill">${active?'Active':'Expired'}</span></div><div class="muted" style="margin-top:4px">Ends: ${end.toLocaleDateString()}</div><button class="btn full" style="margin-top:8px" onclick="renewSubscription(${x.id})">Renew 30 Days</button></div>`;
  }).join(''):'<div class="muted">No subscriptions to renew.</div>';
}
function renewSubscription(subId){
  ensureSubscriptionArrays();
  const x=s.subscriptions.find(z=>String(z.id)===String(subId));if(!x)return;
  const p=(s.subscriptionPlans||[]).find(z=>String(z.id)===String(x.planId));if(!p)return;
  const price=getSubscriptionFinalPrice(p);
  if(Number(s.balance||0)<price){
    if(typeof showLowBalanceModal==='function')showLowBalanceModal(price,Number(s.balance||0));
    else alert('⚠️ Insufficient wallet balance. Please recharge your wallet first.');
    return;
  }
  s.balance=Number(s.balance||0)-price;
  const base=Date.now(), currentEnd=x.expiresAt&&new Date(x.expiresAt).getTime()>base?new Date(x.expiresAt).getTime():base;
  x.expiresAt=new Date(currentEnd+30*86400000).toISOString();x.active=true;x.status='active';x.renewedAt=new Date().toISOString();
  s.tx.push({d:'Subscription renewal · '+(p.name||'Subscription'),a:-price,ts:Date.now(),type:'subscription-renewal'});
  save();renderSubscriptionRenewals();
  if(typeof addNotification==='function')addNotification('Subscription renewed',(p.name||'Subscription')+' renewed for 30 days.','subscription');
  alert('✅ Subscription renewed. '+money(price)+' deducted from your wallet.');
}
function refreshSubscriptionReminders(){
  ensureSubscriptionArrays();refreshSubscriptionStatuses();
  const now=Date.now(), soon=3*86400000;
  const due=s.subscriptions.filter(x=>getSubscriptionStatus(x)==='active'&&x.expiresAt&&(new Date(x.expiresAt).getTime()-now)<=soon);
  const st=document.getElementById('subscriptionReminderStatus');
  if(due.length && typeof addNotification==='function')due.forEach(x=>{
    if(!x.reminderSent){addNotification('Subscription expiring soon','One of your subscriptions expires within 3 days.','subscription');x.reminderSent=true;}
  });
  if(due.length)save();
  if(st)st.textContent=due.length?`${due.length} subscription(s) expire within 3 days.`:'No subscriptions are expiring within 3 days.';
}
function toggleMySubscriptions(){
  const p=document.getElementById('mySubscriptionsPanel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderMySubscriptions();
}
function renderMySubscriptions(){
  ensureSubscriptionArrays();
  const el=document.getElementById('mySubscriptionsList');if(!el)return;
  const plans=Array.isArray(s.subscriptionPlans)?s.subscriptionPlans:[];
  const list=s.subscriptions.slice().reverse();
  el.innerHTML=list.length?list.map(x=>{
    const p=plans.find(z=>String(z.id)===String(x.planId));
    const active=getSubscriptionStatus(x)==='active';
    return `<div style="padding:10px 0;border-bottom:1px solid #eee"><div class="row"><b>${p?.name||'Subscription'}</b><span class="pill">${active?'Active':'Expired'}</span></div><button class="btn light" style="margin-top:8px" onclick="cancelSubscription(${x.id})">Cancel</button><div class="muted" style="margin-top:4px">${active&&x.expiresAt?'Ends: '+new Date(x.expiresAt).toLocaleDateString():x.expiredAt?'Expired: '+new Date(x.expiredAt).toLocaleDateString():''}</div></div>`;
  }).join(''):'<div class="muted">No subscriptions yet.</div>';
}
function toggleSubscriptionTransactions(){
  const p=document.getElementById('subscriptionTransactionsPanel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderSubscriptionTransactions();
}
function renderSubscriptionTransactions(){
  ensureSubscriptionArrays();
  const el=document.getElementById('subscriptionTransactionsList');if(!el)return;
  const rows=s.tx.filter(x=>x&&String(x.type||'').startsWith('subscription')).slice().reverse();
  el.innerHTML=rows.length?rows.map(x=>`<div style="padding:9px 0;border-bottom:1px solid #eee"><div class="row"><b>${x.d||'Subscription'}</b><span>${money(Math.abs(Number(x.a||0)))}</span></div><div class="muted">${x.ts?new Date(x.ts).toLocaleString():''}</div></div>`).join(''):'<div class="muted">No subscription transactions.</div>';
}
function toggleSubscriptionAnalytics(){
  const p=document.getElementById('subscriptionAnalyticsPanel');if(!p)return;
  const open=p.style.display!=='none';p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderSubscriptionAnalytics();
}
function renderSubscriptionAnalytics(){
  const el=document.getElementById('subscriptionAnalyticsList');if(!el)return;
  const plans=Array.isArray(s.subscriptionPlans)?s.subscriptionPlans:[];
  const subs=Array.isArray(s.subscriptions)?s.subscriptions:[];
  const active=subs.filter(x=>getSubscriptionStatus(x)==='active').length;
  const expired=subs.filter(x=>getSubscriptionStatus(x)==='expired').length;
  const revenue=subs.reduce((n,x)=>n+Number(x.price||0),0);
  el.innerHTML=`<div class="row"><b>Active subscribers</b><b>${active}</b></div><div class="row" style="margin-top:8px"><b>Expired subscriptions</b><b>${expired}</b></div><div class="row" style="margin-top:8px"><b>Plans created</b><b>${plans.length}</b></div><div class="row" style="margin-top:8px"><b>Recorded subscription value</b><b>${money(revenue)}</b></div>`;
}

function renderSubscriberManagement(){
  const el=document.getElementById('subscriberManagementList');if(!el)return;
  if(!(s.mode==='admin'||s.mode==='creator')){el.innerHTML='';return;}
  const subs=Array.isArray(s.subscriptions)?s.subscriptions:[];
  const plans=Array.isArray(s.subscriptionPlans)?s.subscriptionPlans:[];
  const creatorId=String(s.creatorId||s.activeCreatorId||s.currentCreatorId||'default');
  const ownPlans=plans.filter(p=>!p.creatorId||String(p.creatorId)===creatorId);
  const ownIds=new Set(ownPlans.map(p=>String(p.id)));
  const visible=subs.filter(x=>ownIds.has(String(x.planId)));
  refreshSubscriptionStatuses(); const now=Date.now();
  el.innerHTML=visible.length?visible.slice().reverse().map((x,i)=>{
    const plan=ownPlans.find(p=>String(p.id)===String(x.planId));
    const active=getSubscriptionStatus(x)==='active';
    return `<div style="padding:10px 0;border-bottom:1px solid #eee">
      <div class="row"><b>${plan?.name||'Subscription'}</b><span class="pill">${active?'Active':'Expired'}</span></div>
      <div class="muted" style="margin-top:4px">Plan subscribers: ${getPlanSubscriberCount(x.planId)}</div><div class="muted" style="margin-top:4px">Started: ${x.startedAt?new Date(x.startedAt).toLocaleDateString():'—'}</div>
      ${x.expiresAt?`<div class="muted">Ends: ${new Date(x.expiresAt).toLocaleDateString()}</div>`:''}
    </div>`;
  }).join(''):'<div class="muted">No subscribers yet.</div>';
}
function toggleSubscriberManagement(){
  const p=document.getElementById('subscriberManagementPanel');if(!p)return;
  const open=p.style.display!=='none';
  p.style.setProperty('display',open?'none':'block','important');
  if(!open)renderSubscriberManagement();
}


function renderFanWalletRechargeHistory(){
  const el=document.getElementById('fanWalletRechargeHistoryList');
  if(!el)return;
  if(String(s.mode||document.body.getAttribute('data-mode')||'').toLowerCase()!=='fan'){
    el.innerHTML='';
    const card=document.getElementById('fanWalletRechargeHistoryCard');if(card)card.style.setProperty('display','none','important');
    return;
  }
  const tx=Array.isArray(s.tx)?s.tx:[];
  const rows=tx.filter(x=>{
    if(!x)return false;
    const type=String(x.type||'').toLowerCase();
    const label=String(x.d||x.description||'').toLowerCase();
    return type==='wallet-recharge' ||
           type==='wallet_recharge' ||
           type==='recharge' ||
           type==='wallet-topup' ||
           type==='wallet_topup' ||
           label.includes('wallet recharge') ||
           label.includes('wallet recharge') ||
           label.includes('wallet top up') ||
           label.includes('wallet top-up');
  }).sort((a,b)=>Number(b.ts||b.createdAt||0)-Number(a.ts||a.createdAt||0)).slice(0,5);

  el.innerHTML=rows.length ? rows.map(x=>{
    const amount=Math.abs(Number(x.a||x.amount||0));
    const when=x.ts?new Date(x.ts).toLocaleString():
      (x.createdAt?new Date(x.createdAt).toLocaleString():'');
    return `<div style="padding:10px 0;border-bottom:1px solid #eee">
      <div class="row"><b>Wallet Recharge</b><b>${money(amount)}</b></div>
      <div class="muted" style="margin-top:4px">${when}</div>
    </div>`;
  }).join('') : '<div class="muted">No wallet recharge history yet.</div>';
}


function enforceStableRoleVisibility(){
  const mode=String(s.mode||document.body.getAttribute('data-mode')||'fan').toLowerCase();
  document.body.setAttribute('data-mode',mode);
  const fanOnly=['fanHistoryCard'];
  const adminCreatorOnly=[
    'creatorAnalyticsCard','creatorPayoutCard','adminPayoutCard','adminAuditCard',
    'adminBackupCard','adminSupportCard','step88to107UpgradeCard',
    'step108to127Card','step128to147Card','step148to177Card','step178to195Card'
  ];
  fanOnly.forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.setProperty('display',mode==='fan'?'block':'none','important');
  });
  adminCreatorOnly.forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    const show=(mode==='admin'||mode==='creator');
    el.style.setProperty('display',show?'block':'none','important');
  });
  // Payout and Total Spent must never appear in Fan UI.
  if(mode==='fan'){
    document.querySelectorAll('[id*="payout" i],[class*="payout" i],[id*="totalspent" i],[id*="total-spent" i],[class*="totalspent" i]')
      .forEach(el=>el.style.setProperty('display','none','important'));
  }
}


function renderStableFanRechargeHistory(){
  const el=document.getElementById('fanHistoryList');
  if(!el)return;
  if(String(s.mode||document.body.getAttribute('data-mode')||'').toLowerCase()!=='fan'){
    el.innerHTML='';
    return;
  }
  const tx=Array.isArray(s.tx)?s.tx:[];
  const rows=tx.filter(x=>{
    const t=String(x?.type||'').toLowerCase();
    const d=String(x?.d||x?.description||'').toLowerCase();
    return ['wallet-recharge','wallet_recharge','recharge','wallet-topup','wallet_topup'].includes(t)
      || d.includes('wallet recharge')
      || d.includes('wallet top up')
      || d.includes('wallet top-up');
  }).sort((a,b)=>Number(b.ts||0)-Number(a.ts||0)).slice(0,5);
  el.innerHTML=rows.length?rows.map(x=>{
    const amount=Math.abs(Number(x.a||x.amount||0));
    const date=x.ts?new Date(x.ts).toLocaleString():'';
    return `<div style="padding:10px 0;border-bottom:1px solid #eee">
      <div class="row"><b>Wallet Recharge</b><b>₹${amount}</b></div>
      <div class="muted" style="margin-top:4px">${date}</div>
    </div>`;
  }).join(''):'<div class="muted">No wallet recharge yet.</div>';
}


function finalStep200RoleLock(){
  const mode=String(s.mode||document.body.getAttribute('data-mode')||'fan').toLowerCase();
  document.body.setAttribute('data-mode',mode);
  const history=document.getElementById('fanHistoryCard');
  if(history)history.style.setProperty('display',mode==='fan'?'block':'none','important');
  if(mode==='fan'){
    document.querySelectorAll('[id*="payout" i],[class*="payout" i],[id*="totalspent" i],[id*="total-spent" i],[class*="totalspent" i]')
      .forEach(el=>el.style.setProperty('display','none','important'));
  }
}
function finalStep200RechargeLimit(){
  if(String(s.mode||document.body.getAttribute('data-mode')||'').toLowerCase()!=='fan')return [];
  const rows=typeof getLastFiveWalletRecharges==='function'
    ?getLastFiveWalletRecharges().slice(0,5):[];
  return rows;
}
function finalStep200Integrity(){
  if(typeof ensureStep178to195==='function')ensureStep178to195();
  if(typeof validateChatMessageShape178==='function')validateChatMessageShape178();
  if(typeof validateNotificationShape178==='function')validateNotificationShape178();
  if(typeof validateSubscriptionShape178==='function')validateSubscriptionShape178();
  if(typeof validateWalletShape178==='function')validateWalletShape178();
  if(typeof subscriptionIntegrityPass==='function')subscriptionIntegrityPass();
  if(typeof validateChatState==='function')validateChatState();
  finalStep200RoleLock();
  finalStep200RechargeLimit();
  if(typeof renderStableFanRechargeHistory==='function')renderStableFanRechargeHistory();
  save();
  return true;
}


function finalDomIntegrityCheck(){
  const seen=new Set(), dup=[];
  document.querySelectorAll('[id]').forEach(el=>{
    const id=el.id;
    if(seen.has(id))dup.push(id); else seen.add(id);
  });
  if(typeof enforceStableRoleVisibility==='function')enforceStableRoleVisibility();
  if(typeof finalStep200RoleLock==='function')finalStep200RoleLock();
  if(typeof renderStableFanRechargeHistory==='function')renderStableFanRechargeHistory();
  return [...new Set(dup)];
}


function ensurePayoutState(){
  if(!s.payout)s.payout={method:'bank',verified:false,verificationStatus:'not_verified',details:null};
}
function updatePayoutMethodUI(){
  ensurePayoutState();
  const method=document.getElementById('payoutMethod')?.value||'bank';
  const bank=document.getElementById('bankPayoutFields'),upi=document.getElementById('upiPayoutFields');
  if(bank)bank.style.setProperty('display',method==='bank'?'block':'none','important');
  if(upi)upi.style.setProperty('display',method==='upi'?'block':'none','important');
  s.payout={...s.payout,method,verified:false,verificationStatus:'not_verified'};
  updatePayoutVerificationUI();
}
function setPayoutVerification(status,message){
  ensurePayoutState();
  s.payout.verified=status==='verified';
  s.payout.verificationStatus=status;
  s.payout.verificationMessage=message||'';
  updatePayoutVerificationUI();
  save();
}
function updatePayoutVerificationUI(){
  ensurePayoutState();
  const box=document.getElementById('payoutVerificationStatus');
  const btn=document.getElementById('savePayoutDetailsBtn');
  if(!box)return;
  const verified=s.payout.verified===true;
  box.textContent=verified?'✅ Verified — payout details can be saved.':'⚠️ '+(s.payout.verificationMessage||'Not verified');
  if(btn)btn.disabled=!verified;
}
function validIfsc(v){return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(String(v||'').trim());}
function validAccountNumber(v){return /^\d{9,18}$/.test(String(v||'').trim());}
function validUpi(v){return /^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$/.test(String(v||'').trim());}

function verifyBankPayoutDetails(){
  if(s.mode!=='admin' && s.mode!=='creator')return;
  const name=document.getElementById('bankHolderName')?.value.trim();
  const acc=document.getElementById('bankAccountNumber')?.value.trim();
  const ifsc=(document.getElementById('bankIfsc')?.value||'').trim().toUpperCase();
  if(!name){setPayoutVerification('invalid','Enter the account holder name.');return;}
  if(!validAccountNumber(acc)){setPayoutVerification('invalid','Enter a valid bank account number.');return;}
  if(!validIfsc(ifsc)){setPayoutVerification('invalid','Enter a valid IFSC code.');return;}
  // Format validation only. Ownership/₹1 verification must be done server-side
  // through a banking/payout provider before marking the account as verified.
  setPayoutVerification('pending','Bank details format is valid. Ownership verification is pending with the payout provider.');
}
function verifyUpiPayoutDetails(){
  if(s.mode!=='admin' && s.mode!=='creator')return;
  const upi=(document.getElementById('upiId')?.value||'').trim();
  if(!validUpi(upi)){setPayoutVerification('invalid','Enter a valid UPI ID.');return;}
  setPayoutVerification('pending','UPI format is valid. Ownership verification is pending with the payout provider.');
}
function saveVerifiedPayoutDetails(){
  if(s.mode!=='admin' && s.mode!=='creator')return;
  ensurePayoutState();
  if(s.payout.verificationStatus!=='verified'){
    alert('Payout details cannot be saved until ownership verification is completed.');
    return;
  }
  const method=document.getElementById('payoutMethod')?.value||'bank';
  const details=method==='bank'
    ?{holder:document.getElementById('bankHolderName')?.value.trim(),account:document.getElementById('bankAccountNumber')?.value.trim(),ifsc:document.getElementById('bankIfsc')?.value.trim().toUpperCase()}
    :{upi:document.getElementById('upiId')?.value.trim()};
  s.payout={...s.payout,method,details,verified:true,verificationStatus:'verified',savedAt:Date.now()};
  save();
  alert('✅ Verified payout details saved.');
}
function loadPayoutDetails(){
  ensurePayoutState();
  const method=document.getElementById('payoutMethod');if(method)method.value=s.payout.method||'bank';
  if(s.payout.method==='bank'){
    const d=s.payout.details||{};
    const n=document.getElementById('bankHolderName'),a=document.getElementById('bankAccountNumber'),i=document.getElementById('bankIfsc');
    if(n)n.value=d.holder||'';if(a)a.value=d.account||'';if(i)i.value=d.ifsc||'';
  }else{
    const u=document.getElementById('upiId');if(u)u.value=(s.payout.details||{}).upi||'';
  }
  updatePayoutMethodUI();
  updatePayoutVerificationUI();
}


function enforcePayoutRoleVisibility(){
  const mode=String(s.mode||document.body.getAttribute('data-mode')||'').toLowerCase();
  const page=document.getElementById('payout');
  if(page)page.style.setProperty('display',(mode==='admin'||mode==='creator')?'block':'none','important');
}


async function verifyLiveUPI(){
  const result=document.getElementById('liveUpiResult');
  const input=document.getElementById('upiId');
  const upi=(input?.value||'').trim();
  if(!/^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$/.test(upi)){
    if(result)result.textContent='❌ Enter a valid UPI ID.';
    return;
  }
  if(result)result.textContent='⏳ UPI verification is in progress…';
  try{
    const res=await fetch('/api/upi/verify',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({upiId:upi})
    });
    const data=await res.json();
    if(!res.ok || !data || data.status!=='verified'){
      if(result)result.textContent='❌ UPI verification failed.';
      if(typeof setPayoutVerification==='function')setPayoutVerification('invalid','UPI ownership verification failed.');
      return;
    }
    const name=String(data.accountHolderName||'').trim();
    if(!name){
      if(result)result.textContent='❌ The provider did not return the account-holder name.';
      return;
    }
    if(result)result.innerHTML='✅ <b>Verified Account Name:</b> '+escapeHtml(name);
    if(typeof ensurePayoutState==='function')ensurePayoutState();
    s.payout={...s.payout,method:'upi',verified:true,verificationStatus:'verified',
      verifiedName:name,details:{upi},verifiedAt:Date.now()};
    save();
    if(typeof updatePayoutVerificationUI==='function')updatePayoutVerificationUI();
  }catch(e){
    if(result)result.textContent='⚠️ Live verification service is not connected.';
    if(typeof setPayoutVerification==='function')setPayoutVerification('pending','Connect the server-side UPI verification provider first.');
  }
}
function escapeHtml(v){
  return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}


function refreshAdminFanManagement(){
  const host=document.getElementById('adminFanTable');
  if(!host)return;
  const fans=Array.isArray(s.fans)?s.fans:[];
  if(!fans.length){
    host.innerHTML='<div class="muted">No fan records available yet.</div>';
    return;
  }
  host.innerHTML='<div style="overflow:auto"><table style="width:100%"><thead><tr><th>Name</th><th>Contact</th><th>Status</th></tr></thead><tbody>'+
    fans.map(f=>{
      const name=(f&&f.name)||'Unnamed Fan';
      const contact=(f&&((f.email)||(f.mobile)||(f.contact)))||'—';
      const status=(f&&f.blocked)?'Blocked':'Active';
      return `<tr><td>${name}</td><td>${contact}</td><td>${status}</td></tr>`;
    }).join('')+
    '</tbody></table></div>';
}


function refreshAdminContentManagement(){
  const host=document.getElementById('adminContentTable');
  if(!host)return;
  const posts=Array.isArray(s.posts)?s.posts:[];
  if(!posts.length){
    host.innerHTML='<div class="muted">No creator posts available yet.</div>';
    return;
  }
  host.innerHTML='<div style="overflow:auto"><table style="width:100%"><thead><tr><th>Title</th><th>Price</th><th>Status</th></tr></thead><tbody>'+
    posts.map(p=>{
      const title=(p&&((p.title)||(p.name)))||'Untitled Post';
      const price=(p&&p.price!=null)?`₹${p.price}`:'Free';
      const status=(p&&p.published===false)?'Draft':'Published';
      return `<tr><td>${title}</td><td>${price}</td><td>${status}</td></tr>`;
    }).join('')+
    '</tbody></table></div>';
}


function refreshAdminTransactions(){
  const host=document.getElementById('adminTransactionsTable');
  if(!host)return;
  const tx=Array.isArray(s.tx)?s.tx:[];
  let earnings=0;
  tx.forEach(t=>{ const a=Number(t&&t.a)||0; if(a>0) earnings+=a; });
  const setText=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v);};
  setText('adminTotalTransactions',tx.length);
  setText('adminTotalEarnings','₹'+earnings);
  if(!tx.length){
    host.innerHTML='<div class="muted">No transactions recorded yet.</div>';
    return;
  }
  const rows=tx.slice().reverse().map(t=>{
    const desc=(t&&t.d)||'Transaction';
    const amount=Number(t&&t.a)||0;
    const when=t&&t.ts?new Date(t.ts).toLocaleString():'—';
    return `<tr><td>${desc}</td><td>₹${amount}</td><td>${when}</td></tr>`;
  }).join('');
  host.innerHTML='<div style="overflow:auto"><table style="width:100%"><thead><tr><th>Description</th><th>Amount</th><th>Date</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}


function refreshAdminGiftManagement(){
  const host=document.getElementById('adminGiftTable');
  if(!host)return;
  const gifts=Array.isArray(s.gifts)?s.gifts:[];
  const tx=Array.isArray(s.tx)?s.tx:[];
  const giftTx=tx.filter(t=>t && /gift/i.test(String(t.d||'')));
  const setText=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v);};
  setText('adminGiftCatalogCount',gifts.filter(g=>g&&g.visible!==false).length);
  setText('adminGiftActivityCount',giftTx.length);
  if(!gifts.length){
    host.innerHTML='<div class="muted">No gifts are configured yet.</div>';
    return;
  }
  host.innerHTML='<div style="overflow:auto"><table style="width:100%"><thead><tr><th>Gift</th><th>Value</th><th>Status</th></tr></thead><tbody>'+
    gifts.map(g=>{
      const name=(g&&((g.name)||(g.title)))||'Unnamed Gift';
      const value=(g&&g.price!=null)?`₹${g.price}`:((g&&g.value!=null)?`₹${g.value}`:'—');
      const status=(g&&g.visible===false)?'Hidden':'Active';
      return `<tr><td>${name}</td><td>${value}</td><td>${status}</td></tr>`;
    }).join('')+
    '</tbody></table></div>';
}


function refreshAdminSettingsControls(){
  const status=document.getElementById('adminCreatorStatusBtn');
  if(status) status.textContent='Creator visible as: '+(s.creatorOnline?'Online':'Offline');
  const free=document.getElementById('adminFreeChatBtn');
  if(free) free.textContent='Free Chat: '+(s.freeChat?'ON':'OFF');
}
function adminToggleCreatorStatus(){
  if(typeof toggleCreatorStatus==='function') toggleCreatorStatus();
  refreshAdminSettingsControls();
}
function adminToggleFreeChat(){
  if(typeof toggleFree==='function') toggleFree();
  refreshAdminSettingsControls();
}


function refreshAdminDashboard(){
  const fans=Array.isArray(s.fans)?s.fans.length:0;
  const posts=Array.isArray(s.posts)?s.posts.length:0;
  const gifts=Array.isArray(s.gifts)?s.gifts.filter(g=>g&&g.visible!==false).length:0;
  const tx=Array.isArray(s.tx)?s.tx.length:0;
  const setText=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v);};
  setText('dashFans',fans);
  setText('dashPosts',posts);
  setText('dashGifts',gifts);
  setText('dashTransactions',tx);
  setText('adminLiveStatus',s.creatorOnline?'Online':'Offline');
}


(function(){
  const ADMIN_SESSION_KEY='creatorchat_admin_unlocked';
  const ADMIN_PASSCODE='CHANGE_ME_BEFORE_PRODUCTION';

  function setAdminGate(unlocked){
    const status=document.getElementById('adminGateStatus');
    const box=document.getElementById('adminGateBox');
    if(status) status.textContent=unlocked?'Unlocked':'Locked';
    if(box && unlocked){
      box.innerHTML='<div class="muted">Admin tools are unlocked for this browser session.</div><button class="btn light" type="button" onclick="lockAdminTools()" style="margin-top:8px">Lock Admin Tools</button>';
    }
  }
  window.unlockAdminTools=function(){
    const input=document.getElementById('adminGateInput');
    const msg=document.getElementById('adminGateMessage');
    if(!input)return;
    if(input.value===ADMIN_PASSCODE){
      sessionStorage.setItem(ADMIN_SESSION_KEY,'1');
      setAdminGate(true);
    }else if(msg){
      msg.textContent='Incorrect passcode.';
    }
  };
  window.lockAdminTools=function(){
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    location.reload();
  };
  window.refreshAdminAccessControl=function(){
    setAdminGate(sessionStorage.getItem(ADMIN_SESSION_KEY)==='1');
  };
  document.addEventListener('DOMContentLoaded',window.refreshAdminAccessControl);
})();


/* Removed obsolete placeholder admin auth; Step 210 auth below is authoritative. */


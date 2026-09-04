
(function(){
  const CHAT_API='/api/chats';
  const MESSAGE_API='/api/messages';
  const MAX_PAGE_SIZE=50;
  const MAX_TEXT=4000;
  const MAX_MEDIA_ITEMS=8;
  const ALLOWED_MEDIA=['image','video','audio','file'];
  function ensureStep219State(){
    if(!Array.isArray(s.chatMessages))s.chatMessages=[];
    if(!Array.isArray(s.chatThreads))s.chatThreads=[];
    if(!Array.isArray(s.chatAudit))s.chatAudit=[];
    if(!Array.isArray(s.blockedFans))s.blockedFans=[];
    if(!Array.isArray(s.reportedChats))s.reportedChats=[];
    if(!s.chatSettings)s.chatSettings={fanCanMessage:true,mediaEnabled:true,autoReply:false};
    normalizeStep219Messages();
  }
  function cleanText(v){
    const raw=typeof sanitizeChatText==='function'?sanitizeChatText(v):String(v||'').replace(/<[^>]*>/g,'').trim();
    return raw.slice(0,MAX_TEXT);
  }
  function id(prefix){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}
  function iso(v){const d=v?new Date(v):new Date();return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString();}
  function normalizeMedia(m){
    if(!m)return null;
    const type=String(m.type||m.mediaType||'file').toLowerCase();
    const kind=type.startsWith('image/')?'image':type.startsWith('video/')?'video':type.startsWith('audio/')?'audio':ALLOWED_MEDIA.includes(type)?type:'file';
    return {id:String(m.id||id('media')),kind,mimeType:String(m.mimeType||m.mediaType||m.type||'application/octet-stream').slice(0,120),name:String(m.name||'media').slice(0,180),size:Math.max(0,Number(m.size)||0),url:m.url||m.src||'',thumbnailUrl:m.thumbnailUrl||'',duration:Number.isFinite(Number(m.duration))?Math.max(0,Number(m.duration)):null};
  }
  function normalizeStep219Messages(){
    const seen=new Set();
    s.chatMessages=s.chatMessages.filter(m=>m&&typeof m==='object').map(m=>{
      const out=Object.assign({},m);
      out.id=String(out.id||id('msg'));
      if(seen.has(out.id))out.id=id('msg'); seen.add(out.id);
      out.chatId=String(out.chatId||out.threadId||'');
      out.sender=String(out.sender||out.from||'fan').toLowerCase()==='creator'?'creator':'fan';
      out.type=out.type&&out.type!=='media'?String(out.type):((out.media||out.src)?'media':'text');
      out.text=cleanText(out.text||'');
      out.caption=cleanText(out.caption||'');
      out.createdAt=iso(out.createdAt||out.ts);
      out.updatedAt=iso(out.updatedAt||out.createdAt);
      out.status=['pending','sent','delivered','read','failed','deleted'].includes(String(out.status))?String(out.status):'sent';
      out.readByCreator=!!out.readByCreator;
      out.readByFan=!!out.readByFan;
      out.deleted=!!out.deleted;
      out.pinned=!!out.pinned;
      out.replyToId=out.replyToId?String(out.replyToId):null;
      out.media=Array.isArray(out.media)?out.media.map(normalizeMedia).filter(Boolean).slice(0,MAX_MEDIA_ITEMS):[];
      out.reactions=Array.isArray(out.reactions)?out.reactions.slice(0,30):[];
      return out;
    });
  }
  function ensureThread(chatId,fanId){
    const cid=String(chatId||'');if(!cid)return null;
    let t=s.chatThreads.find(x=>String(x.id)===cid);
    if(!t){t={id:cid,fanId:String(fanId||''),status:'active',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),unreadForCreator:0,unreadForFan:0};s.chatThreads.push(t);}
    return t;
  }
  function getThread(chatId){ensureStep219State();return s.chatThreads.find(x=>String(x.id)===String(chatId||''))||null;}
  function getMessages(chatId,opts){
    ensureStep219State(); opts=opts||{};
    const limit=Math.min(MAX_PAGE_SIZE,Math.max(1,Number(opts.limit)||20));
    let rows=s.chatMessages.filter(m=>String(m.chatId)===String(chatId||'')&&!m.deleted).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
    if(opts.before){const t=new Date(opts.before).getTime();rows=rows.filter(m=>new Date(m.createdAt).getTime()<t);}
    if(opts.after){const t=new Date(opts.after).getTime();rows=rows.filter(m=>new Date(m.createdAt).getTime()>t);}
    return opts.before?rows.slice(-limit):rows.slice(0,limit);
  }
  function unreadFor(chatId,role){
    return s.chatMessages.filter(m=>String(m.chatId)===String(chatId||'')&&!m.deleted&&(role==='creator'?(m.sender==='fan'&&!m.readByCreator):(m.sender==='creator'&&!m.readByFan))).length;
  }
  window.chatApiConfig219={chatsEndpoint:CHAT_API,messagesEndpoint:MESSAGE_API,maxPageSize:MAX_PAGE_SIZE,maxTextLength:MAX_TEXT,mediaKinds:ALLOWED_MEDIA};
  window.ensureChatFoundation219=ensureStep219State;
  window.getChatThread219=getThread;
  window.getChatMessages219=getMessages;
  window.getChatUnreadCount219=unreadFor;
  window.createChatThread219=function(fanId){
    ensureStep219State();const cid=id('chat');const t=ensureThread(cid,fanId);save();return t;
  };
  window.createChatMessage219=function(chatId,sender,text,media){
    ensureStep219State();
    const role=String(sender||'fan').toLowerCase()==='creator'?'creator':'fan';
    if(role==='fan' && s.chatSettings.fanCanMessage===false)return null;
    if(role==='creator' && typeof canSendToFan==='function'){
      const t=getThread(chatId);if(t&&t.fanId&&!canSendToFan(t.fanId))return null;
    }
    const clean=cleanText(text);const medias=Array.isArray(media)?media.map(normalizeMedia).filter(Boolean).slice(0,MAX_MEDIA_ITEMS):[];
    if(!clean && !medias.length)return null;
    if(medias.length && s.chatSettings.mediaEnabled===false)return null;
    const now=new Date().toISOString();
    const msg={id:id('msg'),chatId:String(chatId||''),sender:role,type:medias.length?'media':'text',text:clean,caption:clean,media:medias,createdAt:now,updatedAt:now,status:'sent',readByCreator:role==='creator',readByFan:role==='fan',deleted:false,pinned:false,replyToId:null,reactions:[]};
    s.chatMessages.push(msg);const t=ensureThread(msg.chatId,role==='fan'?msg.sender:'');if(t){t.updatedAt=now;t.unreadForCreator=unreadFor(msg.chatId,'creator');t.unreadForFan=unreadFor(msg.chatId,'fan');}save();
    return msg;
  };
  window.markChatRead219=function(chatId,role){
    ensureStep219State();const r=String(role||'creator').toLowerCase()==='fan'?'fan':'creator';
    s.chatMessages.forEach(m=>{if(String(m.chatId)===String(chatId||'')&&!m.deleted){if(r==='creator'&&m.sender==='fan')m.readByCreator=true;if(r==='fan'&&m.sender==='creator')m.readByFan=true;m.status='read';}});
    const t=getThread(chatId);if(t){t.unreadForCreator=unreadFor(chatId,'creator');t.unreadForFan=unreadFor(chatId,'fan');t.updatedAt=new Date().toISOString();}save();return true;
  };
  window.updateChatMessageStatus219=function(messageId,status){
    ensureStep219State();const allowed=['pending','sent','delivered','read','failed','deleted'];if(!allowed.includes(String(status)))return false;
    const m=s.chatMessages.find(x=>String(x.id)===String(messageId));if(!m)return false;m.status=String(status);m.updatedAt=new Date().toISOString();save();return true;
  };
  window.softDeleteChatMessage219=function(messageId,actor){
    ensureStep219State();const m=s.chatMessages.find(x=>String(x.id)===String(messageId));if(!m)return false;
    const r=String(actor||'fan').toLowerCase()==='creator'?'creator':'fan';if(m.sender!==r)return false;m.deleted=true;m.status='deleted';m.text='';m.caption='';m.media=[];m.updatedAt=new Date().toISOString();save();return true;
  };
  window.addChatMediaMetadata219=function(messageId,media){
    ensureStep219State();const m=s.chatMessages.find(x=>String(x.id)===String(messageId));if(!m)return false;
    const items=Array.isArray(media)?media.map(normalizeMedia).filter(Boolean).slice(0,MAX_MEDIA_ITEMS):[];if(!items.length||s.chatSettings.mediaEnabled===false)return false;m.media=items;m.type='media';m.updatedAt=new Date().toISOString();save();return true;
  };
  window.validateChatFoundation219=function(){
    ensureStep219State();let changed=false;
    s.chatMessages.forEach(m=>{if(m.media.length>MAX_MEDIA_ITEMS){m.media=m.media.slice(0,MAX_MEDIA_ITEMS);changed=true;}if(m.text.length>MAX_TEXT){m.text=m.text.slice(0,MAX_TEXT);changed=true;}if(!m.chatId){m.chatId='legacy';changed=true;}});
    s.chatThreads=s.chatThreads.filter(t=>t&&t.id!=null).map(t=>{t.id=String(t.id);t.status=t.status||'active';t.updatedAt=iso(t.updatedAt);return t;});
    if(changed)save();return {ok:true,messages:s.chatMessages.length,threads:s.chatThreads.length,media:s.chatMessages.reduce((n,m)=>n+m.media.length,0)};
  };
  window.runStep219ChatCheck=function(){
    const r=validateChatFoundation219();if(typeof addChatAudit==='function')addChatAudit('Step 219 integrity check',JSON.stringify(r));save();return r;
  };
  ensureStep219State();
})();

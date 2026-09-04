(function(){
  const SYNC_API='/api/chat-sync';
  const OUTBOX_KEY='creatorchat_chat_outbox_v1';
  const CURSOR_KEY='creatorchat_chat_cursor_v1';
  const MAX_BATCH=25;
  const RETRY_MS=5000;
  let syncBusy=false, retryTimer=null;
  function safeGet(key, fallback){try{const v=localStorage.getItem(key);return v==null?fallback:JSON.parse(v);}catch(e){return fallback;}}
  function safeSet(key,v){try{localStorage.setItem(key,JSON.stringify(v));return true;}catch(e){return false;}}
  function ensure(){
    if(!Array.isArray(s.chatOutbox))s.chatOutbox=safeGet(OUTBOX_KEY,[])||[];
    if(!s.chatSync||typeof s.chatSync!=='object')s.chatSync={status:'idle',lastSyncAt:null,lastError:null,cursor:null,attempts:0};
    if(!Array.isArray(s.chatSyncEvents))s.chatSyncEvents=[];
    return s.chatSync;
  }
  function now(){return new Date().toISOString();}
  function uid(){return 'evt_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
  function addEvent(type,details){ensure();s.chatSyncEvents.push({id:uid(),type,details:details||'',at:now()});if(s.chatSyncEvents.length>200)s.chatSyncEvents=s.chatSyncEvents.slice(-200);}
  function queue(message){ensure();if(!message||!message.id)return false;if(s.chatOutbox.some(x=>String(x.messageId)===String(message.id)))return true;s.chatOutbox.push({id:uid(),messageId:String(message.id),chatId:String(message.chatId||''),operation:message.deleted?'delete':'upsert',queuedAt:now(),attempts:0});safeSet(OUTBOX_KEY,s.chatOutbox);save();return true;}
  function upsertIncoming(message){
    if(!message||!message.id)return false;
    const id=String(message.id); const i=s.chatMessages.findIndex(x=>String(x.id)===id);
    if(i<0)s.chatMessages.push(message); else s.chatMessages[i]=Object.assign({},s.chatMessages[i],message);
    return true;
  }
  function markSynced(ids){ensure();const set=new Set(ids.map(String));s.chatOutbox=s.chatOutbox.filter(x=>!set.has(String(x.messageId)));safeSet(OUTBOX_KEY,s.chatOutbox);}
  async function request(path,body){
    const opts={method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})};
    const res=await fetch(path,opts);
    let data=null;try{data=await res.json();}catch(e){}
    if(!res.ok)throw new Error((data&&data.message)||('Chat sync request failed: '+res.status));
    return data||{};
  }
  window.chatSyncConfig220={endpoint:SYNC_API,maxBatch:MAX_BATCH,retryMs:RETRY_MS,outboxKey:OUTBOX_KEY,cursorKey:CURSOR_KEY};
  window.ensureChatSync220=ensure;
  window.queueChatMessage220=queue;
  window.getChatSyncState220=function(){ensure();return JSON.parse(JSON.stringify(s.chatSync));};
  window.getChatOutbox220=function(){ensure();return s.chatOutbox.slice();};
  window.runChatSync220=async function(){
    ensure();if(syncBusy)return {ok:false,reason:'busy'};syncBusy=true;s.chatSync.status='syncing';s.chatSync.attempts=Number(s.chatSync.attempts||0)+1;save();
    try{
      const outbox=s.chatOutbox.slice(0,MAX_BATCH);
      const cursor=s.chatSync.cursor||safeGet(CURSOR_KEY,null);
      const payload={cursor,changes:outbox.map(x=>{const m=s.chatMessages.find(y=>String(y.id)===String(x.messageId));return {operation:x.operation,message:m||{id:x.messageId,chatId:x.chatId,deleted:true}};})};
      const data=await request(SYNC_API,payload);
      const incoming=Array.isArray(data.messages)?data.messages:[];incoming.forEach(upsertIncoming);
      const ack=Array.isArray(data.acknowledgedMessageIds)?data.acknowledgedMessageIds:outbox.map(x=>x.messageId).slice(0,data.savedCount==null?outbox.length:Number(data.savedCount));
      markSynced(ack);
      if(data.cursor!=null){s.chatSync.cursor=String(data.cursor);safeSet(CURSOR_KEY,s.chatSync.cursor);}
      s.chatSync.status='synced';s.chatSync.lastSyncAt=now();s.chatSync.lastError=null;s.chatSync.attempts=0;save();addEvent('sync_success','in:'+incoming.length+', out:'+ack.length);save();
      return {ok:true,incoming:incoming.length,acknowledged:ack.length,pending:s.chatOutbox.length};
    }catch(e){
      s.chatSync.status='offline';s.chatSync.lastError=String(e&&e.message||e).slice(0,300);save();addEvent('sync_failed',s.chatSync.lastError);save();
      return {ok:false,offline:true,error:s.chatSync.lastError,pending:s.chatOutbox.length};
    }finally{syncBusy=false;}
  };
  window.scheduleChatSync220=function(){clearTimeout(retryTimer);retryTimer=setTimeout(function(){runChatSync220().then(function(r){if(!r.ok)window.scheduleChatSync220();});},RETRY_MS);};
  window.flushChatOutbox220=window.runChatSync220;
  window.validateChatSync220=function(){
    ensure();let changed=false;const seen=new Set();
    s.chatOutbox=s.chatOutbox.filter(x=>x&&x.messageId).map(x=>{x.messageId=String(x.messageId);x.chatId=String(x.chatId||'');x.attempts=Math.max(0,Number(x.attempts)||0);if(seen.has(x.messageId)){changed=true;return null;}seen.add(x.messageId);return x;}).filter(Boolean);
    if(s.chatSync.cursor!=null)s.chatSync.cursor=String(s.chatSync.cursor);
    if(changed){safeSet(OUTBOX_KEY,s.chatOutbox);save();}
    return {ok:true,pending:s.chatOutbox.length,status:s.chatSync.status,lastSyncAt:s.chatSync.lastSyncAt};
  };
  const originalCreate=window.createChatMessage219;
  if(typeof originalCreate==='function'){
    window.createChatMessage219=function(chatId,sender,text,media){const m=originalCreate(chatId,sender,text,media);if(m)queue(m);return m;};
  }
  ensure();
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&s.chatOutbox&&s.chatOutbox.length)window.runChatSync220();});
  window.addEventListener('online',function(){window.runChatSync220();});
})();
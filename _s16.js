
(function(){
  window.CreatorChatStep214Audit={
    checks:{},
    run:function(){
      var c=this.checks, d=document;
      c.body=!!d.body;
      c.state=typeof window.s==='object' && window.s!==null;
      c.fansCard=!!d.getElementById('adminFansManagementCard');
      c.fanList=!!d.getElementById('adminFanList');
      c.accountSections=!!d.getElementById('adminFanAccountSections');
      c.renderAction=typeof window.renderFanAdminActions==='function';
      c.statusAction=typeof window.setFanAdminStatus==='function';
      c.viewAsFan=typeof window.viewFanAsAdmin==='function';
      c.usersOnce=d.querySelectorAll('#users').length===1;
      c.fanListOnce=d.querySelectorAll('#adminFanList').length===1;
      c.cardOnce=d.querySelectorAll('#adminFansManagementCard').length===1;
      return Object.keys(c).every(function(k){return c[k]===true;});
    }
  };
  try{window.CreatorChatStep214Audit.run();}catch(e){window.CreatorChatStep214AuditError=String(e);}
})();

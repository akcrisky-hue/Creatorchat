
(function(){
  window.CreatorChatDeploymentAudit=function(){
    var issues=[], d=document, s=window.s;
    if(!d.body) issues.push('document body missing');
    if(typeof s!=='object'||!s) issues.push('application state missing');
    if(d.querySelectorAll('#users').length!==1) issues.push('Fans page duplication/missing');
    if(d.querySelectorAll('#adminFansManagementCard').length!==1) issues.push('Fan Management card duplication/missing');
    if(d.querySelectorAll('#adminFanList').length!==1) issues.push('Fan list duplication/missing');
    if(typeof window.renderFanAdminActions!=='function') issues.push('Fan action handler missing');
    if(typeof window.setFanAdminStatus!=='function') issues.push('Status handler missing');
    if(typeof window.viewFanAsAdmin!=='function') issues.push('View-as-Fan handler missing');
    if(typeof window.openFanManager!=='function') issues.push('Fan manager opener missing');
    if(/f\.(password|otp)\b/.test(d.documentElement.innerHTML)) issues.push('password/OTP renderer reference detected');
    return {ready:issues.length===0,issues:issues};
  };
  try{window.CreatorChatDeploymentAudit();}catch(e){window.CreatorChatDeploymentAuditError=String(e);}
})();

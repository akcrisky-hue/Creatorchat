
try{
  document.body.setAttribute('data-mode',String(s.mode||'fan'));
  enforceStableRoleVisibility();
  renderStableFanRechargeHistory();
  try{syncAdminOnlyUI();}catch(e){}
}catch(e){}

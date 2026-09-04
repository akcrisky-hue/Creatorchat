
try{
  if(s.mode!=='admin'&&s.mode!=='fan')s.mode='fan';
  document.body.setAttribute('data-mode',s.mode);
}catch(e){}

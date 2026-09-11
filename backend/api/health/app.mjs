import { json, requestId } from '../../lib.mjs';
const VERSION='249.5.29';
export default async function handler(req,res){
  const rid=requestId(req);
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'},rid);
  return json(res,200,{ok:true,service:'creatorchat-api',database:'not_checked',version:VERSION,time:new Date().toISOString()},rid);
}

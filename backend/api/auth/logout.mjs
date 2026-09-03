import { json, clearSession, requestId, requireSameOrigin } from '../../lib.mjs';
export default async function handler(req,res){const rid=requestId(req);if(req.method!=='POST')return json(res,405,{error:'Method not allowed'},rid);if(!requireSameOrigin(req,res,rid))return;clearSession(res);return json(res,200,{ok:true},rid);}

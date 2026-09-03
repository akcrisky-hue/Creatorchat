import { db, json, requestId } from '../../lib.mjs';
export default async function handler(req,res){const rid=requestId(req);if(req.method!=='GET')return json(res,405,{error:'Method not allowed'},rid);try{const q=await db().query('SELECT 1 AS ok');return json(res,200,{ok:q.rows[0]?.ok===1},rid);}catch{return json(res,503,{ok:false,error:'Database unavailable'},rid);}}

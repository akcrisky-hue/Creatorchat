import crypto from 'node:crypto';
import { Pool } from 'pg';

let pool;
const buckets=new Map();
const SESSION='cc_session';
export function db(){
  if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  if(!pool) pool=new Pool({connectionString:process.env.DATABASE_URL,max:5,idleTimeoutMillis:10000,connectionTimeoutMillis:5000});
  return pool;
}
export function requestId(req){return String(req.headers?.['x-request-id']||`req_${crypto.randomUUID()}`).slice(0,120);}
export function headers(res,rid){res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','camera=(),microphone=(),geolocation=()');res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none';");res.setHeader('X-Request-Id',rid);}
export function json(res,status,payload,rid){headers(res,rid||`req_${crypto.randomUUID()}`);res.status(status).end(JSON.stringify(payload));}
export async function body(req){
  const len=Number(req.headers?.['content-length']||0); if(len>65536) throw Object.assign(new Error('Request body too large'),{statusCode:413});
  if(req.body&&typeof req.body==='object') return req.body;
  let raw=''; for await(const chunk of req){raw+=chunk;if(raw.length>65536) throw Object.assign(new Error('Request body too large'),{statusCode:413});}
  if(!raw)return{}; try{return JSON.parse(raw)}catch{throw Object.assign(new Error('Invalid JSON'),{statusCode:400});}
}
export function cookie(req,name){const raw=req.headers.cookie||'';const item=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));return item?decodeURIComponent(item.slice(name.length+1)):'';}
function sign(value){if(!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured');return crypto.createHmac('sha256',process.env.SESSION_SECRET).update(value).digest('base64url');}
export function setSession(res,user){if(!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured');const payload=Buffer.from(JSON.stringify({id:user.id,role:user.role,email:user.email,name:user.name,exp:Date.now()+86400000})).toString('base64url');res.setHeader('Set-Cookie',`${SESSION}=${payload}.${sign(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`);}
export function clearSession(res){res.setHeader('Set-Cookie',`${SESSION}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);}
export function session(req){if(!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured');const v=cookie(req,SESSION);const [payload,sig]=v.split('.');const expected=sign(payload||'');if(!payload||!sig||sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;let x;try{x=JSON.parse(Buffer.from(payload,'base64url').toString())}catch{return null}return x.exp>Date.now()?x:null;}
export function requireSession(req,res,roles=[],rid){const s=session(req);if(!s){json(res,401,{error:'Unauthorized'},rid);return null;}if(roles.length&&!roles.includes(s.role)){json(res,403,{error:'Forbidden'},rid);return null;}return s;}
export function requireSameOrigin(req,res,rid){const origin=req.headers?.origin;if(!origin)return true;const host=req.headers?.host||'';try{if(new URL(origin).host!==host){json(res,403,{error:'Origin not allowed'},rid);return false;}}catch{json(res,403,{error:'Invalid origin'},rid);return false;}return true;}
export function rateLimit(req,key,max=30,windowMs=60000){const ip=String(req.headers?.['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();const k=`${key}:${ip}`;const now=Date.now();const a=(buckets.get(k)||[]).filter(t=>now-t<windowMs);if(a.length>=max)return false;a.push(now);buckets.set(k,a);if(buckets.size>2000){for(const [bk,ba] of buckets)if(ba.every(t=>now-t>=windowMs))buckets.delete(bk);}return true;}
export function id(prefix){return `${prefix}_${crypto.randomUUID()}`;}
export function razorpayAuth(){if(!process.env.RAZORPAY_KEY_ID||!process.env.RAZORPAY_KEY_SECRET) throw new Error('Razorpay credentials are not configured');return 'Basic '+Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');}
export function verifyRazorpaySignature(orderId,paymentId,signature){const expected=crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET||'').update(`${orderId}|${paymentId}`).digest('hex');const given=String(signature||'');return Boolean(given)&&given.length===expected.length&&crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(given));}
export function safeServerError(e){return e?.statusCode?{status:e.statusCode,error:e.message}:{status:500,error:'Server error'};}

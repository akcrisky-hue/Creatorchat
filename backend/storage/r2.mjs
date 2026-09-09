import crypto from 'node:crypto';

const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']);
const MAX_IMAGE = 25 * 1024 * 1024;
const MAX_VIDEO = 500 * 1024 * 1024;

function cfg(){
  const c={accountId:process.env.R2_ACCOUNT_ID,bucket:process.env.R2_BUCKET,accessKey:process.env.R2_ACCESS_KEY_ID,secretKey:process.env.R2_SECRET_ACCESS_KEY};
  if(Object.values(c).some(v=>!v)) throw Object.assign(new Error('R2 storage is not configured'),{statusCode:503});
  return c;
}
function hash(s){return crypto.createHash('sha256').update(s).digest('hex');}
function hmac(key,data,encoding){return crypto.createHmac('sha256',key).update(data).digest(encoding);}
function signingKey(secret,date,region='auto',service='s3'){const kDate=hmac(Buffer.from('AWS4'+secret),date);const kRegion=hmac(kDate,region);const kService=hmac(kRegion,service);return hmac(kService,'aws4_request');}
function encodePath(key){return String(key).split('/').map(encodeURIComponent).join('/');}
function endpoint(c,key){return `https://${c.accountId}.r2.cloudflarestorage.com/${encodeURIComponent(c.bucket)}/${encodePath(key)}`;}
function amzDate(now=new Date()){const iso=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');return {full:iso,date:iso.slice(0,8)};}
function canonicalQuery(params){return Object.keys(params).sort().map(k=>`${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`).join('&');}
function presign(method,key,headers={},expires=600){
  const c=cfg(), now=amzDate(); const host=`${c.accountId}.r2.cloudflarestorage.com`;
  const signedHeaders=['host',...Object.keys(headers).map(String).map(x=>x.toLowerCase()).filter(x=>x!=='host')].sort();
  const canonicalHeaders=signedHeaders.map(k=>`${k}:${k==='host'?host:String(headers[k]??headers[Object.keys(headers).find(x=>x.toLowerCase()===k)]).trim()}\n`).join('');
  const scope=`${now.date}/auto/s3/aws4_request`;
  const query={
    'X-Amz-Algorithm':'AWS4-HMAC-SHA256','X-Amz-Credential':`${c.accessKey}/${scope}`,'X-Amz-Date':now.full,'X-Amz-Expires':Math.min(900,Math.max(60,expires)),'X-Amz-SignedHeaders':signedHeaders.join(';')
  };
  const canonicalRequest=[method,`/${encodeURIComponent(c.bucket)}/${encodePath(key)}`,canonicalQuery(query),canonicalHeaders,signedHeaders.join(';'),'UNSIGNED-PAYLOAD'].join('\n');
  const signature=crypto.createHmac('sha256',signingKey(c.secretKey,now.date)).update(`AWS4-HMAC-SHA256\n${now.full}\n${scope}\n${hash(canonicalRequest)}`).digest('hex');
  query['X-Amz-Signature']=signature;
  return `${endpoint(c,key)}?${canonicalQuery(query)}`;
}
export function validateMedia({name,type,size}){
  const mime=String(type||'').toLowerCase().trim(), bytes=Math.trunc(Number(size)||0);
  if(!ALLOWED.has(mime)) throw Object.assign(new Error('Unsupported media type'),{statusCode:400});
  const max=mime.startsWith('video/')?MAX_VIDEO:MAX_IMAGE;
  if(bytes<=0||bytes>max) throw Object.assign(new Error(`Media exceeds the ${mime.startsWith('video/')?'500MB':'25MB'} limit`),{statusCode:400});
  const cleanName=String(name||'media').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120)||'media';
  return {name:cleanName,type:mime,size:bytes};
}
export function mediaKey(creatorId,mediaId,name){
  const ext=(String(name).match(/\.[a-zA-Z0-9]{1,8}$/)?.[0]||'').toLowerCase();
  return `creators/${String(creatorId).replace(/[^a-zA-Z0-9_-]/g,'_')}/posts/${String(mediaId).replace(/[^a-zA-Z0-9_-]/g,'_')}${ext}`;
}
export function presignUpload(key,type){return presign('PUT',key,{'content-type':type},600);}
export function presignDownload(key){return presign('GET',key,{},300);}
export async function deleteObject(key){
  const c=cfg(), now=amzDate(), host=`${c.accountId}.r2.cloudflarestorage.com`, path=`/${encodeURIComponent(c.bucket)}/${encodePath(key)}`;
  const canonicalHeaders=`host:${host}\n`, scope=`${now.date}/auto/s3/aws4_request`, canonicalRequest=['DELETE',path,'',canonicalHeaders,'host','UNSIGNED-PAYLOAD'].join('\n');
  const signature=crypto.createHmac('sha256',signingKey(c.secretKey,now.date)).update(`AWS4-HMAC-SHA256\n${now.full}\n${scope}\n${hash(canonicalRequest)}`).digest('hex');
  const auth=`AWS4-HMAC-SHA256 Credential=${c.accessKey}/${scope}, SignedHeaders=host, Signature=${signature}`;
  const r=await fetch(`https://${host}${path}`,{method:'DELETE',headers:{host,'x-amz-date':now.full,authorization:auth}});
  if(!r.ok && r.status!==404) throw Object.assign(new Error('Storage delete failed'),{statusCode:502});
  return true;
}
export function isConfigured(){return Boolean(process.env.R2_ACCOUNT_ID&&process.env.R2_BUCKET&&process.env.R2_ACCESS_KEY_ID&&process.env.R2_SECRET_ACCESS_KEY);}
export const limits={maxImageBytes:MAX_IMAGE,maxVideoBytes:MAX_VIDEO,allowedTypes:[...ALLOWED]};

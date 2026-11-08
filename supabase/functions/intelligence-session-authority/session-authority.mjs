// Private, read-only Training session authority. No browser CORS or secrets.
const ISSUER='https://ljuqbkwsnouthzwrzszy.supabase.co/auth/v1';
const PATH='/functions/v1/intelligence-session-authority';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEADERS={'cache-control':'no-store','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'};
const reply=(code,data)=>new Response(JSON.stringify(data),{status:code,headers:HEADERS});
const denied=()=>reply(401,{error:'UNAUTHENTICATED'});
const unavailable=()=>reply(503,{error:'AUTH_UNAVAILABLE'});
function b64bytes(s){
 if(typeof s!=='string'||!/^[A-Za-z0-9_-]{86}$/.test(s))throw Error('invalid signature');
 const base=s.replace(/-/g,'+').replace(/_/g,'/');
 const bytes=Uint8Array.from(atob(base+'='.repeat((4-base.length%4)%4)),char=>char.charCodeAt(0));
 if(bytes.length!==64||btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'')!==s)throw Error('invalid signature');
 return bytes;
}
async function readBody(req){
 const reader=req.body?.getReader();if(!reader)throw Error('missing body');
 const parts=[];let len=0;
 for(;;){
  const {value,done}=await reader.read();if(done)break;
  len+=value.byteLength;
  if(len>360){await reader.cancel().catch(()=>{});throw Error('too large');}
  parts.push(value);
 }
 const bytes=new Uint8Array(len);let cursor=0;
 for(const part of parts){bytes.set(part,cursor);cursor+=part.byteLength;}
 return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
/** checkSession queries auth.sessions by both user_id and id; no privileged access reaches clients. */
export function createTrainingSessionAuthority({publicKeyJwk,checkSession,clock=()=>Date.now()}={}){
 if(!publicKeyJwk||typeof publicKeyJwk!=='object'||Array.isArray(publicKeyJwk)||
  Object.keys(publicKeyJwk).some(k=>!['kty','crv','x','key_ops','ext','alg'].includes(k))||
  publicKeyJwk.kty!=='OKP'||publicKeyJwk.crv!=='Ed25519'||
  typeof publicKeyJwk.x!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(publicKeyJwk.x)||
  (publicKeyJwk.key_ops!==undefined&&JSON.stringify(publicKeyJwk.key_ops)!=='["verify"]')||
  typeof checkSession!=='function'||typeof clock!=='function')throw Error('CONFIGURATION_ERROR');
 const keyPromise=crypto.subtle.importKey('jwk',publicKeyJwk,{name:'Ed25519'},false,['verify']).catch(()=>null);
 return Object.freeze({async fetch(req){
  let url;try{url=new URL(req.url);}catch{return denied();}
  if(req.method!=='POST'||(url.pathname!==PATH&&url.pathname!=='/intelligence-session-authority')||url.search)return denied();
  const ts=req.headers.get('x-evolu-timestamp'),nonce=req.headers.get('x-evolu-nonce'),signature=req.headers.get('x-evolu-signature');
  if(req.headers.get('x-evolu-service')!=='intelligence'||!/^\d{13}$/.test(ts??'')||
   !/^[A-Za-z0-9_-]{22}$/.test(nonce??'')||!Number.isSafeInteger(Number(ts))||
   Math.abs(clock()-Number(ts))>10000||typeof signature!=='string'||signature.length!==86)return denied();
  let raw,parsed,signatureBytes;
  try{
   if(Number(req.headers.get('content-length')||0)>360)return denied();
   raw=await readBody(req);parsed=JSON.parse(raw);
   if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||
    Object.keys(parsed).sort().join(',')!=='issuer,sessionId,subject'||
    parsed.issuer!==ISSUER||!UUID.test(parsed.subject)||!UUID.test(parsed.sessionId))return denied();
   signatureBytes=b64bytes(signature);
  }catch{return denied();}
  try{
   const key=await keyPromise;if(!key)return unavailable();
   const canonical=['v1','intelligence','POST',PATH,ts,nonce,raw].join('\n');
   if(!await crypto.subtle.verify('Ed25519',key,signatureBytes,new TextEncoder().encode(canonical)))return denied();
  }catch{return unavailable();}
  try{
   const active=await checkSession(Object.freeze({subject:parsed.subject,sessionId:parsed.sessionId}));
   return typeof active==='boolean'?reply(200,{active}):unavailable();
  }catch{return unavailable();}
 }});
}

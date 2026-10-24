export const TRAINING_SITE_URL='https://training.evolu.ink';
export const PASSWORD_RESET_PATH='/acesso/definir-senha';
export const PASSWORD_RESET_URL=TRAINING_SITE_URL+PASSWORD_RESET_PATH;
export type RecoveryFragment={accessToken:string;refreshToken:string}|{error:true}|null;
export function readRecoveryFragment(hash:string):RecoveryFragment{
 const values=new URLSearchParams(hash.replace(/^#/,''));
 if(values.has('error')||values.has('error_code'))return {error:true};
 if(!values.has('access_token')&&!values.has('refresh_token'))return null;
 const accessToken=values.get('access_token')||'',refreshToken=values.get('refresh_token')||'';
 if(values.get('type')!=='recovery'||!accessToken||!refreshToken||accessToken.length>16000||refreshToken.length>2048)return {error:true};
 return {accessToken,refreshToken};
}
type RecoveryAuth={verifyOtp(input:{token_hash:string;type:'recovery'}):Promise<{error:unknown}>;exchangeCodeForSession(code:string):Promise<{error:unknown}>};
type RecoveryInput={token_hash:string}|{code:string};
const credentialPattern=/^[a-zA-Z0-9_-]{20,512}$/;
function recoveryInput(values:{get(name:string):unknown}):RecoveryInput|null{
 const token=values.get('token_hash'),code=values.get('code'),type=values.get('type');
 if(type&&type!=='recovery')return null;
 if(typeof token==='string'&&credentialPattern.test(token)&&!code)return {token_hash:token};
 if(typeof code==='string'&&credentialPattern.test(code)&&!token)return {code};
 return null;
}
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]!));
const privateHeaders={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
function recoveryPage(input:RecoveryInput|null){
 const field=input?Object.entries(input).map(([name,value])=>`<input type="hidden" name="${name}" value="${escapeHtml(value)}">`).join(''):'';
 const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Recuperar acesso | Evolu Training</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f6f6f3;color:#151819;font:16px/1.6 Montserrat,Arial,sans-serif}main{width:100%;max-width:520px;padding:36px;background:white;border:1px solid #e0e2dc;border-top:4px solid #d8fc63;border-radius:8px}img{width:155px;height:auto}small{display:block;letter-spacing:.18em;font-size:11px;margin-top:24px;color:#5f655f}h1{font-size:30px;line-height:1.2;letter-spacing:-1px}p{color:#59605b}button{border:0;border-radius:5px;background:#151819;color:#fff;padding:16px 20px;width:100%;font-size:15px;font-weight:600;cursor:pointer}a{color:#151819}footer{margin-top:24px;font-size:13px}</style></head><body><main><img src="/brand/evolu-black.png" alt="EVOLU"><small>TRAINING / ACESSO</small><h1>${input?'Vamos recuperar seu acesso.':'Este link não é válido.'}</h1><p>${input?'Continue para escolher uma nova senha e voltar aos seus treinamentos.':'Solicite um novo e-mail de recuperação na tela de acesso.'}</p>${input?`<form method="post" action="/auth/confirm">${field}<input type="hidden" name="type" value="recovery"><button type="submit">Continuar para redefinir senha →</button></form>`:''}<footer><a href="/acesso">Voltar ao acesso</a></footer></main></body></html>`;
 return new Response(html,{status:input?200:400,headers:{...privateHeaders,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"}});
}
export function createRecoveryHandlers(getAuth:()=>Promise<RecoveryAuth>){
 return {
  async GET(request:Request){return recoveryPage(recoveryInput(new URL(request.url).searchParams));},
  async POST(request:Request){
   const url=new URL(request.url);
   if(request.headers.get('origin')!==url.origin)return new Response('Origem não autorizada.',{status:403,headers:privateHeaders});
   if(Number(request.headers.get('content-length'))>4096)return new Response('Requisição muito grande.',{status:413,headers:privateHeaders});
   let input:RecoveryInput|null=null;
   try{input=recoveryInput(await request.formData());}catch{}
   if(!input)return recoveryPage(null);
   try{const auth=await getAuth(),result='token_hash' in input?await auth.verifyOtp({token_hash:input.token_hash,type:'recovery'}):await auth.exchangeCodeForSession(input.code);return new Response(null,{status:303,headers:{...privateHeaders,Location:new URL(result.error?'/acesso?erro=link':PASSWORD_RESET_PATH,url.origin).href}});}catch{return new Response(null,{status:303,headers:{...privateHeaders,Location:new URL('/acesso?erro=link',url.origin).href}});}
  }
 };
}

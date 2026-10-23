import postgres from 'npm:postgres@3.4.9';
import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {handle} from '../../../lib/training/service.ts';
import {getPublicCatalog} from '../../../lib/training/public-catalog.ts';
import {postgresDatabase} from '../../../lib/training/postgres-adapter.ts';
import type {FileBucket} from '../../../lib/training/types.ts';

const base=Deno.env.get('SUPABASE_URL')!;
const secret=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin=createClient(base,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const sql=postgres(Deno.env.get('SUPABASE_DB_URL')!,{ssl:'require',prepare:false,max:1,idle_timeout:20,connect_timeout:15,types:{numeric:{to:1700,from:[20,1700],serialize:(v:unknown)=>String(v),parse:(v:string)=>Number(v)}}});
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, range, x-client-info','Access-Control-Allow-Methods':'GET, POST, PATCH, DELETE, OPTIONS','Access-Control-Expose-Headers':'content-disposition,content-range,content-length,accept-ranges','Cache-Control':'private, no-store'};
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:cors});
const secured=(response:Response)=>{const headers=new Headers(response.headers);for(const [name,value] of Object.entries(cors))headers.set(name,value);return new Response(response.body,{status:response.status,headers});};
const digest=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const equal=(a:string,b:string)=>{let difference=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)difference|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return difference===0;};
async function body(request:Request){
 if(Number(request.headers.get('content-length'))>150000)throw new Error('Requisição muito grande.');
 const reader=request.body?.getReader();if(!reader)return {};
 let text='',bytes=0;const decoder=new TextDecoder();
 while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>150000){await reader.cancel();throw new Error('Requisição muito grande.');}text+=decoder.decode(value,{stream:true});}
 return JSON.parse(text+decoder.decode());
}
function bucket(uploaded:string[]):FileBucket{
 const objectUrl=(key:string)=>base+'/storage/v1/object/training-files/'+key.split('/').map(encodeURIComponent).join('/');
 const auth={apikey:secret,Authorization:'Bearer '+secret};
 return {
  async put(key,data,options){const response=await fetch(objectUrl(key),{method:'POST',headers:{...auth,'Content-Type':options.httpMetadata.contentType,'x-upsert':'false'},body:data,duplex:'half'} as RequestInit);if(!response.ok)throw new Error('Não foi possível armazenar o arquivo.');uploaded.push(key);},
  async delete(key){const {error}=await admin.storage.from('training-files').remove([key]);if(error)throw error;},
  async get(key,options){const {data,error}=await admin.storage.from('training-files').createSignedUrl(key,60,options?.downloadName?{download:options.downloadName}:undefined);if(error){if(['400','404'].includes(String((error as {statusCode?:number}).statusCode)))return null;throw error;}return {body:new ReadableStream<Uint8Array>({start(controller){controller.close();}}),size:0,redirectUrl:data.signedUrl};},
 };
}

async function ownerSetup(request:Request){
 const input=await body(request);if(typeof input.token!=='string'||input.token.length<40||input.token.length>256||typeof input.password!=='string'||input.password.length<12||input.password.length>72)return reply({error:'Link ou senha inválidos. Use uma senha de 12 a 72 caracteres.'},400);
 return sql.begin(async tx=>{
  await tx.unsafe('SET LOCAL search_path TO training, public');
  const rows=await tx.unsafe("SELECT key,value FROM settings WHERE key IN ('owner_setup_hash','owner_setup_expires','owner_email') FOR UPDATE");
  const values=Object.fromEntries(rows.map(row=>[row.key,row.value]));
  if(!values.owner_setup_hash||Date.now()>Number(values.owner_setup_expires)||!equal(await digest(input.token),values.owner_setup_hash))return reply({error:'Link inicial inválido, expirado ou já utilizado.'},410);
  const email=values.owner_email;if(!email)return reply({error:'Administração não configurada.'},409);
  let userId=(await tx.unsafe('SELECT id FROM auth.users WHERE lower(email)=$1',[email.toLowerCase()]))[0]?.id;
  if(userId){const {error}=await admin.auth.admin.updateUserById(userId,{password:input.password,email_confirm:true});if(error)throw error;}
  else {const {data,error}=await admin.auth.admin.createUser({email,password:input.password,email_confirm:true});if(error||!data.user)throw error||new Error('Falha ao criar acesso.');userId=data.user.id;}
  await tx.unsafe('UPDATE administrators SET user_id=$1 WHERE lower(email)=$2',[userId,email.toLowerCase()]);
  await tx.unsafe("DELETE FROM settings WHERE key IN ('owner_setup_hash','owner_setup_expires')");
  return reply({email});
 });
}

Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 try{
  const url=new URL(request.url),path=url.pathname.split('/training-api/')[1]||'';
  if(path==='setup-owner'&&request.method==='POST')return await ownerSetup(request);
  if(path==='public-catalog'&&request.method==='GET'){
   const result=await sql.begin(async tx=>{await tx.unsafe('SET LOCAL search_path TO training, public');return getPublicCatalog(postgresDatabase(async(q,p)=>{const r=await tx.unsafe(q,p as never[]);return {rows:[...r],affectedRows:r.count};}));});
   return reply(result);
  }
  if(path==='health'&&request.method==='GET'){await sql`SELECT 1`;return reply({ready:true,platform:'vercel-supabase'});}
  const token=request.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');
  if(!token)return reply({error:'Entre na plataforma para continuar.'},401);
  const {data:{user},error}=await admin.auth.getUser(token);
  if(error||!user?.email||!user.email_confirmed_at)return reply({error:'Sessão inválida. Entre novamente.'},401);
  const identity={userId:user.id,email:user.email,displayName:user.user_metadata?.name||user.email};
  if(path.startsWith('member-access/')&&request.method==='POST'){
   const input=await body(request);
   if(typeof input.password!=='string'||input.password.length<12||input.password.length>72)return reply({error:'Use uma senha de 12 a 72 caracteres.'},400);
   return await sql.begin(async tx=>{
    await tx.unsafe('SET LOCAL search_path TO training, public');
    if(!(await tx.unsafe('SELECT 1 FROM administrators WHERE user_id=$1',[identity.userId])).length)return reply({error:'Acesso exclusivo da administração.'},403);
    const member=(await tx.unsafe('SELECT m.* FROM members m JOIN companies c ON c.id=m.company_id WHERE m.id=$1 AND m.active=1 AND c.active=1',[path.split('/')[1]]))[0];
    if(!member)return reply({error:'Participante ativo não encontrado.'},404);
    let id=(await tx.unsafe('SELECT id FROM auth.users WHERE lower(email)=$1',[member.email]))[0]?.id;
    if(id){const {error}=await admin.auth.admin.updateUserById(id,{password:input.password,email_confirm:true});if(error)throw error;}
    else {const {data,error}=await admin.auth.admin.createUser({email:member.email,password:input.password,email_confirm:true,user_metadata:{name:member.name}});if(error||!data.user)throw error||new Error('Falha ao criar conta.');id=data.user.id;}
    await tx.unsafe('UPDATE members SET user_id=$1 WHERE id=$2',[id,member.id]);
    return reply({ok:true,message:'Acesso configurado. Entregue a senha ao participante por um canal privado.'});
   });
  }
  if(!/^[a-zA-Z0-9/-]+$/.test(path))return reply({error:'Endereço inválido.'},400);
  const binary=['upload','resource-file'].includes(path);
  const original=binary?request:request.clone();
  for(let retry=0;retry<(binary?1:3);retry++){
   const uploaded:string[]=[],storage=bucket(uploaded);
   try{
    const response=await sql.begin('isolation level serializable',async tx=>{
     await tx.unsafe('SET LOCAL search_path TO training, public');
     let databaseError:unknown;
     const db=postgresDatabase(async(q,p)=>{try{const result=await tx.unsafe(q,p as never[]);return {rows:[...result],affectedRows:result.count};}catch(e){databaseError=e;throw e;}});
     const headers=new Headers(request.headers);headers.set('origin','https://training.internal');
     const req=new Request('https://training.internal/api/training/'+path+url.search,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:binary?original.body:original.clone().body,duplex:'half'} as RequestInit);
     const result=await handle(req,{db,bucket:storage,user:identity,adminEmail:''});
     if(result.status>=500)throw databaseError||new Error('A operação não pôde ser concluída.');
     return result;
    });
    return secured(response);
   }catch(e){for(const key of uploaded)await storage.delete(key).catch(()=>{});if((e as {code?:string}).code==='40001'&&retry<2)continue;throw e;}
  }
  return reply({error:'Tente novamente.'},503);
 }catch(e){console.error('training_api_error',e instanceof Error?e.message:'unknown');return reply({error:'Não foi possível concluir a operação. Tente novamente.'},500);}
});

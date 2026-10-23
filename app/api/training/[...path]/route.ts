import {serverSupabase} from '../../../../lib/supabase/server';
import {assertSameOrigin} from '../../../../lib/training/rules';
export const dynamic='force-dynamic';
export const runtime='nodejs';
async function handler(request:Request){
  try{assertSameOrigin(request);}catch{return Response.json({error:'Origem não autorizada.'},{status:403});}
  const supabase=await serverSupabase();
  const {data:{user}}=await supabase.auth.getUser();
  const {data:{session}}=await supabase.auth.getSession();
  if(!user?.email_confirmed_at||!session)return Response.json({error:'Entre na plataforma para continuar.'},{status:401});
  const url=new URL(request.url),path=url.pathname.split('/api/training/')[1]||'';
  if(!/^[a-zA-Z0-9/-]+$/.test(path))return Response.json({error:'Endereço inválido.'},{status:400});
  const headers=new Headers({Authorization:'Bearer '+session.access_token,apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!});
  for(const name of ['content-type','range']){const value=request.headers.get(name);if(value)headers.set(name,value);}
  const response=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/functions/v1/training-api/'+path+url.search,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:await request.arrayBuffer(),cache:'no-store',redirect:'manual'});
  const output=new Headers({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
  for(const name of ['content-type','content-disposition','content-length','content-range','accept-ranges','location']){const value=response.headers.get(name);if(value)output.set(name,value);}
  return new Response(response.body,{status:response.status,headers:output});
}
export const GET=handler;export const POST=handler;export const PATCH=handler;export const DELETE=handler;

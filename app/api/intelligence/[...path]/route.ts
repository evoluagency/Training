import {serverSupabase} from '../../../../lib/supabase/server';
import {assertSameOrigin} from '../../../../lib/training/rules';
import {forwardToIntelligence,intelligenceBaseUrl,localPreviewEnabled,resolveIntelligenceRoute,MAX_BODY_BYTES} from '../../../../lib/intelligence/gateway';
export const dynamic='force-dynamic';
export const runtime='nodejs';

const fail=(status:number,error:string)=>Response.json({error},{status,headers:{'Cache-Control':'private, no-store'}});

/** Papel do usuário pelo mesmo serviço que o portal usa (training-api /me). */
async function trainingRole(accessToken:string):Promise<string|null>{
  const response=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/functions/v1/training-api/me',{headers:{Authorization:'Bearer '+accessToken,apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!},cache:'no-store'});
  if(!response.ok)return null;
  const me=await response.json().catch(()=>null) as {role?:unknown}|null;
  return typeof me?.role==='string'?me.role:null;
}

async function handler(request:Request){
  try{assertSameOrigin(request);}catch{return fail(403,'ORIGIN_NOT_ALLOWED');}
  const url=new URL(request.url),path=url.pathname.split('/api/intelligence/')[1]||'';
  const route=resolveIntelligenceRoute(request.method,path);
  if(!route)return fail(404,'NOT_FOUND');
  if(request.method==='POST'&&!(request.headers.get('content-type')||'').startsWith('application/json'))return fail(415,'CONTENT_TYPE');
  if(!localPreviewEnabled()){
    if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return fail(401,'SIGN_IN_REQUIRED');
    const supabase=await serverSupabase();
    const {data:{user}}=await supabase.auth.getUser();
    const {data:{session}}=await supabase.auth.getSession();
    if(!user?.email_confirmed_at||!session)return fail(401,'SIGN_IN_REQUIRED');
    const role=await trainingRole(session.access_token);
    if(!role||role==='unassigned')return fail(403,'NO_ACCESS');
    if(route.access==='admin'&&role!=='admin')return fail(403,'ADMIN_ONLY');
  }
  const base=intelligenceBaseUrl(process.env.INTELLIGENCE_AVATAR_URL);
  if(!base)return fail(503,'INTELLIGENCE_UNAVAILABLE');
  const length=Number(request.headers.get('content-length')||0);
  if(length>MAX_BODY_BYTES)return fail(413,'BODY_TOO_LARGE');
  const body=request.method==='POST'?await request.text():'';
  return forwardToIntelligence({route,base,body});
}
export const GET=handler;export const POST=handler;

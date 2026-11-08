import postgres from 'npm:postgres@3.4.9';
import {createTrainingSessionAuthority} from './session-authority.mjs';

// Isolated function. No alteration to the deployed training-api.
let authority: {fetch(request: Request): Promise<Response>} | null=null;
try{
 const key=JSON.parse(Deno.env.get('EVOLU_INTELLIGENCE_SESSION_ED25519_PUBLIC_JWK')||'null');
 if(Deno.env.get('SUPABASE_URL')!=='https://ljuqbkwsnouthzwrzszy.supabase.co')throw Error('wrong project');
 const databaseUrl=Deno.env.get('SUPABASE_DB_URL');
 if(!databaseUrl)throw Error('database unavailable');
 const sql=postgres(databaseUrl,{ssl:'require',prepare:false,max:1,idle_timeout:10,connect_timeout:4});
 authority=createTrainingSessionAuthority({
  publicKeyJwk:key,
  async checkSession({subject,sessionId}){
   const rows=await sql.unsafe(
    'SELECT EXISTS(SELECT 1 FROM auth.sessions WHERE id=$1::uuid AND user_id=$2::uuid AND (not_after IS NULL OR not_after>now())) AS active',
    [sessionId,subject]
   );
   return rows.length===1&&rows[0].active===true;
  }
 });
}catch{
 // Fail closed: absent public key or database config never grants access.
}
Deno.serve((request:Request)=>authority?.fetch(request)??Response.json({error:'AUTH_UNAVAILABLE'},{
 status:503,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}
}));

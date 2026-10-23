import {cache} from 'react';
import {serverSupabase} from '../lib/supabase/server';
export const getTrainingUser=cache(async()=>{
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return null;
  const {data:{user}}=await (await serverSupabase()).auth.getUser();
  if(!user?.email||!user.email_confirmed_at)return null;
  return {userId:user.id,email:user.email,displayName:user.user_metadata?.name||user.email,fullName:user.user_metadata?.name||null};
});
export function safeReturnTo(value:string){
  if(!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return '/entrada';
  const url=new URL(value,'https://training.local');
  return url.origin==='https://training.local'&&!url.pathname.startsWith('/auth/')&&(!url.pathname.startsWith('/acesso')||url.pathname==='/acesso/definir-senha')?url.pathname+url.search:'/entrada';
}
export const trainingSignInPath=(returnTo='/entrada')=>'/acesso?next='+encodeURIComponent(safeReturnTo(returnTo));

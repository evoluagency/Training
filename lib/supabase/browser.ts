'use client';
import {createBrowserClient} from '@supabase/ssr';
export function browserSupabase(){return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);}
export const trainingApiUrl=()=>process.env.NEXT_PUBLIC_SUPABASE_URL+'/functions/v1/training-api';
export async function uploadTrainingFile(path:string,file:File,mime:string){
  const {data}=await browserSupabase().auth.getSession();
  if(!data.session)throw new Error('Entre na plataforma para enviar arquivos.');
  return fetch(trainingApiUrl()+'/'+path,{method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,'Content-Type':mime},body:file});
}

import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
export async function proxy(request:NextRequest){
  let response=NextResponse.next({request});
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return response;
  const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values){for(const c of values)request.cookies.set(c.name,c.value);response=NextResponse.next({request});for(const c of values)response.cookies.set(c.name,c.value,c.options);}}});
  await supabase.auth.getUser();response.headers.set('Cache-Control','private, no-store');return response;
}
export const config={matcher:['/admin/:path*','/area/:path*','/entrada','/acesso/:path*']};

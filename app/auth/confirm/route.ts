import {NextResponse} from 'next/server';
import {serverSupabase} from '../../../lib/supabase/server';
import {safeReturnTo} from '../../auth';
export async function GET(request:Request){
  const url=new URL(request.url),supabase=await serverSupabase();
  const code=url.searchParams.get('code'),token=url.searchParams.get('token_hash');
  const result=code?await supabase.auth.exchangeCodeForSession(code):token?await supabase.auth.verifyOtp({token_hash:token,type:'recovery'}):{error:new Error('Link inválido')};
  return NextResponse.redirect(new URL(result.error?'/acesso?erro=link':safeReturnTo(url.searchParams.get('next')||'/entrada'),url.origin));
}

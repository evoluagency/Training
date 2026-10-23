'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {browserSupabase} from '../../../lib/supabase/browser';
import {readRecoveryFragment} from '../../../lib/supabase/recovery';
const invalidLink='Este link expirou ou já foi utilizado. Solicite um novo e-mail de recuperação.';
export default function Password(){
 const router=useRouter(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[email,setEmail]=useState('');
 useEffect(()=>{
  let active=true;
  const fragment=readRecoveryFragment(window.location.hash);
  // Clear callback credentials before the SSR client can auto-detect the URL.
  if(window.location.hash)window.history.replaceState(null,'',window.location.pathname);
  const client=browserSupabase();
  (async()=>{
   if(fragment&&'error' in fragment)throw new Error(invalidLink);
   if(fragment){const {error}=await client.auth.setSession({access_token:fragment.accessToken,refresh_token:fragment.refreshToken});if(error)throw new Error(invalidLink);}
   const {data:{user},error}=await client.auth.getUser();
   if(error||!user?.email)throw new Error(invalidLink);
   if(active)setEmail(user.email);
  })().catch(()=>{if(active)setError(invalidLink);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[]);
 return <main className="ev-setup">
  <img src="/brand/evolu-black.png" alt="EVOLU" width={155}/>
  <span className="ev-setup-eyebrow">TRAINING / RECUPERAÇÃO DE ACESSO</span>
  <h1>Vamos recuperar seu acesso.</h1>
  <p>Crie sua nova senha para voltar à plataforma.</p>
  {loading&&<p role="status">Conferindo seu link de recuperação…</p>}
  {error&&<p role="alert">{error}</p>}
  {email&&<><p className="ev-setup-account">Conta: <strong>{email}</strong></p>
   <form onSubmit={async e=>{
    e.preventDefault();setBusy(true);setError('');
    const data=new FormData(e.currentTarget);
    try{
     if(data.get('password')!==data.get('confirmation'))throw new Error('As senhas precisam ser iguais.');
     const {data:{user}}=await browserSupabase().auth.getUser();
     if(!user||user.email!==email)throw new Error(invalidLink);
     const {error}=await browserSupabase().auth.updateUser({password:String(data.get('password'))});
     if(error)throw new Error('Não foi possível salvar a senha. Confira os requisitos e tente novamente.');
     router.replace('/entrada');router.refresh();
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.');}finally{setBusy(false);}
   }}>
    <label>Nova senha<input name="password" type="password" minLength={12} maxLength={72} autoComplete="new-password" required aria-describedby="password-help"/></label>
    <label>Confirme a nova senha<input name="confirmation" type="password" minLength={12} maxLength={72} autoComplete="new-password" required/></label>
    <small id="password-help">Use uma senha de 12 a 72 caracteres.</small>
    <button disabled={busy||loading}>{busy?'Salvando sua senha…':'Salvar senha e entrar →'}</button>
   </form>
  </>}
  <Link href="/acesso">Voltar ao acesso</Link>
 </main>;
}

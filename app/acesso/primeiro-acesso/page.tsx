'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {browserSupabase,trainingApiUrl} from '../../../lib/supabase/browser';
import {readTrainingResponse} from '../../../lib/training/client-response';
export default function OwnerSetup(){
 const router=useRouter(),[token,setToken]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{setToken(new URLSearchParams(window.location.hash.slice(1)).get('token')||'');window.history.replaceState(null,'',window.location.pathname)},[]);
 return <main className="ev-setup"><img src="/brand/evolu-black.png" alt="EVOLU" width={155}/><h1>Configure seu acesso</h1><p>Crie a senha da administração da Evolu Training. Este link só pode ser usado uma vez.</p>{error&&<p role="alert">{error}</p>}{token?<form onSubmit={async e=>{e.preventDefault();const values=new FormData(e.currentTarget),password=String(values.get('password'));if(password!==values.get('confirmation')){setError('As senhas precisam ser iguais.');return;}setBusy(true);setError('');try{const data=await readTrainingResponse<{email:string}>(await fetch(trainingApiUrl()+'/setup-owner',{method:'POST',headers:{'Content-Type':'application/json',apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!},body:JSON.stringify({token,password})}));const {error}=await browserSupabase().auth.signInWithPassword({email:data.email,password});if(error)throw error;router.replace('/admin');router.refresh();}catch(e){setError(e instanceof Error?e.message:'Não foi possível configurar.');}finally{setBusy(false);}}}><label>Nova senha<input name="password" type="password" minLength={12} maxLength={72} autoComplete="new-password" required/></label><label>Confirme a senha<input name="confirmation" type="password" minLength={12} maxLength={72} autoComplete="new-password" required/></label><button disabled={busy}>{busy?'Configurando…':'Salvar senha e entrar'}</button></form>:<p>Abra o link inicial privado fornecido à administração.</p>}<Link href="/acesso">Voltar ao acesso →</Link></main>;
}

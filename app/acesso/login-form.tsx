'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {browserSupabase,requestPasswordRecovery} from '../../lib/supabase/browser';
export default function LoginForm(){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('erro')==='link')setError('Este link expirou ou já foi utilizado. Solicite um novo e-mail em “Esqueci minha senha”.');},[]);
 return <form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');setNotice('');const data=new FormData(e.currentTarget);try{const result=await browserSupabase().auth.signInWithPassword({email:String(data.get('email')),password:String(data.get('password'))});if(result.error)throw result.error;const next=new URLSearchParams(window.location.search).get('next')||'/entrada';router.replace(next.startsWith('/')&&!next.startsWith('//')&&!next.includes('\\')?next:'/entrada');router.refresh();}catch{setError('Não foi possível entrar. Confira o e-mail e a senha ou solicite a recuperação de acesso.');}finally{setBusy(false);}}}>
 {error&&<p role="alert" className="ev-alert error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 <label>E-mail de acesso<input name="email" type="email" autoComplete="username" required maxLength={254}/></label><label>Senha<input name="password" type="password" autoComplete="current-password" required minLength={8}/></label><button className="ev-access-cta" disabled={busy}>{busy?'Entrando…':'Entrar na plataforma →'}</button>
 <button type="button" className="ev-access-recovery" disabled={busy} onClick={async e=>{const form=e.currentTarget.closest('form'),input=form?.querySelector<HTMLInputElement>('input[name=email]');if(!input?.reportValidity())return;setBusy(true);setError('');setNotice('');try{const {error}=await requestPasswordRecovery(input.value);if(error)throw error;setNotice('Se o e-mail estiver habilitado, você receberá as instruções. Abra a mensagem mais recente para redefinir sua senha.');}catch{setError('Não foi possível solicitar a recuperação agora. Tente novamente em alguns instantes.');}finally{setBusy(false);}}}>Esqueci minha senha</button>
 </form>;
}

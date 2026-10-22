'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
export default function RoleRedirect(){
 const router=useRouter(),[message,setMessage]=useState('Verificando permissões…');
 useEffect(()=>{let mounted=true;fetch('/api/training/me',{cache:'no-store'}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível identificar seu perfil.');if(!mounted)return;if(data.role==='admin')router.replace('/admin');else if(data.role==='learner'||data.role==='manager')router.replace('/area');else router.replace('/area')}).catch(e=>{if(mounted)setMessage(e.message)});return()=>{mounted=false}},[router]);
 return <main style={{minHeight:'100vh',background:'#f5f5f2',display:'grid',placeItems:'center',fontFamily:'Montserrat,Arial,sans-serif',color:'#141819'}}><div role="status" style={{textAlign:'center',padding:30}}><img src="/brand/evolu-black.png" alt="EVOLU" width={145}/><p>{message}</p></div></main>;
}

'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {readTrainingResponse} from '../../lib/training/client-response';
export default function RoleRedirect(){
 const router=useRouter(),[message,setMessage]=useState('Verificando permissões…');
 useEffect(()=>{let mounted=true;fetch('/api/training/me',{cache:'no-store'}).then(async response=>{const data=await readTrainingResponse<{role:string}>(response);if(!mounted)return;router.replace(data.role==='admin'?'/admin':'/area')}).catch(e=>{if(mounted)setMessage(e.message)});return()=>{mounted=false}},[router]);
 return <main style={{minHeight:'100vh',background:'#f5f5f2',display:'grid',placeItems:'center',fontFamily:'Montserrat,Arial,sans-serif',color:'#141819'}}><div role="status" style={{textAlign:'center',padding:30}}><img src="/brand/evolu-black.png" alt="EVOLU" width={145}/><p>{message}</p></div></main>;
}

import {redirect} from 'next/navigation';
export default async function PreviousFlows({searchParams}:{searchParams:Promise<{course?:string}>}){const {course}=await searchParams;redirect(course&&/^[a-f0-9-]{36}$/i.test(course)?'/area/treinamentos/'+course+'/avaliacao':'/area/avaliacoes')}

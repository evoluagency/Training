import {redirect} from 'next/navigation';
import {getChatGPTUser,chatGPTSignInPath} from '../../chatgpt-auth';
import Training from '../../training';
export const dynamic='force-dynamic';
export default async function PreviousFlows({searchParams}:{searchParams:Promise<{course?:string}>}){
 const params=await searchParams;const course=typeof params.course==='string'&&/^[a-f0-9-]{36}$/i.test(params.course)?params.course:undefined;
 const user=await getChatGPTUser();if(!user)redirect(chatGPTSignInPath('/area/classico'));
 return <Training initialCourseId={course}/>;
}
import {redirect} from 'next/navigation';
import {getTrainingUser,trainingSignInPath} from '../auth';
import Portal from '../visual-portal';
export const dynamic='force-dynamic';
export default async function Area({searchParams}:{searchParams:Promise<{course?:string}>}){
 const params=await searchParams;
 const course=typeof params.course==='string'&&/^[a-f0-9-]{36}$/i.test(params.course)?params.course:undefined;
 const user=await getTrainingUser();
 const returnTo=course?'/area?course='+encodeURIComponent(course):'/area';
 if(!user)redirect(trainingSignInPath(returnTo));
 if(course)redirect('/area/treinamentos/'+encodeURIComponent(course));
 return <Portal area="learner"/>;
}

export const metadata={title:'Área do participante'};

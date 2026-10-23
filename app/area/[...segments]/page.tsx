import {isPortalRoute} from '../../../lib/training/navigation';
import {notFound,redirect} from 'next/navigation';
import {getTrainingUser,trainingSignInPath} from '../../auth';
import Portal from '../../visual-portal';
export const dynamic='force-dynamic';
export default async function LearnerRoutes({params}:{params:Promise<{segments:string[]}>}){
 const {segments}=await params;
 const safe=Array.isArray(segments)&&segments.length<=5&&segments.every(s=>/^[a-zA-Z0-9-]{1,100}$/.test(s));
 const target=safe?'/area/'+segments.map(encodeURIComponent).join('/'):'/area';
 if(!safe||!isPortalRoute(target,'learner'))notFound();
 const user=await getTrainingUser();
 if(!user)redirect(trainingSignInPath(target));
 return <Portal area="learner"/>;
}

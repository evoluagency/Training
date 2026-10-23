import {redirect} from 'next/navigation';
import {getTrainingUser,trainingSignInPath} from '../auth';
import RoleRedirect from './role-redirect';
export const dynamic='force-dynamic';
export default async function Entry(){const user=await getTrainingUser();if(!user)redirect(trainingSignInPath('/entrada'));return <RoleRedirect/>}
